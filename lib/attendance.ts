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

export interface BulkVerifyResult {
  successfulIds: string[];
  failed: Array<{ id: string; error: string }>;
}

interface SupabaseProfileJoin {
  name?: string | null;
  email?: string | null;
  role?: 'student' | 'intern' | 'admin' | string | null;
}

interface SupabaseAttendanceRecord {
  id: string;
  student_id: string;
  check_in_at: string;
  check_out_at: string | null;
  in_latitude: number;
  in_longitude: number;
  in_accuracy?: number | null;
  out_latitude?: number | null;
  out_longitude?: number | null;
  out_accuracy?: number | null;
  verified: boolean;
  profiles?: SupabaseProfileJoin | null;
}

function mapAttendanceRow(record: SupabaseAttendanceRecord): AttendanceRow {
  const profileRole = record.profiles?.role;
  // Map strictly: only 'intern' becomes 'intern', only 'student' becomes 'student'.
  // Missing or unknown roles must never be classified as interns.
  const mappedRole: 'student' | 'intern' | undefined =
    profileRole === 'intern' ? 'intern' : profileRole === 'student' ? 'student' : undefined;

  return {
    id: record.id,
    student_id: record.student_id,
    student_name: record.profiles?.name || undefined,
    student_email: record.profiles?.email || undefined,
    role: mappedRole,
    check_in_at: record.check_in_at,
    check_out_at: record.check_out_at,
    in_latitude: record.in_latitude,
    in_longitude: record.in_longitude,
    in_accuracy: record.in_accuracy,
    out_latitude: record.out_latitude,
    out_longitude: record.out_longitude,
    out_accuracy: record.out_accuracy,
    verified: Boolean(record.verified),
  };
}

function assertSupabaseConfigured(operation: string): void {
  if (!isSupabaseConfigured()) {
    throw new Error(
      `Supabase is not configured. ${operation} requires active database credentials (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).`
    );
  }
}

// ---- Display helpers (shared by student/intern/admin pages) ----

export function formatTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
}

export function computeHours(row: Pick<AttendanceRow, 'check_in_at' | 'check_out_at'>): string {
  if (!row.check_out_at) return 'In Progress';
  const start = new Date(row.check_in_at).getTime();
  const end = new Date(row.check_out_at).getTime();
  if (isNaN(start) || isNaN(end)) return '—';
  const ms = end - start;
  const hours = Math.max(ms, 0) / 3600000;
  return `${hours.toFixed(2)} hrs`;
}

export function statusLabel(row: Pick<AttendanceRow, 'check_out_at' | 'verified'>): string {
  if (!row.check_out_at) return 'Pending Today';
  return row.verified ? 'Verified' : 'Pending Verification';
}

// ---- Student/intern-facing operations ----

export async function fetchMyAttendance(userId: string): Promise<AttendanceRow[]> {
  assertSupabaseConfigured('Loading attendance history');

  const supabase = createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select('*, profiles(name, email, role)')
    .eq('student_id', userId)
    .order('check_in_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to load attendance records: ${error.message}`);
  }

  return ((data as unknown as SupabaseAttendanceRecord[]) || []).map(mapAttendanceRow);
}

export async function checkIn(
  userId: string,
  name: string,
  email: string,
  loc: CapturedLocation,
  role?: 'student' | 'intern'
): Promise<AttendanceRow> {
  assertSupabaseConfigured('Check-in');

  const supabase = createClient();
  const checkInTimestamp = loc.capturedAt || new Date().toISOString();

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      student_id: userId,
      check_in_at: checkInTimestamp,
      in_latitude: loc.latitude,
      in_longitude: loc.longitude,
      in_accuracy: loc.accuracy != null ? loc.accuracy : null,
      verified: false,
    })
    .select('*, profiles(name, email, role)')
    .single();

  if (error) {
    if (error.code === '42501' || error.message.toLowerCase().includes('check in')) {
      throw new Error('You already have an active check-in session. Please check out before checking in again.');
    }
    throw new Error(`Check-in failed: ${error.message}`);
  }

  const mapped = mapAttendanceRow(data as unknown as SupabaseAttendanceRecord);
  return {
    ...mapped,
    student_name: mapped.student_name || name,
    student_email: mapped.student_email || email,
    role: mapped.role || role,
  };
}

