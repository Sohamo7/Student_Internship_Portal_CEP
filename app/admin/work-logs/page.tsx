'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import {
  getWeeklyReportsForAdmin,
  approveWeeklyReport,
  WeeklyAggregatedReport,
} from '@/lib/work-log/work-log-service';
import {
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

function AdminWorkLogsContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'intern'>(
    initialRole === 'student' ? 'student' : initialRole === 'intern' ? 'intern' : 'all'
  );

  const [reports, setReports] = useState<WeeklyAggregatedReport[]>([]);
  const [filter, setFilter] = useState<FilterTab>('All');
  const [search, setSearch] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWeeklyReportsForAdmin()
      .then((loaded) => {
        if (cancelled) return;
        setReports(loaded);
        // Expand all pending weeks by default
        const initialExpanded: Record<string, boolean> = {};
        loaded.forEach((r) => {
          if (r.status === 'Pending Review') {
            initialExpanded[r.id] = true;
          }
        });
        setExpandedWeeks(initialExpanded);
      })
      .catch((err) => console.error('Failed to load work logs:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'student' || r === 'intern') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoleFilter(r);
    }
  }, [searchParams]);

  const toggleExpand = (id: string) => {
    setExpandedWeeks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApproveWeek = async (report: WeeklyAggregatedReport) => {
    try {
      await approveWeeklyReport(report.intern_email, report.week_label);
    } catch (err) {
      console.error('Failed to approve weekly report:', err);
      alert(err instanceof Error ? err.message : 'Failed to approve the weekly report.');
      return;
    }
    const reloaded = await getWeeklyReportsForAdmin();
    setReports(reloaded);
    setActionSuccess(
      `Approved weekly report for ${report.intern_name} (${report.week_label}) with ${report.total_hours} cumulative hours!`
    );
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const isStudentReport = (r: WeeklyAggregatedReport) => {
    const email = r.intern_email.toLowerCase();
    const name = r.intern_name.toLowerCase();
    return email.includes('student') || name.includes('rahul') || name.includes('ananya') || name.includes('vikram');
  };

  const filteredReports = reports.filter((r) => {
    const matchesFilter = filter === 'All' ? true : r.status === filter;
    const isStudent = isStudentReport(r);
    const matchesRole =
      roleFilter === 'all'
        ? true
        : roleFilter === 'student'
        ? isStudent
        : !isStudent;

    const matchesSearch =
      r.intern_name.toLowerCase().includes(search.toLowerCase()) ||
      r.intern_email.toLowerCase().includes(search.toLowerCase()) ||
      r.week_label.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesRole && matchesSearch;
  });

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
                {roleFilter === 'student'
                  ? 'Student Weekly Work Logs'
                  : roleFilter === 'intern'
                  ? 'Intern Weekly Work Logs'
                  : 'Weekly Work Log Approvals'}
              </h1>
              <p className="text-sm text-slate-600">
                {roleFilter === 'student'
                  ? 'Evaluate submitted daily entries and cumulative weekly hours for student volunteers.'
                  : roleFilter === 'intern'
                  ? 'Evaluate submitted daily entries and cumulative weekly hours for active interns.'
                  : 'Evaluate submitted daily entries and cumulative weekly hours.'}
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-800 shadow-2xs">
              <Layers className="h-4 w-4 text-purple-600" />
              {filteredReports.length} Weekly Cycles
            </span>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-amber-700">Pending Approvals</span>
            <div className="text-2xl font-black text-amber-800 mt-1">{pendingReports}</div>
            <span className="text-[11px] text-amber-600 font-medium">Awaiting evaluation</span>
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
              placeholder="Search by name, email, or week..."
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
              const isStudent = isStudentReport(report);

              return (
                <div
                  key={report.id}
                  className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-slate-300 transition-all"
                >
                  {/* Summary Bar */}
                  <div className="p-6 flex items-start justify-between flex-wrap gap-4 bg-white">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold text-base shrink-0 ${
                        isStudent ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'
                      }`}>
                        {report.intern_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{report.intern_name}</h3>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                            isStudent
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'bg-teal-50 border-teal-200 text-teal-700'
                          }`}>
                            {isStudent ? 'Student' : 'Active Intern'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{report.intern_email}</div>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-purple-600" />
                          <span>{report.week_label}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <span className="font-mono font-bold text-slate-900 text-base">
                            {report.total_hours} hrs
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {report.days_logged} {report.days_logged === 1 ? 'day logged' : 'days logged'}
                        </span>
                      </div>

                      {report.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Approved
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApproveWeek(report)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve Week
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

export default function AdminWorkLogsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading work logs...</div>}>
      <AdminWorkLogsContent />
    </Suspense>
  );
}
