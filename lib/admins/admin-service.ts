import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/supabase/types';

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

export async function fetchAdmins(): Promise<AdminMember[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, invited_at, invited_by_email, invite_accepted_at')
    .eq('role', 'admin')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch admin team:', error.message);
    return [];
  }

  return ((data as UserProfile[]) || []).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    status: p.invited_at && !p.invite_accepted_at ? 'invited' : 'active',
    invited_at: p.invited_at,
    invited_by_email: p.invited_by_email,
  }));
}

export async function inviteAdmin(name: string, email: string): Promise<InviteResult> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase is not configured. Admin invitations require active database and service credentials.',
    };
  }

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

export async function revokeInvite(member: AdminMember): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const res = await fetch(`/api/admin/invite?id=${encodeURIComponent(member.id)}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    return res.ok && data.success ? { success: true } : { success: false, error: data.error || 'Could not revoke invite.' };
  } catch {
    return { success: false, error: 'Network error while revoking invite.' };
  }
}
