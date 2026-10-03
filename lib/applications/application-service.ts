import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ApplicationStatus, UserProfile } from '@/lib/supabase/types';

// Demo/offline mode stores applicants (and their passwords) under this key.
// The login page's "Apply" tab writes here, and approving an application
// flips `application_status`, which is what unlocks sign-in.
const REGISTERED_USERS_KEY = 'cep_registered_users';

// Seeded demo accounts that exist in auth-context (not in localStorage).
// They are real, approved members of the programme.
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
  allProfiles: UserProfile[] = []
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

  const sequence = String(sameDayJoineesCount + 1).padStart(3, '0');
  return `${prefix}-${dateStr}-${sequence}`;
}

// Seeded demo accounts that exist in auth-context (not in localStorage).
// They are real, approved members of the programme.
const DEMO_MEMBER_PROFILES: UserProfile[] = [
  {
    id: 'demo-student-uuid-001',
    name: 'Rahul Sharma',
    email: 'student@ngo.org',
    role: 'student',
    college: "St. Xavier's College",
    application_status: 'approved',
    joinee_id: 'STU-20261001-001',
    joined_at: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'demo-intern-uuid-001',
    name: 'Aarav Patel',
    email: 'intern@ngo.org',
    role: 'intern',
    college: 'COEP Technological University',
    application_status: 'approved',
    joinee_id: 'INT-20261001-001',
    joined_at: '2026-10-01T09:30:00.000Z',
  },
];

// Applicants shown on first run in demo mode so the review queue is not empty.
function seedApplicants(): UserProfile[] {
  return [
    {
      id: 'demo-student-app-1',
      name: 'Rohan Mehra',
      email: 'rohan.mehra@college.edu',
      role: 'student',
      college: "St. Xavier's College",
      degree: 'B.Sc Computer Science (Year 2)',
      program_interest: 'Community Digital Literacy',
      application_status: 'pending',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'demo-intern-app-2',
      name: 'Pooja Iyer',
      email: 'pooja.iyer@eng.edu',
      role: 'intern',
      college: 'National Institute of Technology',
      degree: 'B.Tech Information Technology (Year 4)',
      program_interest: 'Rural Healthcare Analytics',
      application_status: 'pending',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: 'demo-student-app-3',
      name: 'Amit Joshi',
      email: 'amit.j@univ.edu',
      role: 'student',
      college: 'Delhi University',
      degree: 'B.A Social Work (Year 3)',
      program_interest: 'Women Empowerment Camp',
      application_status: 'approved',
      joinee_id: 'STU-20260929-001',
      joined_at: '2026-09-29T10:00:00.000Z',
      created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    },
  ];
}

type StoredUsers = Record<string, { password?: string; profile: UserProfile }>;

function readStoredUsers(): StoredUsers {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? (parsed as StoredUsers) : {};
  } catch {
    return {};
  }
}

function readLocalApplications(): UserProfile[] {
  const stored = readStoredUsers();
  if (Object.keys(stored).length === 0) {
    // Persist the seed so approve/reject decisions stick and every screen
    // (review queue, dashboard counts, directory) reads the same data.
    // Seeded rows have no password, so they cannot be used to sign in.
    const seeded: StoredUsers = {};
    for (const profile of seedApplicants()) seeded[profile.email] = { profile };
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(seeded));
    } catch {
      /* storage unavailable — fall through and return the in-memory seed */
    }
    return Object.values(seeded).map((u) => u.profile);
  }
  return Object.values(stored).map((u) => u.profile);
}

/** Effective status — admin accounts and legacy rows without a status count as approved. */
export function effectiveStatus(p: Pick<UserProfile, 'application_status'>): ApplicationStatus {
  return p.application_status || 'approved';
}

/** All student/intern applications (any status), newest first. */
export async function fetchApplications(): Promise<UserProfile[]> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['student', 'intern'])
      .order('created_at', { ascending: false });
    return (data as UserProfile[]) || [];
  }
  // Demo-mode admins (created via the invite flow) live in the same store.
  return readLocalApplications().filter((p) => p.role !== 'admin');
}

/**
 * Approved programme members from a list of applications. In demo mode the
 * seeded demo accounts (which live in auth-context, not storage) are included.
 * De-duplicated by email.
 */
export function selectApprovedMembers(applications: UserProfile[]): UserProfile[] {
  const approved = applications.filter((a) => effectiveStatus(a) === 'approved');
  if (isSupabaseConfigured()) return approved;

  const seen = new Set(approved.map((a) => a.email.toLowerCase()));
  const demo = DEMO_MEMBER_PROFILES.filter((d) => !seen.has(d.email.toLowerCase()));
  return [...demo, ...approved];
}

export function countByStatus(applications: UserProfile[], status: ApplicationStatus): number {
  return applications.filter((a) => effectiveStatus(a) === status).length;
}

/** Persist an approve/reject decision. */
export async function updateApplicationStatus(
  applicant: Pick<UserProfile, 'id' | 'email'> & Partial<UserProfile>,
  status: ApplicationStatus
): Promise<void> {
  const reviewedAt = new Date().toISOString();
  let joineeId = applicant.joinee_id || null;
  const joinedAt = applicant.joined_at || (status === 'approved' ? reviewedAt : null);

  if (status === 'approved' && !joineeId) {
    const existing = await fetchApplications();
    const role = applicant.role || 'student';
    joineeId = generateJoineeId(role, joinedAt, existing);
  }

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({
        application_status: status,
        reviewed_at: reviewedAt,
        joinee_id: joineeId,
        joined_at: joinedAt,
      })
      .eq('id', applicant.id);
    return;
  }
  const stored = readStoredUsers();
  if (stored[applicant.email]) {
    stored[applicant.email].profile.application_status = status;
    stored[applicant.email].profile.reviewed_at = reviewedAt;
    if (status === 'approved') {
      stored[applicant.email].profile.joinee_id =
        joineeId ||
        generateJoineeId(
          stored[applicant.email].profile.role || 'student',
          joinedAt,
          Object.values(stored).map((u) => u.profile)
        );
      stored[applicant.email].profile.joined_at = joinedAt;
    }
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(stored));
  }
}
