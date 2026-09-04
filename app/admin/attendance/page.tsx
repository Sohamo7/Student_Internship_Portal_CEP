'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  ArrowLeft,
  Check
} from 'lucide-react';

export default function AdminAttendancePage() {
  const [records, setRecords] = useState([
    { id: 1, student: 'Rahul Sharma', time: '09:15 AM', location: 'Center A (Digital Lab)', verified: true },
    { id: 2, student: 'Ananya Verma', time: '09:00 AM', location: 'Primary Health Clinic', verified: true },
    { id: 3, student: 'Sneha Kulkarni', time: '09:20 AM', location: 'Vocational Hall', verified: true },
    { id: 4, student: 'Vikram Choudhury', time: '09:45 AM', location: 'Water Testing Site', verified: false },
    { id: 5, student: 'Kavita Nair', time: '09:10 AM', location: 'Center A (Digital Lab)', verified: true },
  ]);

  const verifyStudent = (id: number) => {
    setRecords(records.map(r => r.id === id ? { ...r, verified: true } : r));
  };

  const verifyAll = () => {
    setRecords(records.map(r => ({ ...r, verified: true })));
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Attendance Verification
              </h1>
              <p className="text-sm text-slate-600">
                Today: Saturday, September 5, 2026. Live field check-in monitoring.
              </p>
            </div>

            <button
              onClick={verifyAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 cursor-pointer"
            >
              <Check className="h-4 w-4" /> Verify All Check-ins
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3.5 text-left">Student Intern</th>
                <th className="px-6 py-3.5 text-left">Check-in Timestamp</th>
                <th className="px-6 py-3.5 text-left">Field Location</th>
                <th className="px-6 py-3.5 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-900">{r.student}</td>
                  <td className="px-6 py-4 font-mono font-medium">{r.time}</td>
                  <td className="px-6 py-4">{r.location}</td>
                  <td className="px-6 py-4 text-right">
                    {r.verified ? (
                      <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        Verified Today
                      </span>
                    ) : (
                      <button
                        onClick={() => verifyStudent(r.id)}
                        className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 hover:bg-amber-100 cursor-pointer"
                      >
                        Confirm Presence
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
