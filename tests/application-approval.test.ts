import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateJoineeId } from '@/lib/applications/application-service';
import { UserProfile } from '@/lib/supabase/types';

// Approval writes to Supabase; here the Supabase client is faked so we can
// simulate the database refusing the change (ID collision, no permission).

const db = vi.hoisted(() => ({
  results: [] as Array<{ data: unknown; error: { code?: string; message: string } | null }>,
  updates: [] as Array<Record<string, unknown>>,
  profiles: [] as unknown[],
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => true,
  createClient: () => ({
    from: () => {
      const chain: Record<string, unknown> = {};
      chain.select = () => chain; // fetchApplications() path
      chain.in = () => chain;
      chain.order = async () => ({ data: db.profiles });
      chain.update = (values: Record<string, unknown>) => {
        db.updates.push(values);
        const result = db.results.shift() ?? { data: [{ id: 'x' }], error: null };
        const update: Record<string, unknown> = {};
        update.eq = () => update;
        update.select = async () => result;
        return update;
      };
      return chain;
    },
  }),
}));

import { updateApplicationStatus } from '@/lib/applications/application-service';

const applicant = { id: 'a1', email: 'a@x.org', role: 'student' as const };

beforeEach(() => {
  db.results = [];
  db.updates = [];
  db.profiles = [];
});

describe('updateApplicationStatus (Supabase mode)', () => {
  it('reports success and the new joinee ID when the database accepts the change', async () => {
    const result = await updateApplicationStatus(applicant, 'approved');
    expect(result.ok).toBe(true);
    expect(result.ok && result.joinee_id).toMatch(/^STU-\d{8}-001$/);
  });

  it('retries with the next number when another admin just took the same joinee ID', async () => {
    db.results = [{ data: null, error: { code: '23505', message: 'duplicate key value' } }];
    const result = await updateApplicationStatus(applicant, 'approved');
    expect(result.ok).toBe(true);
    expect(db.updates).toHaveLength(2);
    expect(db.updates[0].joinee_id).not.toBe(db.updates[1].joinee_id);
  });

  it('does NOT claim success when the database rejects the change', async () => {
    db.results = [{ data: null, error: { code: '42501', message: 'permission denied' } }];
    const result = await updateApplicationStatus(applicant, 'approved');
    expect(result).toEqual({ ok: false, error: 'permission denied' });
  });

  it('does NOT claim success when row-level security silently updates zero rows', async () => {
    db.results = [{ data: [], error: null }];
    const result = await updateApplicationStatus(applicant, 'approved');
    expect(result.ok).toBe(false);
  });

  it('gives up with a clear message if the ID keeps colliding', async () => {
    db.results = Array.from({ length: 5 }, () => ({ data: null, error: { code: '23505', message: 'dup' } }));
    const result = await updateApplicationStatus(applicant, 'approved');
    expect(result).toEqual({ ok: false, error: 'Could not assign a unique joinee ID. Please try again.' });
  });

  it('rejecting an application does not invent a joinee ID', async () => {
    const result = await updateApplicationStatus(applicant, 'rejected');
    expect(result.ok && result.joinee_id).toBeNull();
    expect(db.updates[0].joinee_id).toBeNull();
  });
});

describe('generateJoineeId', () => {
  const day = '2026-10-03T09:00:00.000Z';
  const existing = [{ joinee_id: 'STU-20261003-001' }, { joinee_id: 'INT-20261003-002' }] as UserProfile[];

  it('continues the sequence for the day and uses the role prefix', () => {
    expect(generateJoineeId('intern', day, existing)).toBe('INT-20261003-003');
    expect(generateJoineeId('student', day, [])).toBe('STU-20261003-001');
  });

  it('offset steps past a number someone else just took', () => {
    expect(generateJoineeId('student', day, existing, 1)).toBe('STU-20261003-004');
  });
});
