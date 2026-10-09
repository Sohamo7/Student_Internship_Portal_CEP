import { beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { as, createTestDb, errorOf, TestUser } from './helpers/pg';

// Runs the REAL supabase/schema.sql in Postgres and checks who can do what.
// The first test in each group is the regression guard for the bug that made
// every query on `profiles` fail with "infinite recursion detected in policy".

const student: TestUser = { id: '11111111-1111-4111-8111-111111111111', email: 'student@x.org' };
const other: TestUser = { id: '22222222-2222-4222-8222-222222222222', email: 'other@x.org' };
const admin: TestUser = { id: '33333333-3333-4333-8333-333333333333', email: 'admin@x.org' };
const invitee: TestUser = { id: '44444444-4444-4444-8444-444444444444', email: 'invitee@x.org' };
const pending: TestUser = { id: '55555555-5555-4555-8555-555555555555', email: 'pending@x.org' };

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
  // Sign-ups go through the real on_auth_user_created trigger.
  for (const u of [student, other, admin, invitee, pending]) {
    await db.exec(`INSERT INTO auth.users (id, email, raw_user_meta_data)
                   VALUES ('${u.id}', '${u.email}', '{"name": "${u.email.split('@')[0]}"}')`);
  }
  await db.exec(`
    UPDATE public.profiles SET application_status = 'approved' WHERE id IN ('${student.id}', '${other.id}');
    UPDATE public.profiles SET role = 'admin', application_status = 'approved' WHERE id = '${admin.id}';
    UPDATE public.profiles SET role = 'admin', application_status = 'approved', invited_at = NOW()
      WHERE id = '${invitee.id}';
  `);
}, 60_000);

describe('profiles — no recursion, correct visibility', () => {
  it('a student can read their own profile (regression: infinite recursion in policy)', async () => {
    const rows = await as<{ role: string }>(db, student, `SELECT role FROM public.profiles WHERE id = '${student.id}'`);
    expect(rows).toHaveLength(1);
    expect(rows[0].role).toBe('student');
  });

  it("a student cannot see anyone else's profile", async () => {
    const rows = await as(db, student, `SELECT id FROM public.profiles WHERE id <> '${student.id}'`);
    expect(rows).toHaveLength(0);
  });

  it('an admin can read every profile', async () => {
    const rows = await as(db, admin, `SELECT id FROM public.profiles`);
    expect(rows).toHaveLength(5);
  });

  it('anonymous visitors cannot read profiles', async () => {
    expect(await as(db, null, `SELECT id FROM public.profiles`)).toHaveLength(0);
  });
});

