'use client';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface DailyWorkLog {
  id: string;
  intern_id: string;
  intern_name: string;
  intern_email: string;
  date: string; // e.g. '2026-09-18'
  day_of_week: string; // 'Friday'
  week_label: string; // e.g. 'Week 3 (Sep 14 – Sep 20, 2026)'
  hours: number;
  tasks: string;
  status: 'Pending Review' | 'Approved';
  created_at: string;
  admin_notes?: string;
}

export interface WeeklyAggregatedReport {
  id: string;
  intern_name: string;
  intern_email: string;
  week_label: string;
  total_hours: number;
  days_logged: number;
  status: 'Pending Review' | 'Approved';
  daily_entries: DailyWorkLog[];
}

const STORAGE_KEY = 'cep_daily_work_logs';

export function formatWeekLabel(dateInput: string | Date): string {
  const d = new Date(dateInput);
  // Get Monday of that week
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatShort = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return `Week of ${formatShort(monday)} – ${formatShort(sunday)}, ${sunday.getFullYear()}`;
}

const SEED_DAILY_LOGS: DailyWorkLog[] = [
  // Aarav Patel - Current Week Entries
  {
    id: 'dlog-001',
    intern_id: 'demo-intern-uuid-001',
    intern_name: 'Aarav Patel',
    intern_email: 'intern@ngo.org',
    date: '2026-09-18',
    day_of_week: 'Friday',
    week_label: 'Week of Sep 14 – Sep 20, 2026',
    hours: 4.5,
    tasks: 'Organized practical coding exercises in Scratch for 20 village middle-schoolers at Center A.',
    status: 'Pending Review',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: 'dlog-002',
    intern_id: 'demo-intern-uuid-001',
    intern_name: 'Aarav Patel',
    intern_email: 'intern@ngo.org',
    date: '2026-09-17',
    day_of_week: 'Thursday',
    week_label: 'Week of Sep 14 – Sep 20, 2026',
    hours: 4.0,
    tasks: 'Assisted supervisor Dr. Rao in reviewing internet connectivity logs and installed offline typing tutors.',
    status: 'Pending Review',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 44).toISOString(),
  },
  {
    id: 'dlog-003',
    intern_id: 'demo-intern-uuid-001',
    intern_name: 'Aarav Patel',
    intern_email: 'intern@ngo.org',
    date: '2026-09-16',
    day_of_week: 'Wednesday',
    week_label: 'Week of Sep 14 – Sep 20, 2026',
    hours: 4.0,
    tasks: 'Conducted interactive workshop on digital banking security and UPI cyber-safety awareness.',
    status: 'Pending Review',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 68).toISOString(),
  },
  {
    id: 'dlog-004',
    intern_id: 'demo-intern-uuid-001',
    intern_name: 'Aarav Patel',
    intern_email: 'intern@ngo.org',
    date: '2026-09-15',
    day_of_week: 'Tuesday',
    week_label: 'Week of Sep 14 – Sep 20, 2026',
    hours: 3.5,
    tasks: 'Prepared bilingual instructional charts and cheat-sheets for keyboard shortcuts.',
    status: 'Pending Review',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 92).toISOString(),
  },
  {
    id: 'dlog-005',
    intern_id: 'demo-intern-uuid-001',
    intern_name: 'Aarav Patel',
    intern_email: 'intern@ngo.org',
    date: '2026-09-14',
    day_of_week: 'Monday',
    week_label: 'Week of Sep 14 – Sep 20, 2026',
    hours: 4.0,
    tasks: 'Weekly planning meet with coordinator; mapped attendance roster of 32 participating students.',
    status: 'Pending Review',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 116).toISOString(),
  },

  // Aarav Patel - Prior Week (Approved)
  {
    id: 'dlog-006',
    intern_id: 'demo-intern-uuid-001',
    intern_name: 'Aarav Patel',
    intern_email: 'intern@ngo.org',
    date: '2026-09-11',
    day_of_week: 'Friday',
    week_label: 'Week of Sep 07 – Sep 13, 2026',
    hours: 4.0,
    tasks: 'Conducted spreadsheet basics lecture and practical budgeting exercise.',
    status: 'Approved',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: 'dlog-007',
    intern_id: 'demo-intern-uuid-001',
    intern_name: 'Aarav Patel',
    intern_email: 'intern@ngo.org',
    date: '2026-09-10',
    day_of_week: 'Thursday',
    week_label: 'Week of Sep 07 – Sep 13, 2026',
    hours: 4.0,
    tasks: 'Set up 10 refurbished laptops with educational Linux distros.',
    status: 'Approved',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },

  // Ananya Verma (Approved Week)
  {
    id: 'dlog-008',
    intern_id: 'demo-student-uuid-003',
    intern_name: 'Ananya Verma',
    intern_email: 'ananya@ngo.org',
    date: '2026-09-18',
    day_of_week: 'Friday',
    week_label: 'Week of Sep 14 – Sep 20, 2026',
    hours: 5.0,
    tasks: 'Organized primary immunization camp registration table; measured vitals for 60 villagers.',
    status: 'Approved',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
  },
  {
    id: 'dlog-009',
    intern_id: 'demo-student-uuid-003',
    intern_name: 'Ananya Verma',
    intern_email: 'ananya@ngo.org',
    date: '2026-09-17',
    day_of_week: 'Thursday',
    week_label: 'Week of Sep 14 – Sep 20, 2026',
    hours: 4.5,
    tasks: 'Field nutrition survey across 22 rural households; documented dietary gaps.',
    status: 'Approved',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(),
  },
];

