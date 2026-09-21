import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { CapturedLocation } from '@/lib/geolocation';

export interface AttendanceRow {
  id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
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

function readLocal(): AttendanceRow[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
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
  loc: CapturedLocation
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
    return data as AttendanceRow;
  }

  const row: AttendanceRow = {
    id: newLocalId(),
    student_id: userId,
    student_name: name,
    student_email: email,
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
