import { createBrowserClient } from '@supabase/ssr';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('http') &&
    !url.includes('placeholder') &&
    !anonKey.includes('placeholder') &&
    anonKey !== 'your-anon-key-here'
  );
}

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const problems: string[] = [];
  if (!url || !url.startsWith('http') || url.includes('placeholder')) {
    problems.push('NEXT_PUBLIC_SUPABASE_URL is missing, invalid, or contains placeholder values. Set a valid https://<project>.supabase.co URL.');
  }
  if (!anonKey || anonKey.includes('placeholder') || anonKey === 'your-anon-key-here') {
    problems.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or contains placeholder values. Set a valid anonymous public key.');
  }

  if (problems.length > 0) {
    throw new Error(
      `Supabase configuration error:\n - ${problems.join('\n - ')}\nCheck your .env.local file or production environment settings.`
    );
  }

  return { url: url!, anonKey: anonKey! };
}

export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}

