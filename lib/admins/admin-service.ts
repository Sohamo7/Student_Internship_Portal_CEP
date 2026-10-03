import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/supabase/types';

// ---------------------------------------------------------------------------
// Admin team management (client side).
//
//  * Supabase configured -> talks to /api/admin/invite (server verifies the
//    caller is an admin and uses the service-role key).
//  * Demo mode -> LOCAL FALLBACK: invites live in localStorage and the invite
//    link is shown on screen; /accept-invite?demo_token=... finishes the flow.
//    No email is sent and nothing leaves this browser.
// ---------------------------------------------------------------------------

const DEMO_INVITES_KEY = 'cep_demo_admin_invites';
const REGISTERED_USERS_KEY = 'cep_registered_users';
const DEMO_ADMIN_EMAIL = 'admin@ngo.org';

export interface AdminMember {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'invited';
  invited_at?: string | null;
  invited_by_email?: string | null;
}

export interface InviteResult {
  success: boolean;
  error?: string;
  /** True when the invite email was actually delivered. */
  emailSent?: boolean;
  /** Present when the admin must pass the link on manually (no email sent). */
  inviteLink?: string;
}

export interface DemoInvite {
  token: string;
  name: string;
  email: string;
  invited_at: string;
  invited_by_email?: string;
}

export function readDemoInvites(): DemoInvite[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(DEMO_INVITES_KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as DemoInvite[]) : [];
  } catch {
    return [];
  }
}

function writeDemoInvites(invites: DemoInvite[]) {
  localStorage.setItem(DEMO_INVITES_KEY, JSON.stringify(invites));
}

function readStoredUsers(): Record<string, { password?: string; profile: UserProfile }> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '{}');
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, { password?: string; profile: UserProfile }>)
      : {};
  } catch {
    return {};
  }
}

/** Demo mode: completes an invite (called by /accept-invite). */
export function acceptDemoInvite(
  token: string,
  name: string,
  password: string
): { success: boolean; error?: string } {
  const invites = readDemoInvites();
  const invite = invites.find((i) => i.token === token);
  if (!invite) return { success: false, error: 'This invite link is invalid or has already been used.' };

  const users = readStoredUsers();
  users[invite.email] = {
    password,
    profile: {
      id: `admin-${Date.now()}`,
      name: name.trim() || invite.name,
      email: invite.email,
      role: 'admin',
      application_status: 'approved',
      created_at: new Date().toISOString(),
      invited_at: invite.invited_at,
      invited_by_email: invite.invited_by_email,
      invite_accepted_at: new Date().toISOString(),
    },
  };
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  writeDemoInvites(invites.filter((i) => i.token !== token));
  return { success: true };
}

export async function fetchAdmins(): Promise<AdminMember[]> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, invited_at, invited_by_email, invite_accepted_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true });
    return ((data as UserProfile[]) || []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      status: p.invited_at && !p.invite_accepted_at ? 'invited' : 'active',
      invited_at: p.invited_at,
      invited_by_email: p.invited_by_email,
    }));
  }

  const members: AdminMember[] = [
    { id: 'demo-admin-uuid-001', name: 'Priya Patel (Director)', email: DEMO_ADMIN_EMAIL, status: 'active' },
  ];
  for (const { profile } of Object.values(readStoredUsers())) {
    if (profile.role === 'admin') {
      members.push({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        status: 'active',
        invited_at: profile.invited_at,
        invited_by_email: profile.invited_by_email,
      });
    }
  }
  for (const inv of readDemoInvites()) {
    members.push({
      id: inv.token,
      name: inv.name,
      email: inv.email,
      status: 'invited',
      invited_at: inv.invited_at,
      invited_by_email: inv.invited_by_email,
    });
  }
  return members;
}

export async function inviteAdmin(name: string, email: string, inviterEmail?: string): Promise<InviteResult> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Could not send the invite.' };
      }
      return { success: true, emailSent: Boolean(data.emailSent), inviteLink: data.inviteLink };
    } catch {
      return { success: false, error: 'Network error while sending the invite.' };
    }
  }

  // ---- LOCAL FALLBACK (demo mode) ----
  const users = readStoredUsers();
  if (cleanEmail === DEMO_ADMIN_EMAIL || users[cleanEmail] || cleanEmail === 'student@ngo.org' || cleanEmail === 'intern@ngo.org') {
    return { success: false, error: 'That email already has an account in the portal. Use a different email address.' };
  }
  const token = crypto.randomUUID();
  const invites = readDemoInvites().filter((i) => i.email !== cleanEmail); // re-invite replaces
  invites.push({
    token,
    name: cleanName,
    email: cleanEmail,
    invited_at: new Date().toISOString(),
    invited_by_email: inviterEmail,
  });
  writeDemoInvites(invites);
  return { success: true, emailSent: false, inviteLink: `${window.location.origin}/accept-invite?demo_token=${token}` };
}

export async function revokeInvite(member: AdminMember): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const res = await fetch(`/api/admin/invite?id=${encodeURIComponent(member.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      return res.ok && data.success ? { success: true } : { success: false, error: data.error || 'Could not revoke.' };
    } catch {
      return { success: false, error: 'Network error.' };
    }
  }
  writeDemoInvites(readDemoInvites().filter((i) => i.token !== member.id));
  return { success: true };
}
