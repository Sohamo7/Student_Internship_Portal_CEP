'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { mapsLink } from '@/lib/geolocation';
import { AttendanceRow, fetchAllAttendance, verifyAttendance, formatTime, formatDate } from '@/lib/attendance';
import {
  ArrowLeft,
  Check,
  MapPin,
  ShieldAlert,
  Loader2,
  GraduationCap,
  Users,
} from 'lucide-react';

const SITE = { latitude: 28.6139, longitude: 77.209 };
const FLAG_RADIUS_METERS = 500;

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function AdminAttendanceContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'intern'>(
    initialRole === 'student' ? 'student' : initialRole === 'intern' ? 'intern' : 'all'
  );

  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await fetchAllAttendance();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'student' || r === 'intern') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoleFilter(r);
    }
  }, [searchParams]);

  const verifyOne = async (id: string) => {
    setVerifyingId(id);
    await verifyAttendance(id);
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, verified: true } : r)));
    setVerifyingId(null);
  };

  const verifyAllInRange = async () => {
    const toVerify = records.filter(
      (r) =>
        !r.verified &&
        (roleFilter === 'all' || r.role === roleFilter) &&
        distanceMeters({ latitude: r.in_latitude, longitude: r.in_longitude }, SITE) <= FLAG_RADIUS_METERS
    );
    await Promise.all(toVerify.map((r) => verifyAttendance(r.id)));
    setRecords((prev) => prev.map((r) => (toVerify.some((t) => t.id === r.id) ? { ...r, verified: true } : r)));
  };

  const filteredRecords = records.filter((r) => {
    if (roleFilter === 'all') return true;
    return r.role === roleFilter;
  });

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
                {roleFilter === 'student'
                  ? 'Student Attendance Verification'
                  : roleFilter === 'intern'
                  ? 'Intern Attendance Verification'
                  : 'Attendance Verification'}
              </h1>
              <p className="text-sm text-slate-600">
                {roleFilter === 'student'
                  ? 'Verify student volunteer attendance check-in locations with GPS geofence tracking.'
                  : roleFilter === 'intern'
                  ? 'Verify active intern attendance check-in locations with GPS geofence tracking.'
                  : 'Verify volunteer and intern attendance check-in locations with GPS geofence tracking.'}
              </p>
            </div>

            <button
              onClick={verifyAllInRange}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 cursor-pointer shrink-0"
            >
              <Check className="h-4 w-4" /> Verify In-Range Check-ins
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading attendance records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              No attendance records found for this view.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5 text-left">Volunteer</th>
                  <th className="px-6 py-3.5 text-left">Role Type</th>
                  <th className="px-6 py-3.5 text-left">Date</th>
                  <th className="px-6 py-3.5 text-left">Check-in</th>
                  <th className="px-6 py-3.5 text-left">Check-out</th>
                  <th className="px-6 py-3.5 text-left">Distance From Site</th>
                  <th className="px-6 py-3.5 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.map((r) => {
                  const dist = Math.round(distanceMeters({ latitude: r.in_latitude, longitude: r.in_longitude }, SITE));
                  const flagged = dist > FLAG_RADIUS_METERS;
                  const isStudent = r.role === 'student';

                  return (
                    <tr key={r.id} className={`hover:bg-slate-50/50 ${flagged ? 'bg-rose-50/40' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{r.student_name || 'Volunteer'}</div>
                        <div className="text-[11px] text-slate-400">{r.student_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                            isStudent
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'bg-teal-50 border-teal-200 text-teal-700'
                          }`}
                        >
                          {isStudent ? <GraduationCap className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                          {isStudent ? 'Student' : 'Intern'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(r.check_in_at)}</td>
                      <td className="px-6 py-4">
                        <div className="font-mono font-medium">{formatTime(r.check_in_at)}</div>
                        <a
                          href={mapsLink({ latitude: r.in_latitude, longitude: r.in_longitude })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline"
                        >
                          <MapPin className="h-3 w-3" /> View pin
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {r.check_out_at ? (
                          <>
                            <div className="font-mono font-medium">{formatTime(r.check_out_at)}</div>
                            {r.out_latitude != null && r.out_longitude != null && (
                              <a
                                href={mapsLink({ latitude: r.out_latitude, longitude: r.out_longitude })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline"
                              >
                                <MapPin className="h-3 w-3" /> View pin
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="text-amber-700 font-semibold">Active session</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {flagged ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                            <ShieldAlert className="h-3.5 w-3.5" /> {dist.toLocaleString()}m — outside geofence
                          </span>
                        ) : (
                          <span className="text-slate-500">{dist}m — on site</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {r.verified ? (
                          <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => verifyOne(r.id)}
                            disabled={verifyingId === r.id}
                            className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 hover:bg-amber-100 cursor-pointer disabled:opacity-50"
                          >
                            {verifyingId === r.id ? 'Verifying...' : 'Confirm Presence'}
                          </button>
                        )}
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

export default function AdminAttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading attendance...</div>}>
      <AdminAttendanceContent />
    </Suspense>
  );
}
