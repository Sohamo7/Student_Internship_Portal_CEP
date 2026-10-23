import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ApplicationStatus, UserProfile } from '@/lib/supabase/types';

/** Helper to format date into YYYYMMDD string for joinee IDs. */
export function formatJoineeDate(dateInput?: string | Date | null): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * Generates an NGO Joinee ID in the format: <ROLE>-<YYYYMMDD>-<SEQ>
 * E.g. STU-20261003-001 for Student, INT-20261003-001 for Intern.
 */
export function generateJoineeId(
  role: 'student' | 'intern' | 'admin',
  dateInput?: string | Date | null,
  allProfiles: UserProfile[] = [],
  /** Extra offset added to the sequence, used to step past an ID another admin just took. */
  offset = 0
): string {
  const prefix = role === 'intern' ? 'INT' : role === 'admin' ? 'ADM' : 'STU';
  const dateStr = formatJoineeDate(dateInput);

  const sameDayJoineesCount = allProfiles.filter((p) => {
    if (p.joinee_id && p.joinee_id.includes(`-${dateStr}-`)) {
      return true;
    }
    const pDate = formatJoineeDate(p.joined_at || p.reviewed_at || p.created_at);
    return pDate === dateStr && effectiveStatus(p) === 'approved';
  }).length;

  const sequence = String(sameDayJoineesCount + 1 + offset).padStart(3, '0');
  return `${prefix}-${dateStr}-${sequence}`;
}

/** Effective status — admin accounts and legacy rows without a status count as approved. */
export function effectiveStatus(p: Pick<UserProfile, 'application_status'>): ApplicationStatus {
  return p.application_status || 'approved';
}

/** All student/intern applications (any status), newest first. */
export async function fetchApplications(): Promise<UserProfile[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['student', 'intern'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch applications:', error.message);
    return [];
  }
  return (data as UserProfile[]) || [];
}

/**
 * Approved programme members from a list of applications.
 * Real database records only; no mock accounts are added.
 */
export function selectApprovedMembers(applications: UserProfile[]): UserProfile[] {
  return applications.filter((a) => effectiveStatus(a) === 'approved');
}

export function countByStatus(applications: UserProfile[], status: ApplicationStatus): number {
  return applications.filter((a) => effectiveStatus(a) === status).length;
}

export type StatusUpdateResult = { ok: true; joinee_id: string | null } | { ok: false; error: string };

const MAX_JOINEE_ID_ATTEMPTS = 5;

/**
 * Persist an approve/reject decision. Never throws: the result says whether the
 * change really reached the database, so callers must not tell the applicant
 * "approved" unless `ok` is true.
 */
export async function updateApplicationStatus(
  applicant: Pick<UserProfile, 'id' | 'email'> & Partial<UserProfile>,
  status: ApplicationStatus
): Promise<StatusUpdateResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Database is not configured. Application decisions cannot be saved.' };
  }

  const reviewedAt = new Date().toISOString();
  const joinedAt = applicant.joined_at || (status === 'approved' ? reviewedAt : null);
  const needsNewId = status === 'approved' && !applicant.joinee_id;
  const role = applicant.role || 'student';

  const supabase = createClient();
  // Joinee IDs are unique in the database. If two admins approve at the same
  // moment they can pick the same number; re-read the list and step past it.
  for (let attempt = 0; attempt < MAX_JOINEE_ID_ATTEMPTS; attempt++) {
    const joineeId = needsNewId
      ? generateJoineeId(role, joinedAt, await fetchApplications(), attempt)
      : applicant.joinee_id || null;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        application_status: status,
        reviewed_at: reviewedAt,
        joinee_id: joineeId,
        joined_at: joinedAt,
      })
      .eq('id', applicant.id)
      .select('id');

    if (error) {
      if (error.code === '23505' && needsNewId) continue; // joinee_id already taken -> retry
      return { ok: false, error: error.message };
    }
    // RLS can silently match zero rows (e.g. the caller is not an admin).
    if (!data || data.length === 0) {
      return {
        ok: false,
        error: 'The change was not saved. You may not have permission, or the application no longer exists.',
      };
    }
    return { ok: true, joinee_id: joineeId };
  }
  return { ok: false, error: 'Could not assign a unique joinee ID. Please try again.' };
}
