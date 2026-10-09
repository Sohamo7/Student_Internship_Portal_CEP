import type { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';

// A real Postgres (PGlite = Postgres compiled to WASM) running the project's
// actual supabase/schema.sql, so Row Level Security is exercised for real —
// not mocked. Supabase-provided pieces (auth.users, auth.uid(), auth.jwt(),
// storage.*, the anon/authenticated roles) are stubbed minimally below.

export interface TestUser {
  id: string;
  email: string;
}

const SCHEMA_PATH = path.resolve(__dirname, '../../supabase/schema.sql');

export async function createTestDb(): Promise<PGlite> {
  // tests/setup.ts fakes a browser (`globalThis.window`) for the localStorage
  // services, which makes PGlite pick its browser code path and crash. These DB
  // tests need no browser stubs; vitest isolates each test file, so removing
  // the stub here does not affect any other file. PGlite is imported only
  // AFTER this, because it detects its environment when first loaded.
  delete (globalThis as { window?: unknown }).window;
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE ROLE service_role NOLOGIN BYPASSRLS;

    CREATE SCHEMA auth;
    CREATE TABLE auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT,
      raw_user_meta_data JSONB DEFAULT '{}'::jsonb
    );
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS
      $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS
      $$ SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;

    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets (
      id TEXT PRIMARY KEY, name TEXT, public BOOLEAN,
      file_size_limit BIGINT, allowed_mime_types TEXT[]
    );
    CREATE TABLE storage.objects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id TEXT, name TEXT, owner UUID
    );
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
  `);

  // pgcrypto isn't bundled with PGlite; gen_random_uuid() is built into Postgres 13+.
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8').replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;/g, '');
  await db.exec(schema);

  await db.exec(`
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
  `);
  return db;
}

async function withIdentity<T>(db: PGlite, user: TestUser | null, run: () => Promise<T>): Promise<T> {
  const claims = user ? JSON.stringify({ sub: user.id, email: user.email, role: 'authenticated' }) : '';
  await db.exec(`
    SET ROLE ${user ? 'authenticated' : 'anon'};
    SELECT set_config('request.jwt.claim.sub', '${user?.id ?? ''}', false);
    SELECT set_config('request.jwt.claims', '${claims}', false);
  `);
  try {
    return await run();
  } finally {
    await db.exec('RESET ROLE;');
  }
}

/** Runs SQL as a signed-in user (or anon when null) with RLS enforced; throws on any DB error. */
export async function as<T = Record<string, unknown>>(
  db: PGlite,
  user: TestUser | null,
  sql: string
): Promise<T[]> {
  return withIdentity(db, user, async () => (await db.query<T>(sql)).rows);
}

/** Like `as`, but returns the database error message (or null when the statement succeeded). */
export async function errorOf(db: PGlite, user: TestUser | null, sql: string): Promise<string | null> {
  try {
    await as(db, user, sql);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}