describe('profiles — self-service edits are locked down', () => {
  it('a student can update harmless personal details', async () => {
    const rows = await as(db, student, `UPDATE public.profiles SET phone = '+91 98765 12345', college = 'COEP' WHERE id = '${student.id}' RETURNING id`);
    expect(rows).toHaveLength(1);
  });

  it('a student cannot promote themselves to admin', async () => {
    expect(await errorOf(db, student, `UPDATE public.profiles SET role = 'admin' WHERE id = '${student.id}'`)).toMatch(/protected profile fields/);
  });

  it('a pending applicant cannot approve their own application', async () => {
    expect(await errorOf(db, pending, `UPDATE public.profiles SET application_status = 'approved' WHERE id = '${pending.id}'`)).toMatch(/protected profile fields/);
    const [row] = await as<{ application_status: string }>(db, admin, `SELECT application_status FROM public.profiles WHERE id = '${pending.id}'`);
    expect(row.application_status).toBe('pending');
  });

  it('a student cannot rewrite their email or résumé path', async () => {
    expect(await errorOf(db, student, `UPDATE public.profiles SET email = 'ceo@x.org' WHERE id = '${student.id}'`)).toMatch(/protected/);
    expect(await errorOf(db, student, `UPDATE public.profiles SET resume_path = 'applications/${other.id}/cv.pdf' WHERE id = '${student.id}'`)).toMatch(/protected/);
  });

  it('a student cannot give themselves a joinee ID or join date', async () => {
    expect(await errorOf(db, student, `UPDATE public.profiles SET joinee_id = 'ADM-20260101-001' WHERE id = '${student.id}'`)).toMatch(/protected/);
    expect(await errorOf(db, student, `UPDATE public.profiles SET joined_at = NOW() WHERE id = '${student.id}'`)).toMatch(/protected/);
  });

  it('an admin can assign a joinee ID, and the same ID cannot be issued twice', async () => {
    const ok = await as(db, admin, `UPDATE public.profiles SET joinee_id = 'STU-20261003-001', joined_at = NOW() WHERE id = '${student.id}' RETURNING joinee_id`);
    expect(ok).toEqual([{ joinee_id: 'STU-20261003-001' }]);
    expect(await errorOf(db, admin, `UPDATE public.profiles SET joinee_id = 'STU-20261003-001' WHERE id = '${other.id}'`)).toMatch(/duplicate key|unique/);
  });

  it("a student cannot edit someone else's profile", async () => {
    const rows = await as(db, student, `UPDATE public.profiles SET name = 'hacked' WHERE id = '${other.id}' RETURNING id`);
    expect(rows).toHaveLength(0);
  });

  it('an admin can approve an application', async () => {
    const rows = await as(db, admin, `UPDATE public.profiles SET application_status = 'approved', reviewed_at = NOW() WHERE id = '${pending.id}' RETURNING application_status`);
    expect(rows).toEqual([{ application_status: 'approved' }]);
    await db.exec(`UPDATE public.profiles SET application_status = 'pending', reviewed_at = NULL WHERE id = '${pending.id}'`);
  });

  it('an invited admin can record their own invite as accepted; a normal user cannot', async () => {
    expect(await errorOf(db, student, `UPDATE public.profiles SET invite_accepted_at = NOW() WHERE id = '${student.id}'`)).toMatch(/protected/);
    const rows = await as(db, invitee, `UPDATE public.profiles SET invite_accepted_at = NOW(), name = 'New Admin' WHERE id = '${invitee.id}' RETURNING id`);
    expect(rows).toHaveLength(1);
  });
});

describe('sign-up trigger', () => {
  it('always creates a pending STUDENT, even if the sign-up metadata asks for admin', async () => {
    await db.exec(`INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
      ('66666666-6666-4666-8666-666666666666', 'sneaky@x.org', '{"name":"Sneaky","role":"admin","application_status":"approved"}')`);
    const [row] = await as<{ role: string; application_status: string }>(db, admin, `SELECT role, application_status FROM public.profiles WHERE email = 'sneaky@x.org'`);
    expect(row).toEqual({ role: 'student', application_status: 'pending' });
  });

  it('only accepts a résumé path of the exact shape the Apply form generates', async () => {
    await db.exec(`INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
      ('77777777-7777-4777-8777-777777777777', 'good@x.org', '{"resume_path":"applications/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cv.pdf","resume_name":"cv.pdf"}'),
      ('88888888-8888-4888-8888-888888888888', 'bad@x.org',  '{"resume_path":"../../etc/passwd","resume_name":"x"}')`);
    const rows = await as<{ email: string; resume_path: string | null }>(db, admin, `SELECT email, resume_path FROM public.profiles WHERE email IN ('good@x.org','bad@x.org') ORDER BY email`);
    expect(rows).toEqual([
      { email: 'bad@x.org', resume_path: null },
      { email: 'good@x.org', resume_path: 'applications/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cv.pdf' },
    ]);
  });
});

