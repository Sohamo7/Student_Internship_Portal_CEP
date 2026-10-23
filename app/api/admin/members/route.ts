import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/require-admin';

// DELETE /api/admin/members?id=<uuid>
// Permanently removes a student/intern account (auth user + profile row).
// Only callable by a signed-in admin, using the service-role key server-side.

export async function DELETE(request: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) {
    return NextResponse.json(
      { success: false, error: 'Only signed-in admins can delete members.' },
      { status: 403 }
    );
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 }
    );
  }

  const id = request.nextUrl.searchParams.get('id') || '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ success: false, error: 'Invalid member ID.' }, { status: 400 });
  }

  // Admins cannot delete themselves or other admins via this route.
  if (id === caller.id) {
    return NextResponse.json(
      { success: false, error: 'You cannot delete your own account.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify the target is a student/intern — never allow deleting admin accounts here.
  const { data: target } = await admin
    .from('profiles')
    .select('id, role, name')
    .eq('id', id)
    .maybeSingle();

  if (!target) {
    return NextResponse.json(
      { success: false, error: 'Member not found.' },
      { status: 404 }
    );
  }
  if (target.role === 'admin') {
    return NextResponse.json(
      { success: false, error: 'Admin accounts cannot be deleted through this action.' },
      { status: 403 }
    );
  }

  // Delete the auth user — this cascades to delete the profile row too
  // (because the profiles table has a foreign key on auth.users(id) with ON DELETE CASCADE).
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    console.error('[api/admin/members] deleteUser failed:', error.message);
    return NextResponse.json(
      { success: false, error: `Could not delete the member: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, deletedName: target.name });
}
