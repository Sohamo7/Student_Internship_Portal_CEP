'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import { captureLocation, formatCoords, mapsLink, LocationCaptureError } from '@/lib/geolocation';
import {
  AttendanceRow,
  fetchMyAttendance,
  checkIn as checkInRecord,
  checkOut as checkOutRecord,
  formatTime,
  formatDate,
  computeHours,
  statusLabel,
} from '@/lib/attendance';
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

export default function StudentAttendancePage() {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState<'in' | 'out' | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchMyAttendance(user.id).then((rows) => {
      setRecords(rows);
      setLoading(false);
    });
  }, [user]);

  const openRecord = records.find((r) => !r.check_out_at) || null;

  const handleCheckIn = async () => {
    if (!user) return;
    setLocationError(null);
    setCapturing('in');
    try {
      const loc = await captureLocation();
      const row = await checkInRecord(user.id, profile?.name || 'Volunteer', user.email, loc);
      setRecords((prev) => [row, ...prev]);
    } catch (err) {
      setLocationError(err instanceof LocationCaptureError || err instanceof Error ? err.message : 'Could not capture your location.');
    } finally {
      setCapturing(null);
    }
  };

  const handleCheckOut = async () => {
    if (!openRecord) return;
    setLocationError(null);
    setCapturing('out');
    try {
      const loc = await captureLocation();
      const updated = await checkOutRecord(openRecord.id, loc);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      setLocationError(err instanceof LocationCaptureError || err instanceof Error ? err.message : 'Could not capture your location.');
    } finally {
      setCapturing(null);
    }
  };

  const latest = records[0];
  const today = new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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
                {records.filter((r) => r.check_out_at).length}-Session History
              </span>
            </div>
          </div>
        </div>

        {/* Check In / Check Out Action Box */}
        <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500">Today: {today}</span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {openRecord ? '🟢 Checked In — Active Session' : latest?.check_out_at ? '✅ Session Complete' : 'Daily Presence Verification'}
              </h2>
              <p className="text-xs text-slate-600 mt-1 flex items-start gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-500" />
                <span>
                  Your device&apos;s GPS location is captured and saved at check-in and check-out so the NGO admin can
                  verify you were on-site — this protects your logged hours and prevents them from being disputed.
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCheckIn}
                disabled={!!openRecord || capturing !== null || loading}
                className={`px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer inline-flex items-center gap-2 ${
                  openRecord
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20 disabled:opacity-60'
                }`}
              >
                {capturing === 'in' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {openRecord ? 'Checked In' : capturing === 'in' ? 'Locating...' : 'Check In'}
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!openRecord || capturing !== null}
                className={`px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer inline-flex items-center gap-2 ${
                  !openRecord && latest?.check_out_at
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                    : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {capturing === 'out' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {capturing === 'out' ? 'Locating...' : 'Check Out'}
              </button>
            </div>
          </div>

          {locationError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{locationError}</span>
            </div>
          )}

          {latest && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-indigo-500" /> Check-in location:
              </span>
              <a href={mapsLink({ latitude: latest.in_latitude, longitude: latest.in_longitude })} target="_blank" rel="noopener noreferrer" className="font-mono text-indigo-600 hover:underline">
                {formatCoords({ latitude: latest.in_latitude, longitude: latest.in_longitude })}
              </a>
              {latest.check_out_at && latest.out_latitude != null && latest.out_longitude != null && (
                <>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-slate-900" /> Check-out location:
                  </span>
                  <a href={mapsLink({ latitude: latest.out_latitude, longitude: latest.out_longitude })} target="_blank" rel="noopener noreferrer" className="font-mono text-indigo-600 hover:underline">
                    {formatCoords({ latitude: latest.out_latitude, longitude: latest.out_longitude })}
                  </a>
                </>
              )}
            </div>
          )}
        </div>

        {/* Records Table */}
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
            Attendance Log History
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your attendance...
            </div>
          ) : records.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">No attendance recorded yet — check in above to get started.</div>
          ) : (
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
                {records.map((r) => {
                  const status = statusLabel(r);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-semibold text-slate-900">{formatDate(r.check_in_at)}</td>
                      <td className="px-6 py-3">{formatTime(r.check_in_at)}</td>
                      <td className="px-6 py-3">{r.check_out_at ? formatTime(r.check_out_at) : 'Active Session'}</td>
                      <td className="px-6 py-3 font-mono">{computeHours(r)}</td>
                      <td className="px-6 py-3">
                        <a
                          href={mapsLink({ latitude: r.in_latitude, longitude: r.in_longitude })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-mono"
                        >
                          <MapPin className="h-3.5 w-3.5" /> View pin
                        </a>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                            status === 'Verified'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