describe('attendance', () => {
  it('a student can check in for themselves, but not for someone else', async () => {
    const ok = await as(db, student, `INSERT INTO public.attendance (student_id, in_latitude, in_longitude) VALUES ('${student.id}', 18.52, 73.85) RETURNING id`);
    expect(ok).toHaveLength(1);
    expect(await errorOf(db, student, `INSERT INTO public.attendance (student_id, in_latitude, in_longitude) VALUES ('${other.id}', 18.52, 73.85)`)).toMatch(/row-level security/);
  });

  it('a second open session is refused until the first is checked out', async () => {
    expect(await errorOf(db, student, `INSERT INTO public.attendance (student_id, in_latitude, in_longitude) VALUES ('${student.id}', 18.5, 73.8)`)).toMatch(/row-level security/);
  });

  it('a student cannot pre-verify their own attendance', async () => {
    expect(await errorOf(db, other, `INSERT INTO public.attendance (student_id, in_latitude, in_longitude, verified) VALUES ('${other.id}', 1, 1, TRUE)`)).toMatch(/row-level security/);
  });

  it('students see only their own rows; admins see all and can verify', async () => {
    await as(db, other, `INSERT INTO public.attendance (student_id, in_latitude, in_longitude) VALUES ('${other.id}', 18.5, 73.8)`);
    expect(await as(db, student, `SELECT id FROM public.attendance`)).toHaveLength(1);
    expect(await as(db, admin, `SELECT id FROM public.attendance`)).toHaveLength(2);
    const verified = await as(db, admin, `UPDATE public.attendance SET verified = TRUE WHERE student_id = '${student.id}' RETURNING verified`);
    expect(verified).toEqual([{ verified: true }]);
  });
});

describe('org settings', () => {
  it('anyone (even anonymous) can read; only admins can write', async () => {
    expect(await as(db, null, `SELECT id FROM public.org_settings`)).toHaveLength(0);
    expect(await errorOf(db, student, `INSERT INTO public.org_settings (id, data) VALUES (1, '{}')`)).toMatch(/row-level security/);
    expect(await as(db, admin, `INSERT INTO public.org_settings (id, data) VALUES (1, '{"organization":{"name":"X"}}') RETURNING id`)).toHaveLength(1);
    expect(await as(db, null, `SELECT data FROM public.org_settings`)).toHaveLength(1);
    expect(await as(db, student, `UPDATE public.org_settings SET data = '{}' RETURNING id`)).toHaveLength(0);
  });
});

