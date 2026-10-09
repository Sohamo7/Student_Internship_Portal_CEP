// SERVER-ONLY. Verifies, against Supabase, that the request really comes from a
// signed-in admin. The portal's `cep_user_role` cookie is only a UI/routing
// convenience set by the browser and can be forged, so API routes that do
// privileged work must NOT trust it — they call this instead.
import { createClient } from '@/lib/supabase/server';

export interface VerifiedAdmin {
  id: string;
  email: string;
  name: string;
}

export async function requireAdmin(): Promise<VerifiedAdmin | null> {
  try {
    const supabase = await createClient();
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name, email')
      .eq('id', userData.user.id)
      .single();

    if (!profile || profile.role !== 'admin') return null;
    return {
      id: userData.user.id,
      email: profile.email || userData.user.email || '',
      name: profile.name || '',
    };
  } catch {
    return null;
  }
}
