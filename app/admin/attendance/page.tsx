'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { mapsLink } from '@/lib/geolocation';
import { AttendanceRow, fetchAllAttendance, verifyAttendance, formatTime, formatDate } from '@/lib/attendance';
import {
  ArrowLeft,
  Check,
  MapPin,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

// The NGO's registered site coordinates. In a later phase this should come
// from a settings table the admin can edit; hardcoded here for now.
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

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setRecords(await fetchAllAttendance());
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const verifyOne = async (id: string) => {
    setVerifyingId(id);
    await verifyAttendance(id);
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, verified: true } : r)));
    setVerifyingId(null);
  };

  const verifyAllInRange = async () => {
    const toVerify = records.filter((r) => !r.verified && distanceMeters({ latitude: r.in_latitude, longitude: r.in_longitude }, SITE) <= FLAG_RADIUS_METERS);
    await Promise.all(toVerify.map((r) => verifyAttendance(r.id)));
    setRecords((prev) => prev.map((r) => (toVerify.some((t) => t.id === r.id) ? { ...r, verified: true } : r)));
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
                Every check-in/out below carries the volunteer&apos;s captured GPS pin — rows flagged in red were
                logged more than {FLAG_RADIUS_METERS}m from the registered NGO site, so double-check before
                confirming those hours.
              </p>
            </div>

            <button
              onClick={verifyAllInRange}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 cursor-pointer shrink-0"
            >
              <Check className="h-4 w-4" /> Verify All In-Range Check-ins
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading attendance records...
            </div>
          ) : records.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">No attendance records yet.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5 text-left">Student Intern</th>
                  <th className="px-6 py-3.5 text-left">Date</th>
                  <th className="px-6 py-3.5 text-left">Check-in</th>
                  <th className="px-6 py-3.5 text-left">Check-out</th>
                  <th className="px-6 py-3.5 text-left">Distance From Site</th>
                  <th className="px-6 py-3.5 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((r) => {
                  const dist = Math.round(distanceMeters({ latitude: r.in_latitude, longitude: r.in_longitude }, SITE));
                  const flagged = dist > FLAG_RADIUS_METERS;
                  return (
                    <tr key={r.id} className={`hover:bg-slate-50/50 ${flagged ? 'bg-rose-50/40' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{r.student_name || 'Unknown Volunteer'}</div>
                        <div className="text-[11px] text-slate-400">{r.student_email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(r.check_in_at)}</td>
                      <td className="px-6 py-4">
                        <div className="font-mono font-medium">{formatTime(r.check_in_at)}</div>
                        <a href={mapsLink({ latitude: r.in_latitude, longitude: r.in_longitude })} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline">
                          <MapPin className="h-3 w-3" /> View pin
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {r.check_out_at ? (
                          <>
                            <div className="font-mono font-medium">{formatTime(r.check_out_at)}</div>
                            {r.out_latitude != null && r.out_longitude != null && (
                              <a href={mapsLink({ latitude: r.out_latitude, longitude: r.out_longitude })} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline">
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
