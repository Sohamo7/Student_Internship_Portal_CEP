'use client';

import { LeaveRequest, LeaveStatus } from '@/lib/supabase/types';

const LEAVE_STORAGE_KEY = 'cep_leave_requests';

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

export function getStoredLeaveRequests(): LeaveRequest[] {
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

export function saveLeaveRequests(requests: LeaveRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(requests));
  } catch (err) {
    console.error('Failed to save leave requests:', err);
  }
}

export function createLeaveRequest(
  data: Omit<LeaveRequest, 'id' | 'created_at' | 'status'>
): LeaveRequest {
  const current = getStoredLeaveRequests();
  const newRequest: LeaveRequest = {
    ...data,
    id: `leave-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const updated = [newRequest, ...current];
  saveLeaveRequests(updated);
  return newRequest;
}

export function updateLeaveStatus(
  id: string,
  status: LeaveStatus,
  comment?: string
): LeaveRequest | null {
  const current = getStoredLeaveRequests();
  let updatedItem: LeaveRequest | null = null;

  const updated = current.map((req) => {
    if (req.id === id) {
      updatedItem = {
        ...req,
        status,
        reviewed_at: new Date().toISOString(),
        admin_comment: comment || req.admin_comment,
      };
      return updatedItem;
    }
    return req;
  });

  if (updatedItem) {
    saveLeaveRequests(updated);
  }
  return updatedItem;
}
