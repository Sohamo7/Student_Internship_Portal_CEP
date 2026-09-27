import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { CapturedLocation } from '@/lib/geolocation';

export interface AttendanceRow {
  id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  role?: 'student' | 'intern';
  check_in_at: string;
  check_out_at: string | null;
  in_latitude: number;
  in_longitude: number;
  in_accuracy?: number | null;
  out_latitude?: number | null;
  out_longitude?: number | null;
  out_accuracy?: number | null;
  verified: boolean;
}

const LOCAL_KEY = 'cep_attendance_records';

const INITIAL_DEMO_RECORDS: AttendanceRow[] = [
  {
    id: 'att-1',
    student_id: 'demo-student-uuid-001',
    student_name: 'Rahul Sharma',
    student_email: 'student@ngo.org',
    role: 'student',
    check_in_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    check_out_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    in_latitude: 28.6141,
    in_longitude: 77.2092,
    in_accuracy: 12,
    out_latitude: 28.6140,
    out_longitude: 77.2091,
    out_accuracy: 10,
    verified: true,
  },
  {
    id: 'att-2',
    student_id: 'demo-intern-uuid-001',
    student_name: 'Aarav Patel',
    student_email: 'intern@ngo.org',
    role: 'intern',
    check_in_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    check_out_at: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
    in_latitude: 28.6138,
    in_longitude: 77.2089,
    in_accuracy: 15,
    out_latitude: 28.6139,
    out_longitude: 77.2090,
    out_accuracy: 14,
    verified: true,
  },
  {
    id: 'att-3',
    student_id: 'demo-student-2',
    student_name: 'Ananya Verma',
    student_email: 'ananya@bits.edu',
    role: 'student',
    check_in_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    check_out_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    in_latitude: 28.6139,
    in_longitude: 77.2093,
    in_accuracy: 8,
    out_latitude: 28.6139,
    out_longitude: 77.2093,
    out_accuracy: 9,
    verified: true,
  },
  {
    id: 'att-4',
    student_id: 'demo-intern-3',
    student_name: 'Sneha Kulkarni',
    student_email: 'sneha@coep.ac.in',
    role: 'intern',
    check_in_at: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    check_out_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    in_latitude: 28.6144,
    in_longitude: 77.2094,
    in_accuracy: 18,
    out_latitude: 28.6143,
    out_longitude: 77.2095,
    out_accuracy: 16,
    verified: true,
  },
  {
    id: 'att-5',
    student_id: 'demo-student-4',
    student_name: 'Vikram Choudhury',
    student_email: 'vikram@iitd.ac.in',
    role: 'student',
    check_in_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    check_out_at: new Date(Date.now() - 1000 * 60 * 60 * 4.5).toISOString(),
    in_latitude: 28.6250,
    in_longitude: 77.2180,
    in_accuracy: 25,
    out_latitude: 28.6252,
    out_longitude: 77.2182,
    out_accuracy: 20,
    verified: false,
  },
];

function readLocal(): AttendanceRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(INITIAL_DEMO_RECORDS));
      return INITIAL_DEMO_RECORDS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(INITIAL_DEMO_RECORDS));
      return INITIAL_DEMO_RECORDS;
    }
    // Ensure all items have a role inferred if missing
    return parsed.map((r: AttendanceRow) => ({
      ...r,
      role: r.role || (r.student_email?.includes('intern') || r.student_name?.includes('Sneha') || r.student_name?.includes('Aarav') ? 'intern' : 'student'),
    }));
  } catch {
    return INITIAL_DEMO_RECORDS;
  }
}

function writeLocal(rows: AttendanceRow[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
}

function newLocalId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ---- Display helpers (shared by student/intern/admin pages) ----

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
}

export function computeHours(row: Pick<AttendanceRow, 'check_in_at' | 'check_out_at'>): string {
  if (!row.check_out_at) return 'In Progress';
  const ms = new Date(row.check_out_at).getTime() - new Date(row.check_in_at).getTime();
  const hours = Math.max(ms, 0) / 3600000;
  return `${hours.toFixed(2)} hrs`;
}

export function statusLabel(row: Pick<AttendanceRow, 'check_out_at' | 'verified'>): string {
  if (!row.check_out_at) return 'Pending Today';
  return row.verified ? 'Verified' : 'Pending Verification';
}

// ---- Student/intern-facing operations ----

export async function fetchMyAttendance(userId: string): Promise<AttendanceRow[]> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', userId)
      .order('check_in_at', { ascending: false })
      .limit(20);
    return (data as AttendanceRow[]) || [];
  }
  return readLocal()
    .filter((r) => r.student_id === userId)
    .sort((a, b) => new Date(b.check_in_at).getTime() - new Date(a.check_in_at).getTime())
    .slice(0, 20);
}

export async function checkIn(
  userId: string,
  name: string,
  email: string,
  loc: CapturedLocation,
  role?: 'student' | 'intern'
): Promise<AttendanceRow> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        student_id: userId,
        check_in_at: new Date().toISOString(),
        in_latitude: loc.latitude,
        in_longitude: loc.longitude,
        in_accuracy: loc.accuracy,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...(data as AttendanceRow), role };
  }

  const row: AttendanceRow = {
    id: newLocalId(),
    student_id: userId,
    student_name: name,
    student_email: email,
    role: role || (email.includes('intern') ? 'intern' : 'student'),
    check_in_at: new Date().toISOString(),
    check_out_at: null,
    in_latitude: loc.latitude,
    in_longitude: loc.longitude,
    in_accuracy: loc.accuracy,
    verified: false,
  };
  const rows = readLocal();
  rows.unshift(row);
  writeLocal(rows);
  return row;
}

export async function checkOut(recordId: string, loc: CapturedLocation): Promise<AttendanceRow> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out_at: new Date().toISOString(),
        out_latitude: loc.latitude,
        out_longitude: loc.longitude,
        out_accuracy: loc.accuracy,
      })
      .eq('id', recordId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as AttendanceRow;
  }

  const rows = readLocal();
  const idx = rows.findIndex((r) => r.id === recordId);
  if (idx === -1) throw new Error('Attendance record not found.');
  rows[idx] = {
    ...rows[idx],
    check_out_at: new Date().toISOString(),
    out_latitude: loc.latitude,
    out_longitude: loc.longitude,
    out_accuracy: loc.accuracy,
  };
  writeLocal(rows);
  return rows[idx];
}

// ---- Admin-facing operations ----

export async function fetchAllAttendance(): Promise<AttendanceRow[]> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data } = await supabase
      .from('attendance')
      .select('*, profiles(name, email)')
      .order('check_in_at', { ascending: false })
      .limit(100);
    return ((data as unknown as Array<AttendanceRow & { profiles?: { name: string; email: string } }>) || []).map(
      (r) => ({ ...r, student_name: r.profiles?.name, student_email: r.profiles?.email })
    );
  }
  return readLocal().sort((a, b) => new Date(b.check_in_at).getTime() - new Date(a.check_in_at).getTime());
}

export async function verifyAttendance(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    await supabase.from('attendance').update({ verified: true }).eq('id', id);
    return;
  }
  const rows = readLocal();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx !== -1) {
    rows[idx] = { ...rows[idx], verified: true };
    writeLocal(rows);
  }
}
