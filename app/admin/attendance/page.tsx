'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { mapsLink } from '@/lib/geolocation';
import {
  AttendanceRow,
  fetchAllAttendance,
  verifyAttendance,
  verifyAttendanceBulk,
  formatTime,
  formatDate,
} from '@/lib/attendance';
import {
  ArrowLeft,
  Check,
  MapPin,
  ShieldAlert,
  Loader2,
  GraduationCap,
  Users,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

const DEFAULT_SITE = { latitude: 28.6139, longitude: 77.209 };
const DEFAULT_RADIUS_METERS = 500;

function getSiteConfig() {
  const envLat = process.env.NEXT_PUBLIC_NGO_SITE_LATITUDE;
  const envLng = process.env.NEXT_PUBLIC_NGO_SITE_LONGITUDE;
  const envRadius = process.env.NEXT_PUBLIC_NGO_GEOFENCE_RADIUS_METERS;

  const lat = envLat ? parseFloat(envLat) : DEFAULT_SITE.latitude;
  const lng = envLng ? parseFloat(envLng) : DEFAULT_SITE.longitude;
  const radius = envRadius ? parseFloat(envRadius) : DEFAULT_RADIUS_METERS;

  return {
    site: {
      latitude: isNaN(lat) ? DEFAULT_SITE.latitude : lat,
      longitude: isNaN(lng) ? DEFAULT_SITE.longitude : lng,
    },
    radiusMeters: isNaN(radius) || radius <= 0 ? DEFAULT_RADIUS_METERS : radius,
  };
}

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [bulkVerifying, setBulkVerifying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { site, radiusMeters } = getSiteConfig();

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchAllAttendance();
      setRecords(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'student' || r === 'intern') {
      setRoleFilter(r);
    } else {
      setRoleFilter('all');
    }
  }, [searchParams]);

  const verifyOne = async (id: string) => {
    setVerifyingId(id);
    setActionError(null);
    setActionSuccess(null);
    try {
      await verifyAttendance(id);
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, verified: true } : r)));
      setActionSuccess('Attendance verified successfully.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to verify attendance.');
    } finally {
      setVerifyingId(null);
    }
  };

  const verifyAllInRange = async () => {
    setActionError(null);
    setActionSuccess(null);

    const toVerify = records.filter(
      (r) =>
        !r.verified &&
        (roleFilter === 'all' || r.role === roleFilter) &&
        r.in_latitude != null &&
        r.in_longitude != null &&
        distanceMeters({ latitude: r.in_latitude, longitude: r.in_longitude }, site) <= radiusMeters
    );

    if (toVerify.length === 0) {
      setActionError('No unverified in-range check-ins found to verify.');
      return;
    }

    setBulkVerifying(true);

    try {
      const result = await verifyAttendanceBulk(toVerify.map((r) => r.id));

      if (result.successfulIds.length > 0) {
        setRecords((prev) =>
          prev.map((r) => (result.successfulIds.includes(r.id) ? { ...r, verified: true } : r))
        );
      }

      if (result.failed.length > 0) {
        const errorDetails = result.failed.map((f) => f.error).join('; ');
        setActionError(
          `Verified ${result.successfulIds.length} record(s). ${result.failed.length} record(s) failed: ${errorDetails}`
        );
      } else {
        setActionSuccess(`Successfully verified ${result.successfulIds.length} in-range check-in(s).`);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Bulk verification failed.');
    } finally {
      setBulkVerifying(false);
    }
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
              disabled={bulkVerifying || loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {bulkVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying Records...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Verify In-Range Check-ins
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback banners */}
        {actionError && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {loadError && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Unable to load attendance records</span>
              <p>{loadError}</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading attendance records from database...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              {roleFilter === 'intern'
                ? 'No intern attendance records found. Only records belonging to profiles with role "intern" appear here.'
                : roleFilter === 'student'
                ? 'No student attendance records found. Only records belonging to profiles with role "student" appear here.'
                : 'No attendance records found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                    const hasLocation = r.in_latitude != null && r.in_longitude != null;
                    const dist = hasLocation
                      ? Math.round(distanceMeters({ latitude: r.in_latitude, longitude: r.in_longitude }, site))
                      : null;
                    const flagged = dist != null && dist > radiusMeters;
                    const isStudent = r.role === 'student';
                    const isIntern = r.role === 'intern';

                    return (
                      <tr key={r.id} className={`hover:bg-slate-50/50 ${flagged ? 'bg-rose-50/40' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{r.student_name || 'Volunteer'}</div>
                          <div className="text-[11px] text-slate-400">{r.student_email || r.student_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          {isIntern ? (
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border bg-teal-50 border-teal-200 text-teal-700">
                              <Users className="h-3 w-3" /> Intern
                            </span>
                          ) : isStudent ? (
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border bg-indigo-50 border-indigo-200 text-indigo-700">
                              <GraduationCap className="h-3 w-3" /> Student
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border bg-slate-100 border-slate-200 text-slate-600">
                              <HelpCircle className="h-3 w-3" /> Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">{formatDate(r.check_in_at)}</td>
                        <td className="px-6 py-4">
                          <div className="font-mono font-medium">{formatTime(r.check_in_at)}</div>
                          {hasLocation ? (
                            <a
                              href={mapsLink({ latitude: r.in_latitude, longitude: r.in_longitude })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline"
                            >
                              <MapPin className="h-3 w-3" /> View pin
                              {r.in_accuracy != null ? ` (±${Math.round(r.in_accuracy)}m)` : ''}
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400">Location not captured</span>
                          )}
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
                                  {r.out_accuracy != null ? ` (±${Math.round(r.out_accuracy)}m)` : ''}
                                </a>
                              )}
                            </>
                          ) : (
                            <span className="text-amber-700 font-semibold">Active session</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {dist == null ? (
                            <span className="text-slate-400">Location unavailable</span>
                          ) : flagged ? (
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
                              disabled={verifyingId === r.id || bulkVerifying}
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
            </div>
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
