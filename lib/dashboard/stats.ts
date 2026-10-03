import { fetchApplications, countByStatus, selectApprovedMembers } from '@/lib/applications/application-service';
import { AttendanceRow, fetchAttendanceSince } from '@/lib/attendance';
import { Project, fetchProjects, fetchProjectsForMember } from '@/lib/projects/project-service';
import { fetchLeaveRequests } from '@/lib/leave/leave-service';
import { fetchReportedIssues } from '@/lib/issues/issue-service';
import { DailyWorkLog, buildWeeklyReports, fetchDailyWorkLogs } from '@/lib/work-log/work-log-service';

// ---------------------------------------------------------------------------
// Attendance period maths
//
// Attendance rate = distinct days with a check-in this calendar month
//                   ÷ weekdays (Mon–Fri) elapsed this month, capped at 100%.
// ---------------------------------------------------------------------------

export interface AttendancePeriod {
  start: Date;
  /** Weekdays from the 1st of the month up to and including today (min 1). */
  expectedDays: number;
}

export function currentPeriod(now: Date = new Date()): AttendancePeriod {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  let weekdays = 0;
  for (let d = 1; d <= now.getDate(); d++) {
    const dow = new Date(now.getFullYear(), now.getMonth(), d).getDay();
    if (dow !== 0 && dow !== 6) weekdays++;
  }
  return { start, expectedDays: Math.max(1, weekdays) };
}

function localDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function countAttendedDays(rows: Pick<AttendanceRow, 'check_in_at'>[]): number {
  return new Set(rows.map((r) => localDateKey(r.check_in_at))).size;
}

export function attendanceRate(daysAttended: number, expectedDays: number): number {
  if (expectedDays <= 0) return 0;
  return Math.min(100, (daysAttended / expectedDays) * 100);
}

