'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import {
  getStoredLeaveRequests,
  updateLeaveStatus,
} from '@/lib/leave/leave-service';
import { LeaveRequest, LeaveStatus } from '@/lib/supabase/types';
import {
  CalendarOff,
  Search,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Calendar,
  User,
  Filter,
  MessageSquare,
} from 'lucide-react';

type FilterTab = 'All' | LeaveStatus;

export default function AdminLeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState<FilterTab>('All');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    setRequests(getStoredLeaveRequests());
  }, []);

  const handleStatusUpdate = (id: string, newStatus: LeaveStatus) => {
    setUpdatingId(id);
    const comment = comments[id] || (newStatus === 'approved' ? 'Approved by NGO Admin.' : 'Declined due to scheduling constraints.');
    
    setTimeout(() => {
      const updated = updateLeaveStatus(id, newStatus, comment);
      if (updated) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? updated : r))
        );
        setActionSuccess(`Leave request for ${updated.applicant_name} marked as ${newStatus}!`);
        setTimeout(() => setActionSuccess(null), 4000);
      }
      setUpdatingId(null);
    }, 250);
  };

  const filteredRequests = requests.filter((r) => {
    const matchesFilter = filter === 'All' ? true : r.status === filter;
    const matchesSearch =
      r.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
      r.applicant_email.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.leave_type.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="admin" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl">
        {/* Header */}
        <div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Intern Leave Approval Console
              </h1>
              <p className="text-sm text-slate-600">
                Review, accept, or reject time-off requests submitted by interns and volunteers.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-800 shadow-2xs">
              <CalendarOff className="h-4 w-4 text-purple-600" />
              Administrative Review
            </span>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Requests</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
            <span className="text-[11px] text-slate-400">All submissions</span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-amber-700">Pending Approval</span>
            <div className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</div>
            <span className="text-[11px] text-amber-600">Requires action</span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-emerald-700">Approved</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{approvedCount}</div>
            <span className="text-[11px] text-emerald-600">Active approved leaves</span>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-rose-700">Declined</span>
            <div className="text-2xl font-black text-rose-700 mt-1">{rejectedCount}</div>
            <span className="text-[11px] text-rose-600">Rejected requests</span>
          </div>
        </div>

        {/* Action success alert */}
        {actionSuccess && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['All', 'pending', 'approved', 'rejected'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all capitalize cursor-pointer ${
                  filter === tab
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'All' ? 'All Requests' : tab}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by intern name, email, or reason..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-xs text-slate-400">
              No leave requests found matching the current filter.
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-base">
                      {req.applicant_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{req.applicant_name}</h3>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          req.applicant_role === 'intern'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {req.applicant_role === 'intern' ? 'Active Intern' : 'Student'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">{req.applicant_email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === 'approved' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Approved
                      </span>
                    )}
                    {req.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                        <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                        Pending Approval
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        Declined
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Leave Duration</span>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{req.start_date} → {req.end_date}</span>
                    </div>
                    <div className="text-indigo-600 font-semibold">{req.days_count} Day(s) requested</div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Category</span>
                    <div className="font-bold text-slate-900">{req.leave_type}</div>
                    <div className="text-slate-500">Submitted on {new Date(req.created_at).toLocaleDateString()}</div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Submitted Reason</span>
                    <p className="text-slate-700 italic">&ldquo;{req.reason}&rdquo;</p>
                  </div>
                </div>

                {/* Feedback note if any */}
                {req.admin_comment && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <strong>Admin Note:</strong> {req.admin_comment}
                    {req.reviewed_at && (
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Reviewed at {new Date(req.reviewed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Admin Action Bar */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Optional feedback / note to intern..."
                      value={comments[req.id] || ''}
                      onChange={(e) => setComments({ ...comments, [req.id]: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={updatingId === req.id || req.status === 'approved'}
                      onClick={() => handleStatusUpdate(req.id, 'approved')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{req.status === 'approved' ? 'Approved' : 'Accept Leave'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={updatingId === req.id || req.status === 'rejected'}
                      onClick={() => handleStatusUpdate(req.id, 'rejected')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>{req.status === 'rejected' ? 'Declined' : 'Decline'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
