'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  RotateCw,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { useOrgSettings } from '@/lib/settings/use-org-settings';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlRole = searchParams.get('role');
  const roleFilter: 'student' | 'intern' = urlRole === 'intern' ? 'intern' : 'student';

  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [bulkVerifying, setBulkVerifying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { settings: orgSettings } = useOrgSettings();
  const geofence = orgSettings.geofence;
  const envConfig = getSiteConfig();

  const site = {
    latitude:
      typeof geofence?.latitude === 'number' && !isNaN(geofence.latitude)
        ? geofence.latitude
        : envConfig.site.latitude,
    longitude:
      typeof geofence?.longitude === 'number' && !isNaN(geofence.longitude)
        ? geofence.longitude
        : envConfig.site.longitude,
  };
  const radiusMeters =
    typeof geofence?.radius_meters === 'number' && geofence.radius_meters > 0
      ? geofence.radius_meters
      : envConfig.radiusMeters;
  const geofenceEnabled = geofence?.enabled ?? true;
  const siteName = geofence?.site_name || 'Main NGO Center';

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
    let isMounted = true;
    fetchAllAttendance()
      .then((data) => {
        if (isMounted) setRecords(data);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err instanceof Error ? err.message : 'Failed to load attendance records.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
        (roleFilter === 'intern' ? r.role === 'intern' : (r.role === 'student' || r.role == null)) &&
        (!geofenceEnabled ||
          (r.in_latitude != null &&
            r.in_longitude != null &&
            distanceMeters({ latitude: r.in_latitude, longitude: r.in_longitude }, site) <= radiusMeters))
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
    if (roleFilter === 'intern') return r.role === 'intern';
    return r.role === 'student' || r.role == null;
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
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-purple-600" />
                  {siteName}
                </span>
                <span>·</span>
                <span className={geofenceEnabled ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                  {geofenceEnabled ? `Geofence: ${radiusMeters.toLocaleString()}m radius` : 'Geofence disabled'}
                </span>
                <a
                  href={mapsLink(site)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-purple-600 hover:underline font-medium"
                >
                  <ExternalLink className="h-3 w-3" /> View pin
                </a>
                <span>·</span>
                <Link
                  href="/admin/settings"
                  className="inline-flex items-center gap-1 text-purple-600 hover:underline font-medium"
                >
                  <Settings className="h-3 w-3" /> Configure in Settings
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={load}
                disabled={loading || bulkVerifying}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                title="Refresh attendance records"
              >
                <RotateCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
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
            <div className="p-10 text-center space-y-3">
              <p className="text-xs text-slate-500">
                {roleFilter === 'intern'
                  ? 'No intern attendance records found. When interns check in on their devices, their logs will appear here.'
                  : 'No student attendance records found. When student volunteers check in on their devices, their logs will appear here.'}
              </p>
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
                    const flagged = geofenceEnabled && dist != null && dist > radiusMeters;
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
                          ) : !geofenceEnabled ? (
                            <span className="text-slate-500">{dist.toLocaleString()}m (geofence off)</span>
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