describe('projects, leave, issues, work logs', () => {
  let projectId: string;

  it('only admins can create projects; members see only projects they are assigned to', async () => {
    expect(await errorOf(db, student, `INSERT INTO public.projects (title, track, supervisor_name, supervisor_email, duration_weeks, target_hours, quota) VALUES ('x','t','s','s@x.org',4,40,3)`)).toMatch(/row-level security/);
    const [p] = await as<{ id: string }>(db, admin, `INSERT INTO public.projects (title, track, supervisor_name, supervisor_email, duration_weeks, target_hours, quota) VALUES ('Digital Literacy','Education','Dr A','a@x.org',8,120,5) RETURNING id`);
    projectId = p.id;
    await as(db, admin, `INSERT INTO public.project_assignments (project_id, member_name, member_email) VALUES ('${projectId}', 'student', '${student.email}')`);

    expect(await as(db, student, `SELECT id FROM public.projects`)).toHaveLength(1);
    expect(await as(db, other, `SELECT id FROM public.projects`)).toHaveLength(0);
    expect(await as(db, admin, `SELECT id FROM public.projects`)).toHaveLength(1);
  });

  it('a member cannot assign themselves to a project', async () => {
    expect(await errorOf(db, other, `INSERT INTO public.project_assignments (project_id, member_name, member_email) VALUES ('${projectId}', 'other', '${other.email}')`)).toMatch(/row-level security/);
  });

  it('leave: members file their own pending requests and cannot self-approve', async () => {
    const base = `applicant_id, applicant_name, applicant_email, applicant_role, leave_type, start_date, end_date, days_count, reason`;
    const vals = `'${student.id}', 'student', '${student.email}', 'intern', 'Casual', '2026-10-10', '2026-10-11', 2, 'family'`;
    expect(await as(db, student, `INSERT INTO public.leave_requests (${base}) VALUES (${vals}) RETURNING id`)).toHaveLength(1);
    expect(await errorOf(db, student, `INSERT INTO public.leave_requests (${base}, status) VALUES (${vals}, 'approved')`)).toMatch(/row-level security/);
    expect(await as(db, other, `SELECT id FROM public.leave_requests`)).toHaveLength(0);
    expect(await as(db, student, `UPDATE public.leave_requests SET status = 'approved' RETURNING id`)).toHaveLength(0);
    expect(await as(db, admin, `UPDATE public.leave_requests SET status = 'approved', reviewed_at = NOW() RETURNING status`)).toEqual([{ status: 'approved' }]);
  });

  it('issues: members report as themselves; only admins resolve', async () => {
    const [i] = await as<{ id: string }>(db, student, `INSERT INTO public.reported_issues (applicant_id, applicant_name, applicant_email, category, title, description) VALUES ('${student.id}','student','${student.email}','Tech','Laptop','broken') RETURNING id`);
    expect(i.id).toBeTruthy();
    expect(await as(db, student, `UPDATE public.reported_issues SET status = 'resolved' RETURNING id`)).toHaveLength(0);
    expect(await as(db, admin, `UPDATE public.reported_issues SET status = 'resolved', resolved_at = NOW() RETURNING status`)).toEqual([{ status: 'resolved' }]);
  });

  it('work logs: members add their own pending logs; only admins approve', async () => {
    const cols = `intern_id, intern_name, intern_email, log_date, day_of_week, week_label, hours, tasks`;
    const vals = `'${student.id}', 'student', '${student.email}', '2026-10-05', 'Monday', 'Week 1', 6, 'outreach'`;
    expect(await as(db, student, `INSERT INTO public.daily_work_logs (${cols}) VALUES (${vals}) RETURNING id`)).toHaveLength(1);
    expect(await errorOf(db, student, `INSERT INTO public.daily_work_logs (${cols}, status) VALUES (${vals}, 'Approved')`)).toMatch(/row-level security/);
    expect(await as(db, student, `UPDATE public.daily_work_logs SET status = 'Approved' RETURNING id`)).toHaveLength(0);
    expect(await as(db, admin, `UPDATE public.daily_work_logs SET status = 'Approved' RETURNING status`)).toEqual([{ status: 'Approved' }]);
  });
});

describe('résumé storage bucket', () => {
  const goodPath = 'applications/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cv.pdf';

  it('is private, size-limited and restricted to PDF/Word', async () => {
    const { rows } = await db.query<{ public: boolean; file_size_limit: string; allowed_mime_types: string[] }>(`SELECT public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'resumes'`);
    expect(rows[0].public).toBe(false);
    expect(Number(rows[0].file_size_limit)).toBe(5 * 1024 * 1024);
    expect(rows[0].allowed_mime_types).toContain('application/pdf');
    expect(rows[0].allowed_mime_types).not.toContain('text/html');
  });

  it('visitors can upload only to the expected path shape', async () => {
    // No RETURNING: a plain upload needs INSERT only (visitors deliberately have no SELECT).
    expect(await errorOf(db, null, `INSERT INTO storage.objects (bucket_id, name) VALUES ('resumes', '${goodPath}')`)).toBeNull();
    expect(await errorOf(db, null, `INSERT INTO storage.objects (bucket_id, name) VALUES ('resumes', '../escape.pdf')`)).toMatch(/row-level security/);
    expect(await errorOf(db, null, `INSERT INTO storage.objects (bucket_id, name) VALUES ('resumes', 'other-folder/x/cv.pdf')`)).toMatch(/row-level security/);
  });

  it('only admins can read résumés — visitors and students cannot', async () => {
    expect(await as(db, null, `SELECT id FROM storage.objects`)).toHaveLength(0);
    expect(await as(db, student, `SELECT id FROM storage.objects`)).toHaveLength(0);
    expect(await as(db, admin, `SELECT id FROM storage.objects`)).toHaveLength(1);
  });
});
