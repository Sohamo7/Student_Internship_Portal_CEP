'use client';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { LeaveRequest, LeaveStatus } from '@/lib/supabase/types';

const LEAVE_STORAGE_KEY = 'cep_leave_requests';

/** Programme policy: approved leave days each volunteer may take in total. */
export const LEAVE_ALLOWANCE_DAYS = 6;

const SEED_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-seed-001',
    applicant_id: 'demo-intern-uuid-001',
    applicant_name: 'Aarav Patel',
    applicant_email: 'intern@ngo.org',
    applicant_role: 'intern',
    leave_type: 'Academic / Exams',
    start_date: '2026-09-22',
    end_date: '2026-09-24',
    days_count: 3,
    reason: 'Mid-term semester practical exams and project submission at university.',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
  },
  {
    id: 'leave-seed-002',
    applicant_id: 'demo-intern-uuid-001',
    applicant_name: 'Aarav Patel',
    applicant_email: 'intern@ngo.org',
    applicant_role: 'intern',
    leave_type: 'Sick / Medical',
    start_date: '2026-08-20',
    end_date: '2026-08-21',
    days_count: 2,
    reason: 'Viral fever and doctor consultation.',
    status: 'approved',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 29).toISOString(),
    admin_comment: 'Approved. Take rest and recover well.',
  },
  {
    id: 'leave-seed-003',
    applicant_id: 'demo-intern-uuid-002',
    applicant_name: 'Meera Joshi',
    applicant_email: 'meera.intern@ngo.org',
    applicant_role: 'intern',
    leave_type: 'Personal / Family Emergency',
    start_date: '2026-09-25',
    end_date: '2026-09-26',
    days_count: 2,
    reason: 'Family wedding out of town.',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

type LeaveRow = Omit<LeaveRequest, 'reviewed_at' | 'admin_comment'> & {
  reviewed_at: string | null;
  admin_comment: string | null;
};

function fromRow(row: LeaveRow): LeaveRequest {
  return {
    ...row,
    reviewed_at: row.reviewed_at ?? undefined,
    admin_comment: row.admin_comment ?? undefined,
  };
}

// ---- localStorage fallback ----

function readLocal(): LeaveRequest[] {
  if (typeof window === 'undefined') return SEED_LEAVE_REQUESTS;
  try {
    const raw = localStorage.getItem(LEAVE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(SEED_LEAVE_REQUESTS));
      return SEED_LEAVE_REQUESTS;
    }
    return JSON.parse(raw) as LeaveRequest[];
  } catch {
    return SEED_LEAVE_REQUESTS;
  }
}

function writeLocal(requests: LeaveRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(requests));
  } catch (err) {
    console.error('Failed to save leave requests:', err);
  }
}

// ---- Public API ----

/** Leave requests visible to the caller, newest first (admins: all; others: their own, enforced by RLS). */
export async function fetchLeaveRequests(): Promise<LeaveRequest[]> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load leave requests:', error.message);
      return [];
    }
    return ((data as LeaveRow[]) || []).map(fromRow);
  }
  return readLocal();
}

export async function createLeaveRequest(
  data: Omit<LeaveRequest, 'id' | 'created_at' | 'status'>
): Promise<LeaveRequest> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from('leave_requests')
      .insert({
        applicant_id: data.applicant_id,
        applicant_name: data.applicant_name,
        applicant_email: data.applicant_email,
        applicant_role: data.applicant_role,
        leave_type: data.leave_type,
        start_date: data.start_date,
        end_date: data.end_date,
        days_count: data.days_count,
        reason: data.reason,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromRow(row as LeaveRow);
  }

  const newRequest: LeaveRequest = {
    ...data,
    id: `leave-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  writeLocal([newRequest, ...readLocal()]);
  return newRequest;
}

export async function updateLeaveStatus(
  id: string,
  status: LeaveStatus,
  comment?: string
): Promise<LeaveRequest | null> {
  const reviewedAt = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const patch: { status: LeaveStatus; reviewed_at: string; admin_comment?: string } = {
      status,
      reviewed_at: reviewedAt,
    };
    if (comment) patch.admin_comment = comment;
    const { data, error } = await supabase
      .from('leave_requests')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data as LeaveRow) : null;
  }

  let updatedItem: LeaveRequest | null = null;
  const updated = readLocal().map((req) => {
    if (req.id !== id) return req;
    updatedItem = { ...req, status, reviewed_at: reviewedAt, admin_comment: comment || req.admin_comment };
    return updatedItem;
  });
  if (updatedItem) writeLocal(updated);
  return updatedItem;
}
