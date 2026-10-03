import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/require-admin';
import { sendAdminInviteEmail } from '@/lib/email/send';

// Admin invite API. Both handlers re-verify the caller with Supabase on every
// request (see requireAdmin) and use the service-role key server-side only.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function siteOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  return configured || request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) {
    return NextResponse.json({ success: false, error: 'Only signed-in admins can invite admins.' }, { status: 403 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Admin invites are not set up on the server yet: SUPABASE_SERVICE_ROLE_KEY is missing from the environment.',
      },
      { status: 503 }
    );
  }

  let body: { name?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }
  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  if (!name || !EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, error: 'Enter a name and a valid email address.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Does this email already have an account?
  const { data: existing } = await admin
    .from('profiles')
    .select('id, role, invited_at, invite_accepted_at')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    const pendingInvite = existing.role === 'admin' && existing.invited_at && !existing.invite_accepted_at;
    if (!pendingInvite) {
      return NextResponse.json(
        { success: false, error: 'That email already has an account in the portal. Use a different email address.' },
        { status: 409 }
      );
    }
    // Re-inviting someone whose earlier invite was never accepted = "resend":
    // drop the unused account and issue a fresh link.
    const { error: delErr } = await admin.auth.admin.deleteUser(existing.id);
    if (delErr) {
      return NextResponse.json({ success: false, error: 'Could not refresh the earlier invite.' }, { status: 500 });
    }
  }

  const redirectTo = `${siteOrigin(request)}/accept-invite`;
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { data: { name }, redirectTo },
  });
  const actionLink = link?.properties?.action_link;
  const newUserId = link?.user?.id;
  if (linkErr || !actionLink || !newUserId) {
    console.error('[api/admin/invite] generateLink failed:', linkErr);
    return NextResponse.json(
      { success: false, error: linkErr?.message || 'Could not create the invite.' },
      { status: 500 }
    );
  }

  // The on-signup trigger created a pending *student* profile. Promote it.
  const now = new Date().toISOString();
  const { error: promoteErr } = await admin
    .from('profiles')
    .update({
      name,
      role: 'admin',
      application_status: 'approved',
      reviewed_at: now,
      invited_at: now,
      invited_by_email: caller.email,
      invite_accepted_at: null,
    })
    .eq('id', newUserId);
  if (promoteErr) {
    console.error('[api/admin/invite] promote failed:', promoteErr);
    await admin.auth.admin.deleteUser(newUserId); // roll back so no half-made account is left
    return NextResponse.json({ success: false, error: 'Could not set up the admin account.' }, { status: 500 });
  }

  const mail = await sendAdminInviteEmail(email, name, actionLink, caller.name || caller.email);

  // If email isn't configured (or failed), hand the one-time link back to the
  // inviting admin so they can send it themselves. It is never returned when
  // the email went out normally.
  return NextResponse.json({
    success: true,
    emailSent: mail.sent,
    inviteLink: mail.sent ? undefined : actionLink,
    emailError: mail.error,
  });
}

// Revoke an invite that has not been accepted yet.
export async function DELETE(request: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) {
    return NextResponse.json({ success: false, error: 'Only signed-in admins can do this.' }, { status: 403 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ success: false, error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY.' }, { status: 503 });
  }

  const id = request.nextUrl.searchParams.get('id') || '';
  if (!/^[0-9a-f-]{36}$/i.test(id) || id === caller.id) {
    return NextResponse.json({ success: false, error: 'Invalid invite.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: target } = await admin
    .from('profiles')
    .select('id, role, invited_at, invite_accepted_at')
    .eq('id', id)
    .maybeSingle();

  // Only unaccepted invites can be revoked — never an active admin.
  if (!target || target.role !== 'admin' || !target.invited_at || target.invite_accepted_at) {
    return NextResponse.json({ success: false, error: 'Only pending invites can be revoked.' }, { status: 400 });
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ success: false, error: 'Could not revoke the invite.' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
