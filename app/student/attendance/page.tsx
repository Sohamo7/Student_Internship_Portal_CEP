'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  Flame,
  ArrowLeft,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function StudentAttendancePage() {
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [records, setRecords] = useState([
    { date: 'Sep 05, 2026', inTime: '09:15 AM', outTime: '01:30 PM', hours: '4.25 hrs', status: 'Pending Today' },
    { date: 'Sep 04, 2026', inTime: '09:00 AM', outTime: '01:00 PM', hours: '4.00 hrs', status: 'Verified' },
    { date: 'Sep 03, 2026', inTime: '09:10 AM', outTime: '01:15 PM', hours: '4.08 hrs', status: 'Verified' },
    { date: 'Sep 02, 2026', inTime: '08:55 AM', outTime: '01:00 PM', hours: '4.08 hrs', status: 'Verified' },
    { date: 'Sep 01, 2026', inTime: '09:05 AM', outTime: '01:10 PM', hours: '4.08 hrs', status: 'Verified' },
  ]);

  const handleCheckIn = () => {
    setCheckedInToday(true);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRecords(prev => [
      { date: 'Today (Just Now)', inTime: now, outTime: 'Active Session', hours: 'In Progress', status: 'Present' },
      ...prev.slice(1)
    ]);
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
                Daily Attendance & Check-in
              </h1>
              <p className="text-sm text-slate-600">
                Log your daily presence and track verifiable internship service hours.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs">
                <Flame className="h-4 w-4 text-emerald-600" />
                6-Day Streak
              </span>
            </div>
          </div>
        </div>

        {/* Check In Action Box */}
        <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-500">Today: Saturday, September 5, 2026</span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {checkedInToday ? '✅ Checked In for Today' : 'Daily Presence Verification'}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {checkedInToday
                ? 'Your daily presence timestamp was logged and synced with the NGO Admin console.'
                : 'Click check-in when arriving at your assigned NGO community field or center.'}
            </p>
          </div>

          <button
            onClick={handleCheckIn}
            disabled={checkedInToday}
            className={`px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer ${
              checkedInToday
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
            }`}
          >
            {checkedInToday ? 'Checked In (Active)' : 'Check In Today'}
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Attended</span>
            <div className="text-2xl font-black text-slate-900 mt-1">23 Days</div>
            <span className="text-[11px] text-slate-500">Out of 24 scheduled sessions</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">Attendance Rate</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">95.8%</div>
            <span className="text-[11px] text-emerald-700">Satisfies 85% requirement</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">Logged Hours</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">92.4 hrs</div>
            <span className="text-[11px] text-slate-500">Goal: 120 hrs (77% done)</span>
          </div>
        </div>

        {/* Records Table */}
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
            Attendance Log History
          </div>
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">In Time</th>
                <th className="px-6 py-3 text-left">Out Time</th>
                <th className="px-6 py-3 text-left">Duration</th>
                <th className="px-6 py-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-semibold text-slate-900">{r.date}</td>
                  <td className="px-6 py-3">{r.inTime}</td>
                  <td className="px-6 py-3">{r.outTime}</td>
                  <td className="px-6 py-3 font-mono">{r.hours}</td>
                  <td className="px-6 py-3 text-right">
                    <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {r.status}
                    </span>
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
