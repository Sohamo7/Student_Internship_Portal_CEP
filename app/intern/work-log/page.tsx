'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import {
  getStoredDailyWorkLogs,
  addDailyWorkLog,
  DailyWorkLog,
  formatWeekLabel,
} from '@/lib/work-log/work-log-service';
import {
  ClipboardList,
  PlusCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Calendar,
  Layers,
  AlertCircle,
} from 'lucide-react';

export default function InternWorkLogPage() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<DailyWorkLog[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('4.0');
  const [tasks, setTasks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load intern's daily logs
  useEffect(() => {
    const all = getStoredDailyWorkLogs();
    const userEmail = profile?.email || user?.email || 'intern@ngo.org';
    const userLogs = all.filter(
      (l) => l.intern_email.toLowerCase() === userEmail.toLowerCase()
    );
    setLogs(userLogs);
  }, [user, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setShowSuccess(false);

    if (!date) {
      setErrorMsg('Please select a date.');
      return;
    }

    const numHours = parseFloat(hours);
    if (isNaN(numHours) || numHours <= 0 || numHours > 16) {
      setErrorMsg('Please enter valid working hours between 0.5 and 16 hours.');
      return;
    }

    if (!tasks.trim()) {
      setErrorMsg('Please summarize tasks completed today.');
      return;
    }

    setSubmitting(true);
    const newLog = addDailyWorkLog({
      intern_id: user?.id || 'demo-intern-uuid-001',
      intern_name: profile?.name || 'Aarav Patel',
      intern_email: profile?.email || 'intern@ngo.org',
      date,
      hours: numHours,
      tasks: tasks.trim(),
    });

    setLogs((prev) => [newLog, ...prev]);
    setTasks('');
    setSubmitting(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  // Group logs by week for clean presentation
  const groupedByWeek = logs.reduce<Record<string, DailyWorkLog[]>>((acc, log) => {
    if (!acc[log.week_label]) {
      acc[log.week_label] = [];
    }
    acc[log.week_label].push(log);
    return acc;
  }, {});

  const totalHours = logs.reduce((sum, l) => sum + Number(l.hours), 0);
  const totalDays = logs.length;
  const currentWeekLabel = formatWeekLabel(new Date());
  const currentWeekHours = logs
    .filter((l) => l.week_label === currentWeekLabel)
    .reduce((sum, l) => sum + Number(l.hours), 0);

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
                Daily Work Log
              </h1>
              <p className="text-sm text-slate-600">
                Log your daily accomplishments. Your entries automatically accumulate into weekly reports for NGO Admin review.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs">
              <ClipboardList className="h-4 w-4 text-blue-600" />
              {totalDays} Days Logged
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Hours Logged</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {Math.round(totalHours * 10) / 10} hrs
            </div>
            <span className="text-[11px] text-slate-400">Across {totalDays} daily logs</span>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-indigo-700">This Week Accumulation</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">
              {Math.round(currentWeekHours * 10) / 10} hrs
            </div>
            <span className="text-[11px] text-indigo-600 font-medium">Auto-aggregated for admin</span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-emerald-700">Status</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">Active</div>
            <span className="text-[11px] text-emerald-700 font-medium">Logged per day</span>
          </div>
        </div>

        {/* Submit Daily Log Form */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-indigo-600" />
              Log Daily Work
            </h2>
            <span className="text-xs text-slate-500">Record tasks completed per day</span>
          </div>

          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {showSuccess && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>
                Daily log recorded successfully! Added to your weekly report for admin review.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Work Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Hours Worked Today</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="16"
                  required
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Tasks Completed & Daily Impact Summary
              </label>
              <textarea
                rows={3}
                required
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                placeholder="Describe specifically what you accomplished today (e.g. conducted workshop module, configured equipment, mapped survey responses)..."
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-slate-500">
                Calculated Week: <strong className="text-slate-800">{formatWeekLabel(date || new Date())}</strong>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{submitting ? 'Saving...' : 'Add Daily Entry'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Daily Logs History (Grouped by Week) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Daily Log History (Grouped by Week)
            </h2>
            <span className="text-xs text-slate-500">Weekly reports for Admin approval</span>
          </div>

          {Object.keys(groupedByWeek).length === 0 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center text-xs text-slate-400">
              No daily entries recorded yet. Use the form above to log your first day.
            </div>
          ) : (
            Object.entries(groupedByWeek).map(([weekLabel, weekEntries]) => {
              const weekTotal = weekEntries.reduce((sum, e) => sum + Number(e.hours), 0);
              const isWeekApproved = weekEntries.every((e) => e.status === 'Approved');

              return (
                <div
                  key={weekLabel}
                  className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs"
                >
                  {/* Week Header */}
                  <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                        {weekEntries.length}D
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{weekLabel}</h3>
                        <span className="text-xs text-slate-500">
                          Total Accumulated: <strong className="text-indigo-600">{weekTotal} hrs</strong> across {weekEntries.length} day(s)
                        </span>
                      </div>
                    </div>

                    <div>
                      {isWeekApproved ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Weekly Report Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                          <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                          Accumulating / Under Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Day-by-Day Entries */}
                  <div className="divide-y divide-slate-100">
                    {weekEntries.map((entry) => (
                      <div key={entry.id} className="p-5 hover:bg-slate-50/40 transition-colors space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{entry.day_of_week}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{entry.date}</span>
                            <span className="rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-mono font-bold text-indigo-700">
                              {entry.hours} hrs
                            </span>
                          </div>

                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                            entry.status === 'Approved'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}>
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
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
