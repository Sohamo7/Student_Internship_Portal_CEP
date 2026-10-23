// SERVER-ONLY. Never import this from a 'use client' file.
// The service-role key bypasses Row Level Security and can create/delete auth
// users, so it must only ever be read in API routes / server code. It is
// deliberately NOT prefixed with NEXT_PUBLIC_ so Next.js never ships it to the
// browser.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function isServiceRoleConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(
    url &&
    url.startsWith('http') &&
    !url.includes('placeholder') &&
    key &&
    !key.includes('placeholder') &&
    key !== 'your-service-role-key-here'
  );
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !url.startsWith('http') || url.includes('placeholder')) {
    throw new Error('Supabase admin error: NEXT_PUBLIC_SUPABASE_URL is missing or contains placeholder values.');
  }
  if (!key || key.includes('placeholder') || key === 'your-service-role-key-here') {
    throw new Error('Supabase admin error: SUPABASE_SERVICE_ROLE_KEY is missing or contains placeholder values.');
  }

  return createSupabaseClient(
    url,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

