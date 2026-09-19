'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import {
  getStoredReportedIssues,
  provideIssueSolution,
} from '@/lib/issues/issue-service';
import { ReportedIssue, IssueStatus } from '@/lib/supabase/types';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  Calendar,
  Send,
  Check,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

type FilterTab = 'All' | IssueStatus;

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<ReportedIssue[]>([]);
  const [filter, setFilter] = useState<FilterTab>('All');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [solutions, setSolutions] = useState<Record<string, string>>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    setIssues(getStoredReportedIssues());
  }, []);

  const handleSendSolution = (id: string, targetStatus: IssueStatus) => {
    const solutionText = (solutions[id] || '').trim();
    if (!solutionText && targetStatus === 'resolved') {
      alert('Please enter a brief solution or instructions for the intern before resolving.');
      return;
    }

    setUpdatingId(id);
    setTimeout(() => {
      const updated = provideIssueSolution(id, solutionText || 'Issue noted and being addressed by admin team.', targetStatus);
      if (updated) {
        setIssues((prev) => prev.map((i) => (i.id === id ? updated : i)));
        setActionSuccess(`Solution sent to ${updated.applicant_name} and marked as ${targetStatus === 'resolved' ? 'Resolved' : 'In Progress'}!`);
        setTimeout(() => setActionSuccess(null), 4000);
      }
      setUpdatingId(null);
    }, 250);
  };

  const filteredIssues = issues.filter((i) => {
    const matchesFilter = filter === 'All' ? true : i.status === filter;
    const matchesSearch =
      i.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
      i.applicant_email.toLowerCase().includes(search.toLowerCase()) ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalCount = issues.length;
  const openCount = issues.filter((i) => i.status === 'open').length;
  const inProgressCount = issues.filter((i) => i.status === 'in_progress').length;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;

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
                Intern Issue Reports & Resolutions
              </h1>
              <p className="text-sm text-slate-600">
                Review grievances, equipment blockers, and queries from interns, track status, and dispatch solutions.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800 shadow-2xs">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              Helpdesk Management
            </span>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Reports</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
            <span className="text-[11px] text-slate-400">All intern submissions</span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-amber-700">Open / Unresolved</span>
            <div className="text-2xl font-black text-amber-700 mt-1">{openCount}</div>
            <span className="text-[11px] text-amber-600 font-medium">Requires solution</span>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-blue-700">In Progress</span>
            <div className="text-2xl font-black text-blue-700 mt-1">{inProgressCount}</div>
            <span className="text-[11px] text-blue-600 font-medium">Under active investigation</span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-emerald-700">Resolved</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Solutions provided</span>
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
            {(['All', 'open', 'in_progress', 'resolved'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all capitalize cursor-pointer ${
                  filter === tab
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'All' ? 'All Issues' : tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by intern name, title, or keyword..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          {filteredIssues.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-xs text-slate-400">
              No reported issues found matching the selected filter.
            </div>
          ) : (
            filteredIssues.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-bold text-base">
                      {item.applicant_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{item.applicant_name}</h3>
                        <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                          Active Intern
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          item.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : item.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.priority} priority
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{item.applicant_email}</span>
                        <span>•</span>
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {item.status === 'resolved' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Resolved
                      </span>
                    )}
                    {item.status === 'in_progress' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                        <Clock className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                        In Progress
                      </span>
                    )}
                    {item.status === 'open' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                        Open / Needs Review
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject & Description */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs text-slate-700 leading-relaxed">
                    {item.description}
                  </div>
                </div>

                {/* Existing Solution if resolved */}
                {item.admin_solution && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-900 space-y-1">
                    <strong className="block text-emerald-800">Existing Solution Sent to Intern:</strong>
                    <p className="text-slate-800 font-medium">{item.admin_solution}</p>
                    {item.resolved_at && (
                      <span className="block text-[10px] text-emerald-700 pt-1">
                        Updated on {new Date(item.resolved_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Solution Formulation & Action Bar */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    {item.status === 'resolved' ? 'Update / Revise Solution:' : 'Write Solution / Instructions for Intern:'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Type the solution, instructions, or resolution steps to send back to the intern..."
                    value={solutions[item.id] !== undefined ? solutions[item.id] : item.admin_solution || ''}
                    onChange={(e) => setSolutions({ ...solutions, [item.id]: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />

                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      disabled={updatingId === item.id}
                      onClick={() => handleSendSolution(item.id, 'in_progress')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Set as In Progress</span>
                    </button>

                    <button
                      type="button"
                      disabled={updatingId === item.id}
                      onClick={() => handleSendSolution(item.id, 'resolved')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Send Solution & Mark Resolved</span>
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
