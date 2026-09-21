'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { captureLocation, formatCoords, mapsLink, CapturedLocation, LocationCaptureError } from '@/lib/geolocation';
import {
  Flame,
  ArrowLeft,
  MapPin,
  Loader2,
  AlertTriangle,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface AttendanceRecord {
  date: string;
  inTime: string;
  outTime: string;
  hours: string;
  status: string;
  inLocation?: CapturedLocation;
  outLocation?: CapturedLocation;
}

export default function StudentAttendancePage() {
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkedOutToday, setCheckedOutToday] = useState(false);
  const [checkInAt, setCheckInAt] = useState<Date | null>(null);
  const [capturing, setCapturing] = useState<'in' | 'out' | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([
    { date: 'Sep 04, 2026', inTime: '09:00 AM', outTime: '01:00 PM', hours: '4.00 hrs', status: 'Verified' },
    { date: 'Sep 03, 2026', inTime: '09:10 AM', outTime: '01:15 PM', hours: '4.08 hrs', status: 'Verified' },
    { date: 'Sep 02, 2026', inTime: '08:55 AM', outTime: '01:00 PM', hours: '4.08 hrs', status: 'Verified' },
    { date: 'Sep 01, 2026', inTime: '09:05 AM', outTime: '01:10 PM', hours: '4.08 hrs', status: 'Verified' },
  ]);

  const handleCheckIn = async () => {
    setLocationError(null);
    setCapturing('in');
    try {
      const loc = await captureLocation();
      const now = new Date();
      setCheckInAt(now);
      setCheckedInToday(true);
      setRecords((prev) => [
        {
          date: 'Today',
          inTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          outTime: 'Active Session',
          hours: 'In Progress',
          status: 'Pending Verification',
          inLocation: loc,
        },
        ...prev,
      ]);
    } catch (err) {
      setLocationError(err instanceof LocationCaptureError ? err.message : 'Could not capture your location.');
    } finally {
      setCapturing(null);
    }
  };

  const handleCheckOut = async () => {
    setLocationError(null);
    setCapturing('out');
    try {
      const loc = await captureLocation();
      const now = new Date();
      const hoursWorked = checkInAt ? (now.getTime() - checkInAt.getTime()) / 3600000 : 0;
      setCheckedOutToday(true);
      setRecords((prev) =>
        prev.map((r, i) =>
          i === 0
            ? {
                ...r,
                outTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                hours: `${hoursWorked.toFixed(2)} hrs`,
                status: 'Pending Verification',
                outLocation: loc,
              }
            : r
        )
      );
    } catch (err) {
      setLocationError(err instanceof LocationCaptureError ? err.message : 'Could not capture your location.');
    } finally {
      setCapturing(null);
    }
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

        {/* Check In / Check Out Action Box */}
        <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500">Today: Saturday, September 5, 2026</span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {checkedOutToday ? '✅ Session Complete' : checkedInToday ? '🟢 Checked In — Active Session' : 'Daily Presence Verification'}
              </h2>
              <p className="text-xs text-slate-600 mt-1 flex items-start gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-500" />
                <span>
                  Your device&apos;s GPS location is captured at check-in and check-out so the NGO admin can verify
                  you were on-site — this protects your logged hours and prevents them from being disputed.
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCheckIn}
                disabled={checkedInToday || capturing !== null}
                className={`px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer inline-flex items-center gap-2 ${
                  checkedInToday
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20 disabled:opacity-60'
                }`}
              >
                {capturing === 'in' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {checkedInToday ? 'Checked In' : capturing === 'in' ? 'Locating...' : 'Check In'}
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!checkedInToday || checkedOutToday || capturing !== null}
                className={`px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer inline-flex items-center gap-2 ${
                  checkedOutToday
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                    : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {capturing === 'out' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {checkedOutToday ? 'Checked Out' : capturing === 'out' ? 'Locating...' : 'Check Out'}
              </button>
            </div>
          </div>

          {locationError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{locationError}</span>
            </div>
          )}

          {records[0]?.inLocation && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-indigo-500" /> Check-in location:
              </span>
              <a href={mapsLink(records[0].inLocation)} target="_blank" rel="noopener noreferrer" className="font-mono text-indigo-600 hover:underline">
                {formatCoords(records[0].inLocation)}
              </a>
              {records[0]?.outLocation && (
                <>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-slate-900" /> Check-out location:
                  </span>
                  <a href={mapsLink(records[0].outLocation)} target="_blank" rel="noopener noreferrer" className="font-mono text-indigo-600 hover:underline">
                    {formatCoords(records[0].outLocation)}
                  </a>
                </>
              )}
            </div>
          )}
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
                <th className="px-6 py-3 text-left">GPS Location</th>
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
                  <td className="px-6 py-3">
                    {r.inLocation ? (
                      <a
                        href={mapsLink(r.inLocation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-mono"
                      >
                        <MapPin className="h-3.5 w-3.5" /> View pin
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                        r.status === 'Verified'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
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
