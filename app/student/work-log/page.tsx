'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import {
  ClipboardList,
  PlusCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileCheck
} from 'lucide-react';

export default function StudentWorkLogPage() {
  const [logs, setLogs] = useState([
    { week: 'Week 3', hours: '18 hrs', tasks: 'Conducted spreadsheet basics lecture for 25 high schoolers; assisted in creating personal budget exercise.', status: 'Approved' },
    { week: 'Week 2', hours: '16 hrs', tasks: 'Set up 10 refurbished laptops with Ubuntu and educational software; tested network connectivity.', status: 'Approved' },
    { week: 'Week 1', hours: '15 hrs', tasks: 'Orientation with Dr. Rao; attended community townhall; drafted syllabus outlines.', status: 'Approved' },
  ]);

  const [newTasks, setNewTasks] = useState('');
  const [newHours, setNewHours] = useState('18');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTasks.trim()) return;
    setLogs(prev => [
      { week: `Week ${prev.length + 1}`, hours: `${newHours} hrs`, tasks: newTasks, status: 'Pending Review' },
      ...prev
    ]);
    setNewTasks('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="student" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl">
        <div>
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Weekly Work Log
              </h1>
              <p className="text-sm text-slate-600">
                Document weekly project activities, accomplishments, and deliverables.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs">
              <ClipboardList className="h-4 w-4 text-blue-600" />
              {logs.length} Submissions Logged
            </span>
          </div>
        </div>

        {/* Submit New Work Log */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-3">Submit Current Week Report</h2>

          {showSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Work log submitted successfully! Sent to NGO Supervisor for approval.</span>
            </div>
          )}

          <form onSubmit={handleSubmitLog} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Tasks Completed & Impact Summary</label>
              <textarea
                rows={3}
                required
                value={newTasks}
                onChange={(e) => setNewTasks(e.target.value)}
                placeholder="Detail what activities you performed, challenges overcome, and deliverables generated this week..."
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">Hours Logged:</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={newHours}
                  onChange={(e) => setNewHours(e.target.value)}
                  className="w-20 rounded-lg border border-slate-200 p-1.5 text-sm font-semibold text-slate-900 text-center"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Submit Weekly Log</span>
              </button>
            </div>
          </form>
        </div>

        {/* History of Work Logs */}
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
            Past Submissions
          </div>
          <div className="divide-y divide-slate-100">
            {logs.map((log, i) => (
              <div key={i} className="p-6 space-y-2 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{log.week}</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-600">{log.hours}</span>
                  </div>
                  <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold border ${
                    log.status === 'Approved'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    {log.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{log.tasks}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
