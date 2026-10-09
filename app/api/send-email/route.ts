import { NextRequest, NextResponse } from 'next/server';
import {
  sendApplicationSubmittedEmail,
  sendApplicationApprovedEmail,
  sendProjectAssignedEmail,
} from '@/lib/email/send';
import { clampText, createThrottle, normalizeEmail } from '@/lib/email/guard';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/require-admin';

// Notification emails (application received / approved / project assigned).
//
// This route is reachable by anyone on the internet, so it must never act as
// an open mail relay:
//   • "approved" and "project assigned" mails can only be triggered by a
//     signed-in admin (verified with Supabase, not the forgeable role cookie).
//   • "application received" is triggered by the applicant right after they
//     submit the Apply form, before they have a session. It is only sent when a
//     very recent *pending* application really exists for that address, and the
//     greeting uses the name stored with that application — not request text.
//   • Every field is length-capped and HTML-escaped in the templates, and each
//     (type, recipient) pair is rate limited.

const throttle = createThrottle(30_000);
const RECENT_APPLICATION_WINDOW_MS = 15 * 60 * 1000;

type EmailType = 'application_submitted' | 'application_approved' | 'project_assigned';

interface EmailRequestBody {
  type?: unknown;
  to?: unknown;
  name?: unknown;
  projectTitle?: unknown;
  supervisorName?: unknown;
  supervisorEmail?: unknown;
}

const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });

/** Name stored with a pending application created in the last few minutes, or null. */
async function findRecentPendingApplicant(email: string): Promise<string | null> {
  if (!isServiceRoleConfigured()) {
    console.warn(
      '[api/send-email] SUPABASE_SERVICE_ROLE_KEY is not set, so "application received" emails cannot be verified and are skipped.'
    );
    return null;
  }
  const since = new Date(Date.now() - RECENT_APPLICATION_WINDOW_MS).toISOString();
  const { data } = await createAdminClient()
    .from('profiles')
    .select('name')
    .eq('email', email)
    .eq('application_status', 'pending')
    .gte('created_at', since)
    .maybeSingle();
  return data?.name ?? null;
}

export async function POST(request: NextRequest) {
  let body: EmailRequestBody;
  try {
    body = await request.json();
  } catch {
    return fail('Invalid JSON body.', 400);
  }

  const type = body?.type as EmailType | undefined;
  const to = normalizeEmail(body?.to);
  let name = clampText(body?.name, 100);
  if (!type || !to || !name) return fail('Missing or invalid fields.', 400);
  if (type !== 'application_submitted' && type !== 'application_approved' && type !== 'project_assigned') {
    return fail('Unknown email type.', 400);
  }

  // ---- Authorisation (real Supabase deployments) ----
  if (isSupabaseConfigured()) {
    if (type === 'application_submitted') {
      const storedName = await findRecentPendingApplicant(to);
      if (!storedName) {
        // Same response as success so this can't be used to probe which emails have applied.
        return NextResponse.json({ success: true, sent: false, skipped: true });
      }
      name = storedName;
    } else if (!(await requireAdmin())) {
      return fail('Only signed-in admins can send this notification.', 403);
    }
  }

  if (!throttle.allow(`${type}:${to}`)) {
    return fail('Too many emails for this recipient. Please wait a moment.', 429);
  }

  try {
    switch (type) {
      case 'application_submitted':
        return NextResponse.json({ success: true, ...(await sendApplicationSubmittedEmail(to, name)) });
      case 'application_approved':
        return NextResponse.json({ success: true, ...(await sendApplicationApprovedEmail(to, name)) });
      case 'project_assigned': {
        const projectTitle = clampText(body.projectTitle, 200);
        const supervisorName = clampText(body.supervisorName, 100);
        const supervisorEmail = normalizeEmail(body.supervisorEmail);
        if (!projectTitle || !supervisorName || !supervisorEmail) {
          return fail('Missing project assignment fields.', 400);
        }
        return NextResponse.json({
          success: true,
          ...(await sendProjectAssignedEmail(to, name, projectTitle, supervisorName, supervisorEmail)),
        });
      }
    }
  } catch (err) {
    console.error('[api/send-email] failed:', err);
    return fail('Failed to send email.', 500);
  }
}
