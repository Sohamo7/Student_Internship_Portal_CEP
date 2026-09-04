'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import {
  ClipboardList,
  CheckCircle,
  ArrowLeft,
  Check,
  RotateCcw
} from 'lucide-react';

export default function AdminWorkLogsPage() {
  const [logs, setLogs] = useState([
    { id: 1, student: 'Rahul Sharma', week: 'Week 3', hours: '18 hrs', tasks: 'Conducted spreadsheet basics lecture for 25 high schoolers; assisted in creating personal budget exercise.', status: 'Pending Review' },
    { id: 2, student: 'Ananya Verma', week: 'Week 3', hours: '20 hrs', tasks: 'Organized primary immunization camp registration table; measured vitals for 60 villagers.', status: 'Approved' },
    { id: 3, student: 'Sneha Kulkarni', week: 'Week 2', hours: '17 hrs', tasks: 'Drafted self-help group sewing training modules; held focus group interviews.', status: 'Pending Review' },
  ]);

  const approveLog = (id: number) => {
    setLogs(logs.map(l => l.id === id ? { ...l, status: 'Approved' } : l));
  };

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="admin" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl">
        <div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Console
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Work Log Approvals
          </h1>
          <p className="text-sm text-slate-600">
            Review weekly student submissions, verify documented impact, and approve milestones.
          </p>
        </div>

        <div className="space-y-4">
          {logs.map(log => (
            <div key={log.id} className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{log.student}</h3>
                  <span className="text-xs text-slate-500">{log.week} • <strong className="text-slate-800">{log.hours}</strong></span>
                </div>

                <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold border ${
                  log.status === 'Approved'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  {log.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                "{log.tasks}"
              </p>

              {log.status !== 'Approved' && (
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => approveLog(log.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-colors cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve Work Log
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