export function formatPercent(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

function todayIsoDate(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** A project is active when it has people assigned and its duration has not elapsed. */
export function isProjectActive(project: Project, now: number = Date.now()): boolean {
  if (project.assigned.length === 0) return false;
  const end = new Date(project.created_at).getTime() + project.duration_weeks * 7 * 24 * 3600 * 1000;
  return now <= end;
}

// ---------------------------------------------------------------------------
// Roster: every programme member with their derived metrics
// ---------------------------------------------------------------------------

export interface RosterMember {
  key: string; // lower-cased email
  id?: string;
  joinee_id?: string | null;
  /** True when this person has an approved volunteer profile (applications data). */
  hasProfile: boolean;
  name: string;
  email: string;
  role: 'student' | 'intern';
  college: string;
  projects: string[];
  daysAttended: number;
  attendanceRate: number;
  logs: number;
  status: 'Active' | 'On Leave';
}

export interface AdminDashboardStats {
  /** Approved volunteer profiles only — matches the Student Directory. */
  totalMembers: number;
  studentCount: number;
  internCount: number;
  /** People on a project or attendance log who have no approved profile. */
  unlinkedAssignees: number;
  pendingApplications: number;
  activeProjects: number;
  totalProjects: number;
  /** Mean monthly attendance rate across the roster; null when the roster is empty. */
  avgAttendance: number | null;
  unverifiedAttendance: number;
  pendingLeave: number;
  pendingWorkLogReports: number;
  openIssues: number;
}

export interface AdminOverview {
  stats: AdminDashboardStats;
  roster: RosterMember[];
}

export async function loadAdminOverview(): Promise<AdminOverview> {
  const period = currentPeriod();
  const [applications, attendance, projects, leave, issues, workLogs] = await Promise.all([
    fetchApplications(),
    fetchAttendanceSince(period.start.toISOString()),
    fetchProjects(),
    fetchLeaveRequests(),
    fetchReportedIssues(),
    fetchDailyWorkLogs(),
  ]);

  const approved = selectApprovedMembers(applications);

  // Build the roster keyed by email. Precedence for role/college: approved
  // profile, then attendance row, then project assignment.
  const byEmail = new Map<string, RosterMember>();
  const idToEmail = new Map<string, string>();
  const blank = (key: string, name: string, email: string): RosterMember => ({
    key,
    name,
    email,
    hasProfile: false,
    role: 'student',
    college: '—',
    projects: [],
    daysAttended: 0,
    attendanceRate: 0,
    logs: 0,
    status: 'Active',
  });

  for (const m of approved) {
    const key = m.email.toLowerCase();
    byEmail.set(key, {
      ...blank(key, m.name, m.email),
      id: m.id,
      joinee_id: m.joinee_id,
      hasProfile: true,
      role: m.role === 'intern' ? 'intern' : 'student',
      college: m.college || '—',
    });
    idToEmail.set(m.id, key);
  }
  for (const row of attendance) {
    const key = row.student_email?.toLowerCase() || idToEmail.get(row.student_id);
    if (!key) continue;
    if (!byEmail.has(key)) {
      byEmail.set(key, {
        ...blank(key, row.student_name || key, row.student_email || key),
        id: row.student_id,
        role: row.role === 'intern' ? 'intern' : 'student',
      });
    }
    idToEmail.set(row.student_id, key);
  }
  for (const project of projects) {
    for (const person of project.assigned) {
      const key = person.email.toLowerCase();
      if (!byEmail.has(key)) byEmail.set(key, blank(key, person.name, person.email));
    }
  }

  // Attach per-member metrics.
  const rowsByMember = new Map<string, AttendanceRow[]>();
  for (const row of attendance) {
    const key = row.student_email?.toLowerCase() || idToEmail.get(row.student_id);
    if (!key) continue;
    rowsByMember.set(key, [...(rowsByMember.get(key) || []), row]);
  }
  const today = todayIsoDate();
  const roster = Array.from(byEmail.values()).map((member): RosterMember => {
    const days = countAttendedDays(rowsByMember.get(member.key) || []);
    const onLeave = leave.some(
      (l) =>
        l.status === 'approved' &&
        l.applicant_email.toLowerCase() === member.key &&
        l.start_date <= today &&
        today <= l.end_date
    );
    return {
      ...member,
      projects: projects
        .filter((p) => p.assigned.some((a) => a.email.toLowerCase() === member.key))
        .map((p) => p.title),
      daysAttended: days,
      attendanceRate: attendanceRate(days, period.expectedDays),
      logs: workLogs.filter((w) => w.intern_email.toLowerCase() === member.key).length,
      status: onLeave ? 'On Leave' : 'Active',
    };
  });
  roster.sort((a, b) => a.name.localeCompare(b.name));

  const stats: AdminDashboardStats = {
    totalMembers: roster.filter((m) => m.hasProfile).length,
    studentCount: roster.filter((m) => m.hasProfile && m.role === 'student').length,
    internCount: roster.filter((m) => m.hasProfile && m.role === 'intern').length,
    unlinkedAssignees: roster.filter((m) => !m.hasProfile).length,
    pendingApplications: countByStatus(applications, 'pending'),
    activeProjects: projects.filter((p) => isProjectActive(p)).length,
    totalProjects: projects.length,
    avgAttendance:
      roster.length === 0 ? null : roster.reduce((sum, m) => sum + m.attendanceRate, 0) / roster.length,
    unverifiedAttendance: attendance.filter((r) => !r.verified).length,
    pendingLeave: leave.filter((l) => l.status === 'pending').length,
    pendingWorkLogReports: buildWeeklyReports(workLogs).filter((r) => r.status === 'Pending Review').length,
    openIssues: issues.filter((i) => i.status !== 'resolved').length,
  };

  return { stats, roster };
}

// ---------------------------------------------------------------------------
// Student / intern dashboard
// ---------------------------------------------------------------------------

export interface MemberDashboardStats {
  daysAttended: number;
  expectedDays: number;
  attendanceRate: number;
  projects: Project[];
  logsSubmitted: number;
  logsPendingReview: number;
}

export async function loadMemberDashboard(user: { id: string; email: string }): Promise<MemberDashboardStats> {
  const period = currentPeriod();
  const email = user.email.toLowerCase();
  const [rows, allLogs, projects] = await Promise.all([
    fetchAttendanceSince(period.start.toISOString(), user.id),
    fetchDailyWorkLogs(),
    fetchProjectsForMember(user.email),
  ]);
  const days = countAttendedDays(rows);
  const myLogs: DailyWorkLog[] = allLogs.filter((l) => l.intern_email.toLowerCase() === email);
  return {
    daysAttended: days,
    expectedDays: period.expectedDays,
    attendanceRate: attendanceRate(days, period.expectedDays),
    projects,
    logsSubmitted: myLogs.length,
    logsPendingReview: myLogs.filter((l) => l.status !== 'Approved').length,
  };
}
