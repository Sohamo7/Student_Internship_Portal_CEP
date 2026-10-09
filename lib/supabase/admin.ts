// SERVER-ONLY. Never import this from a 'use client' file.
// The service-role key bypasses Row Level Security and can create/delete auth
// users, so it must only ever be read in API routes / server code. It is
// deliberately NOT prefixed with NEXT_PUBLIC_ so Next.js never ships it to the
// browser.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function isServiceRoleConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(
    url && url.startsWith('http') && !url.includes('placeholder') && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
