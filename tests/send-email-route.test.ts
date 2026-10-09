import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// The route is exercised for real; only its three outside dependencies
// (Supabase config, the admin check, the database lookup, and Resend) are mocked.

const mocks = vi.hoisted(() => ({
  supabaseConfigured: true,
  admin: null as null | { id: string; email: string; name: string },
  pendingApplicant: null as null | { name: string },
  serviceRole: true,
  sent: [] as Array<{ kind: string; to: string; name: string }>,
}));

vi.mock('@/lib/supabase/client', () => ({ isSupabaseConfigured: () => mocks.supabaseConfigured }));
vi.mock('@/lib/supabase/require-admin', () => ({ requireAdmin: async () => mocks.admin }));
vi.mock('@/lib/supabase/admin', () => ({
  isServiceRoleConfigured: () => mocks.serviceRole,
  createAdminClient: () => ({
    from: () => {
      const chain: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'gte']) chain[m] = () => chain;
      chain.maybeSingle = async () => ({ data: mocks.pendingApplicant });
      return chain;
    },
  }),
}));
vi.mock('@/lib/email/send', () => ({
  sendApplicationSubmittedEmail: async (to: string, name: string) => (mocks.sent.push({ kind: 'submitted', to, name }), { sent: true }),
  sendApplicationApprovedEmail: async (to: string, name: string) => (mocks.sent.push({ kind: 'approved', to, name }), { sent: true }),
  sendProjectAssignedEmail: async (to: string, name: string) => (mocks.sent.push({ kind: 'assigned', to, name }), { sent: true }),
}));

import { POST } from '@/app/api/send-email/route';

let counter = 0;
const uniqueEmail = () => `person${++counter}@example.org`; // unique so the rate limiter never interferes
const call = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/send-email', { method: 'POST', body: JSON.stringify(body) }));

beforeEach(() => {
  mocks.supabaseConfigured = true;
  mocks.admin = null;
  mocks.pendingApplicant = null;
  mocks.serviceRole = true;
  mocks.sent.length = 0;
});

describe('POST /api/send-email', () => {
  it('rejects malformed input', async () => {
    expect((await call({ type: 'application_approved', to: 'not-an-email', name: 'A' })).status).toBe(400);
    expect((await call({ type: 'who-knows', to: uniqueEmail(), name: 'A' })).status).toBe(400);
    expect((await call({ type: 'application_approved', to: uniqueEmail() })).status).toBe(400);
    expect(mocks.sent).toHaveLength(0);
  });

  it('is NOT an open relay: an anonymous caller cannot send "approved" or "assigned" emails', async () => {
    expect((await call({ type: 'application_approved', to: uniqueEmail(), name: 'A' })).status).toBe(403);
    const assigned = await call({ type: 'project_assigned', to: uniqueEmail(), name: 'A', projectTitle: 'P', supervisorName: 'S', supervisorEmail: 's@x.org' });
    expect(assigned.status).toBe(403);
    expect(mocks.sent).toHaveLength(0);
  });

  it('lets a signed-in admin send approval and assignment emails', async () => {
    mocks.admin = { id: 'a', email: 'admin@x.org', name: 'Admin' };
    const to = uniqueEmail();
    expect((await call({ type: 'application_approved', to, name: 'Asha' })).status).toBe(200);
    const assigned = await call({ type: 'project_assigned', to: uniqueEmail(), name: 'Asha', projectTitle: 'P', supervisorName: 'S', supervisorEmail: 's@x.org' });
    expect(assigned.status).toBe(200);
    expect(mocks.sent.map((s) => s.kind)).toEqual(['approved', 'assigned']);
  });

  it('an assignment email must include valid project + supervisor details', async () => {
    mocks.admin = { id: 'a', email: 'admin@x.org', name: 'Admin' };
    const res = await call({ type: 'project_assigned', to: uniqueEmail(), name: 'A', projectTitle: 'P', supervisorName: 'S', supervisorEmail: 'bad' });
    expect(res.status).toBe(400);
  });

  it('"application received" is skipped (silently) when there is no recent pending application', async () => {
    const res = await call({ type: 'application_submitted', to: uniqueEmail(), name: 'Victim' });
    expect(await res.json()).toMatchObject({ success: true, skipped: true });
    expect(mocks.sent).toHaveLength(0);
  });

  it('"application received" is sent to a real applicant using the STORED name, not the request text', async () => {
    mocks.pendingApplicant = { name: 'Real Applicant' };
    const to = uniqueEmail();
    const res = await call({ type: 'application_submitted', to, name: '<script>evil</script>' });
    expect(res.status).toBe(200);
    expect(mocks.sent).toEqual([{ kind: 'submitted', to, name: 'Real Applicant' }]);
  });

  it('cannot verify applicants without the service-role key, so it sends nothing', async () => {
    mocks.serviceRole = false;
    mocks.pendingApplicant = { name: 'Real Applicant' };
    await call({ type: 'application_submitted', to: uniqueEmail(), name: 'x' });
    expect(mocks.sent).toHaveLength(0);
  });

  it('rate-limits repeat emails to the same recipient', async () => {
    mocks.admin = { id: 'a', email: 'admin@x.org', name: 'Admin' };
    const to = uniqueEmail();
    expect((await call({ type: 'application_approved', to, name: 'A' })).status).toBe(200);
    expect((await call({ type: 'application_approved', to, name: 'A' })).status).toBe(429);
  });

  it('demo mode (no Supabase) keeps working without sign-in', async () => {
    mocks.supabaseConfigured = false;
    expect((await call({ type: 'application_approved', to: uniqueEmail(), name: 'A' })).status).toBe(200);
  });
});
