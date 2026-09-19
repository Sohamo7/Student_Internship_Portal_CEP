'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import {
  getWeeklyReportsForAdmin,
  approveWeeklyReport,
  WeeklyAggregatedReport,
} from '@/lib/work-log/work-log-service';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Check,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

type FilterTab = 'All' | 'Pending Review' | 'Approved';

export default function AdminWorkLogsPage() {
  const [reports, setReports] = useState<WeeklyAggregatedReport[]>([]);
  const [filter, setFilter] = useState<FilterTab>('All');
  const [search, setSearch] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loaded = getWeeklyReportsForAdmin();
    setReports(loaded);
    // Expand all pending weeks by default
    const initialExpanded: Record<string, boolean> = {};
    loaded.forEach((r) => {
      if (r.status === 'Pending Review') {
        initialExpanded[r.id] = true;
      }
    });
    setExpandedWeeks(initialExpanded);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedWeeks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApproveWeek = (report: WeeklyAggregatedReport) => {
    approveWeeklyReport(report.intern_email, report.week_label);
    const reloaded = getWeeklyReportsForAdmin();
    setReports(reloaded);
    setActionSuccess(
      `Approved weekly report for ${report.intern_name} (${report.week_label}) with ${report.total_hours} cumulative hours!`
    );
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const filteredReports = reports.filter((r) => {
    const matchesFilter = filter === 'All' ? true : r.status === filter;
    const matchesSearch =
      r.intern_name.toLowerCase().includes(search.toLowerCase()) ||
      r.intern_email.toLowerCase().includes(search.toLowerCase()) ||
      r.week_label.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalWeeklyReports = reports.length;
  const pendingReports = reports.filter((r) => r.status === 'Pending Review').length;
  const approvedReports = reports.filter((r) => r.status === 'Approved').length;
  const totalVerifiedHours = reports
    .filter((r) => r.status === 'Approved')
    .reduce((sum, r) => sum + r.total_hours, 0);

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="admin" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl">
        {/* Header */}
        <div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Weekly Work Log Approvals
              </h1>
              <p className="text-sm text-slate-600">
                Daily entries submitted by interns are automatically accumulated into weekly reports per day for administrative evaluation.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-800 shadow-2xs">
              <Layers className="h-4 w-4 text-purple-600" />
              Accumulated Weekly Reports
            </span>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">Weekly Reports</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalWeeklyReports}</div>
            <span className="text-[11px] text-slate-400">Total week batches</span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-amber-700">Pending Review</span>
            <div className="text-2xl font-black text-amber-700 mt-1">{pendingReports}</div>
            <span className="text-[11px] text-amber-600 font-medium">Accumulated days awaiting review</span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-emerald-700">Approved Reports</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{approvedReports}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Certified weeks</span>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-indigo-700">Total Verified Hours</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">
              {Math.round(totalVerifiedHours * 10) / 10} hrs
            </div>
            <span className="text-[11px] text-indigo-600 font-medium">Across approved weeks</span>
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
            {(['All', 'Pending Review', 'Approved'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'All' ? 'All Weekly Reports' : tab}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by intern name, email, or week..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Weekly Reports List */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-xs text-slate-400">
              No weekly reports found matching the selected filter.
            </div>
          ) : (
            filteredReports.map((report) => {
              const isExpanded = !!expandedWeeks[report.id];

              return (
                <div
                  key={report.id}
                  className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-slate-300 transition-all"
                >
                  {/* Summary Bar */}
                  <div className="p-6 flex items-start justify-between flex-wrap gap-4 bg-white">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-base shrink-0">
                        {report.intern_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{report.intern_name}</h3>
                          <span className="rounded-md bg-teal-100 text-teal-800 px-2 py-0.5 text-[10px] font-bold">
                            Active Intern
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">{report.intern_email}</span>

                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-800">{report.week_label}</span>
                          <span>•</span>
                          <span className="rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-mono font-bold text-indigo-700">
                            {report.total_hours} hrs accumulated
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">{report.days_logged} daily logs</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        {report.status === 'Approved' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-800">
                            <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                            Pending Review
                          </span>
                        )}
                      </div>

                      {report.status !== 'Approved' && (
                        <button
                          type="button"
                          onClick={() => handleApproveWeek(report)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve Week</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleExpand(report.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Daily Breakdown' : 'View Daily Breakdown'}</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Daily Entries Breakdown */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Daily Entries Added for this Week ({report.days_logged} Days):
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Accumulated sum: {report.total_hours} hrs
                        </span>
                      </div>

                      <div className="space-y-2">
                        {report.daily_entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{entry.day_of_week}</span>
                                <span className="text-slate-400 text-xs">•</span>
                                <span className="text-slate-500 text-xs font-mono">{entry.date}</span>
                                <span className="rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-mono font-bold text-indigo-700">
                                  {entry.hours} hrs
                                </span>
                              </div>

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  entry.status === 'Approved'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-amber-50 border-amber-200 text-amber-800'
                                }`}
                              >
                                {entry.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed pl-1">
                              {entry.tasks}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