interface WorkLogRow {
  id: string;
  intern_id: string;
  intern_name: string;
  intern_email: string;
  log_date: string;
  day_of_week: string;
  week_label: string;
  hours: number | string;
  tasks: string;
  status: DailyWorkLog['status'];
  admin_notes: string | null;
  created_at: string;
}

function fromRow(row: WorkLogRow): DailyWorkLog {
  return {
    id: row.id,
    intern_id: row.intern_id,
    intern_name: row.intern_name,
    intern_email: row.intern_email,
    date: row.log_date,
    day_of_week: row.day_of_week,
    week_label: row.week_label,
    hours: Number(row.hours),
    tasks: row.tasks,
    status: row.status,
    created_at: row.created_at,
    admin_notes: row.admin_notes ?? undefined,
  };
}

// ---- localStorage fallback ----

function readLocal(): DailyWorkLog[] {
  if (typeof window === 'undefined') return SEED_DAILY_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DAILY_LOGS));
      return SEED_DAILY_LOGS;
    }
    return JSON.parse(raw) as DailyWorkLog[];
  } catch {
    return SEED_DAILY_LOGS;
  }
}

function writeLocal(logs: DailyWorkLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save daily work logs:', err);
  }
}

// ---- Public API ----

/** Work logs visible to the caller, newest first (admins: all; others: their own, enforced by RLS). */
export async function fetchDailyWorkLogs(): Promise<DailyWorkLog[]> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('daily_work_logs')
      .select('*')
      .order('log_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load daily work logs:', error.message);
      return [];
    }
    return ((data as WorkLogRow[]) || []).map(fromRow);
  }
  return readLocal();
}

export async function addDailyWorkLog(
  data: Omit<DailyWorkLog, 'id' | 'created_at' | 'status' | 'day_of_week' | 'week_label'>
): Promise<DailyWorkLog> {
  const dateObj = new Date(data.date + 'T00:00:00');
  const day_of_week = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const week_label = formatWeekLabel(dateObj);

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from('daily_work_logs')
      .insert({
        intern_id: data.intern_id,
        intern_name: data.intern_name,
        intern_email: data.intern_email,
        log_date: data.date,
        day_of_week,
        week_label,
        hours: data.hours,
        tasks: data.tasks,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromRow(row as WorkLogRow);
  }

  const newLog: DailyWorkLog = {
    ...data,
    id: `dlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    day_of_week,
    week_label,
    status: 'Pending Review',
    created_at: new Date().toISOString(),
  };
  writeLocal([newLog, ...readLocal()]);
  return newLog;
}

/** Groups daily entries into weekly accumulated reports for the admin console. */
export function buildWeeklyReports(logs: DailyWorkLog[]): WeeklyAggregatedReport[] {
  // Map key: `${intern_email}___${week_label}`
  const map = new Map<string, WeeklyAggregatedReport>();

  for (const log of logs) {
    const key = `${log.intern_email}___${log.week_label}`;
    let report = map.get(key);

    if (!report) {
      report = {
        id: key,
        intern_name: log.intern_name,
        intern_email: log.intern_email,
        week_label: log.week_label,
        total_hours: 0,
        days_logged: 0,
        status: 'Approved',
        daily_entries: [],
      };
      map.set(key, report);
    }

    report.total_hours += Number(log.hours) || 0;
    report.days_logged += 1;
    report.daily_entries.push(log);

    // If any entry is pending review, the weekly report is pending review
    if (log.status !== 'Approved') {
      report.status = 'Pending Review';
    }
  }

  // Round total hours and sort daily entries by date descending
  return Array.from(map.values()).map((r) => {
    r.total_hours = Math.round(r.total_hours * 10) / 10;
    r.daily_entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return r;
  });
}

export async function getWeeklyReportsForAdmin(): Promise<WeeklyAggregatedReport[]> {
  return buildWeeklyReports(await fetchDailyWorkLogs());
}

/** Admin action: approves the entire week's daily logs for an intern. */
export async function approveWeeklyReport(internEmail: string, weekLabel: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('daily_work_logs')
      .select('id, intern_email')
      .eq('week_label', weekLabel);
    if (error) throw new Error(error.message);
    const ids = ((data as { id: string; intern_email: string }[]) || [])
      .filter((r) => r.intern_email.toLowerCase() === internEmail.toLowerCase())
      .map((r) => r.id);
    if (ids.length === 0) return;
    const { error: updError } = await supabase
      .from('daily_work_logs')
      .update({ status: 'Approved' })
      .in('id', ids);
    if (updError) throw new Error(updError.message);
    return;
  }

  writeLocal(
    readLocal().map((log) =>
      log.intern_email.toLowerCase() === internEmail.toLowerCase() && log.week_label === weekLabel
        ? { ...log, status: 'Approved' as const }
        : log
    )
  );
}