export async function checkOut(recordId: string, loc: CapturedLocation): Promise<AttendanceRow> {
  assertSupabaseConfigured('Check-out');

  const supabase = createClient();

  // 1. Verify the record exists and is currently open
  const { data: existing, error: fetchError } = await supabase
    .from('attendance')
    .select('id, check_out_at')
    .eq('id', recordId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to check attendance record: ${fetchError.message}`);
  }
  if (!existing) {
    throw new Error('Attendance record not found.');
  }
  if (existing.check_out_at) {
    throw new Error('This attendance session has already been checked out.');
  }

  // 2. Persist checkout with safe condition to prevent race duplicate checkout
  const checkOutTimestamp = loc.capturedAt || new Date().toISOString();
  const { data, error } = await supabase
    .from('attendance')
    .update({
      check_out_at: checkOutTimestamp,
      out_latitude: loc.latitude,
      out_longitude: loc.longitude,
      out_accuracy: loc.accuracy != null ? loc.accuracy : null,
    })
    .eq('id', recordId)
    .is('check_out_at', null)
    .select('*, profiles(name, email, role)')
    .single();

  if (error) {
    throw new Error(`Check-out failed: ${error.message}`);
  }
  if (!data) {
    throw new Error('Could not update attendance record. The session may have already been closed.');
  }

  return mapAttendanceRow(data as unknown as SupabaseAttendanceRecord);
}

// ---- Admin-facing operations ----

export async function fetchAllAttendance(): Promise<AttendanceRow[]> {
  assertSupabaseConfigured('Loading admin attendance records');

  const supabase = createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select('*, profiles(name, email, role)')
    .order('check_in_at', { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Failed to fetch attendance records: ${error.message}`);
  }

  return ((data as unknown as SupabaseAttendanceRecord[]) || []).map(mapAttendanceRow);
}

/**
 * Every attendance record checked in at/after `sinceIso`, optionally for one
 * person. Used for monthly rate aggregations and period metrics.
 */
export async function fetchAttendanceSince(sinceIso: string, userId?: string): Promise<AttendanceRow[]> {
  assertSupabaseConfigured('Loading period attendance records');

  const supabase = createClient();
  let query = supabase
    .from('attendance')
    .select('*, profiles(name, email, role)')
    .gte('check_in_at', sinceIso)
    .order('check_in_at', { ascending: false })
    .limit(2000);

  if (userId) {
    query = query.eq('student_id', userId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch period attendance records: ${error.message}`);
  }

  return ((data as unknown as SupabaseAttendanceRecord[]) || []).map(mapAttendanceRow);
}

export async function verifyAttendance(id: string): Promise<void> {
  assertSupabaseConfigured('Verifying attendance');

  const supabase = createClient();
  const { data, error } = await supabase
    .from('attendance')
    .update({ verified: true })
    .eq('id', id)
    .select('id');

  if (error) {
    throw new Error(`Verification failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Verification failed: Attendance record not found or you lack permission to verify it.');
  }
}

export async function verifyAttendanceBulk(ids: string[]): Promise<BulkVerifyResult> {
  assertSupabaseConfigured('Bulk attendance verification');

  const result: BulkVerifyResult = {
    successfulIds: [],
    failed: [],
  };

  for (const id of ids) {
    try {
      await verifyAttendance(id);
      result.successfulIds.push(id);
    } catch (err) {
      result.failed.push({
        id,
        error: err instanceof Error ? err.message : 'Unknown error during verification',
      });
    }
  }

  return result;
}
