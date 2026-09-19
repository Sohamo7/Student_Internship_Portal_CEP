'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import {
  getStoredLeaveRequests,
  createLeaveRequest,
} from '@/lib/leave/leave-service';
import { LeaveRequest } from '@/lib/supabase/types';
import {
  CalendarOff,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  Calendar,
  AlertCircle,
  PlusCircle,
  Info,
} from 'lucide-react';

const LEAVE_TYPES = [
  'Academic / Exams',
  'Sick / Medical',
  'Personal / Family Emergency',
  'Casual / Other',
];

export default function InternLeavePage() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load user's leave requests
  useEffect(() => {
    const all = getStoredLeaveRequests();
    const userEmail = profile?.email || user?.email || 'intern@ngo.org';
    const filtered = all.filter((r) => r.applicant_email.toLowerCase() === userEmail.toLowerCase());
    setRequests(filtered);
  }, [user, profile]);

  // Compute stats
  const approvedDays = requests
    .filter((r) => r.status === 'approved')
    .reduce((acc, r) => acc + (r.days_count || 1), 0);
  const pendingDays = requests
    .filter((r) => r.status === 'pending')
    .reduce((acc, r) => acc + (r.days_count || 1), 0);
  const totalAllowance = 6;
  const remainingDays = Math.max(0, totalAllowance - approvedDays);

  // Auto calculate days count
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) return 1;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!startDate || !endDate) {
      setErrorMsg('Please select both start and end dates.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setErrorMsg('End date cannot be earlier than start date.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Please provide a reason for the leave request.');
      return;
    }

    setSubmitting(true);
    const days = calculateDays(startDate, endDate);

    const newReq = createLeaveRequest({
      applicant_id: user?.id || 'demo-intern-uuid-001',
      applicant_name: profile?.name || 'Aarav Patel',
      applicant_email: profile?.email || 'intern@ngo.org',
      applicant_role: 'intern',
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      days_count: days,
      reason: reason.trim(),
    });

    setRequests((prev) => [newReq, ...prev]);
    setStartDate('');
    setEndDate('');
    setReason('');
    setSubmitting(false);
    setSuccessMsg('Leave request submitted successfully! Your NGO Admin has been notified.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="intern" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <Link
            href="/intern/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Leave Management & Requests
              </h1>
              <p className="text-sm text-slate-600">
                Apply for leave, check approval status, and manage your absence quota.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 shadow-2xs">
              <CalendarOff className="h-4 w-4 text-teal-600" />
              Intern Leave Portal
            </span>
          </div>
        </div>

        {/* Leave Balances Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">Allowed Quota</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalAllowance} Days</div>
            <span className="text-[11px] text-slate-400">Total session quota</span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">Approved Taken</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{approvedDays} Days</div>
            <span className="text-[11px] text-emerald-700 font-medium">Verified by NGO Admin</span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">Pending Requests</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendingDays} Days</div>
            <span className="text-[11px] text-amber-700 font-medium">Awaiting admin review</span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">Remaining Balance</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">{remainingDays} Days</div>
            <span className="text-[11px] text-indigo-700 font-medium">Available to request</span>
          </div>
        </div>

        {/* Submit Leave Request Form */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-indigo-600" />
              Apply for Leave
            </h2>
            <span className="text-xs text-slate-500">Requests are sent directly to the NGO Admin for approval</span>
          </div>

          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleApply} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">End Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Reason & Details
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the purpose of the leave and how upcoming NGO deliverables/tasks will be managed..."
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Duration:{' '}
                  <strong className="text-slate-800">
                    {startDate && endDate ? `${calculateDays(startDate, endDate)} Day(s)` : 'Select dates'}
                  </strong>
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? 'Submitting...' : 'Send Leave Request'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Leave Requests History & Status List */}
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">My Leave Status & History</h2>
            <span className="text-xs text-slate-500">{requests.length} Request(s) recorded</span>
          </div>

          {requests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No leave requests submitted yet. Use the form above to apply for leave.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((r) => (
                <div key={r.id} className="p-6 hover:bg-slate-50/50 transition-colors space-y-3">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{r.leave_type}</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-700">
                          {r.days_count} {r.days_count === 1 ? 'Day' : 'Days'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {r.start_date} to {r.end_date}
                        </span>
                        <span>•</span>
                        <span>Submitted on {new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div>
                      {r.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Approved
                        </span>
                      )}
                      {r.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                          <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                          Pending Review
                        </span>
                      )}
                      {r.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          Declined
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-700">
                    <strong>Reason:</strong> {r.reason}
                  </div>

                  {r.admin_comment && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900 flex items-start gap-2">
                      <Info className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                      <div>
                        <strong>Admin Feedback:</strong> {r.admin_comment}
                        {r.reviewed_at && (
                          <span className="block text-[10px] text-indigo-600 mt-0.5">
                            Reviewed on {new Date(r.reviewed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
