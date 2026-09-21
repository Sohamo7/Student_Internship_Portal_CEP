'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { mapsLink } from '@/lib/geolocation';
import {
  ArrowLeft,
  Check,
  MapPin,
  ShieldAlert,
} from 'lucide-react';

interface AdminAttendanceRow {
  id: number;
  student: string;
  inTime: string;
  outTime: string;
  inLoc: { latitude: number; longitude: number };
  outLoc: { latitude: number; longitude: number };
  siteLoc: { latitude: number; longitude: number }; // the NGO center's registered location
  verified: boolean;
}

// Straight-line distance between two GPS points, in meters (Haversine formula).
function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const SITE: AdminAttendanceRow['siteLoc'] = { latitude: 28.6139, longitude: 77.209 }; // NGO center (demo)
const FLAG_RADIUS_METERS = 500;

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AdminAttendanceRow[]>([
    { id: 1, student: 'Rahul Sharma', inTime: '09:15 AM', outTime: '01:30 PM', inLoc: { latitude: 28.6141, longitude: 77.2093 }, outLoc: { latitude: 28.614, longitude: 77.2091 }, siteLoc: SITE, verified: true },
    { id: 2, student: 'Ananya Verma', inTime: '09:00 AM', outTime: '01:05 PM', inLoc: { latitude: 28.6137, longitude: 77.2088 }, outLoc: { latitude: 28.6138, longitude: 77.209 }, siteLoc: SITE, verified: true },
    { id: 3, student: 'Sneha Kulkarni', inTime: '09:20 AM', outTime: '01:10 PM', inLoc: { latitude: 28.6142, longitude: 77.2095 }, outLoc: { latitude: 28.6143, longitude: 77.2096 }, siteLoc: SITE, verified: true },
    { id: 4, student: 'Vikram Choudhury', inTime: '09:45 AM', outTime: '12:50 PM', inLoc: { latitude: 28.62, longitude: 77.225 }, outLoc: { latitude: 28.6205, longitude: 77.2255 }, siteLoc: SITE, verified: false },
    { id: 5, student: 'Kavita Nair', inTime: '09:10 AM', outTime: '01:00 PM', inLoc: { latitude: 28.6139, longitude: 77.2092 }, outLoc: { latitude: 28.614, longitude: 77.2093 }, siteLoc: SITE, verified: false },
  ]);

  const verifyStudent = (id: number) => {
    setRecords(records.map(r => r.id === id ? { ...r, verified: true } : r));
  };

  const verifyAll = () => {
    setRecords(records.map(r => (
      distanceMeters(r.inLoc, r.siteLoc) <= FLAG_RADIUS_METERS ? { ...r, verified: true } : r
    )));
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
                Today: Saturday, September 5, 2026. Each check-in/out below carries the volunteer&apos;s captured
                GPS pin — rows flagged in red were logged more than {FLAG_RADIUS_METERS}m from the registered NGO
                site, so double-check before confirming those hours.
              </p>
            </div>

            <button
              onClick={verifyAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 cursor-pointer shrink-0"
            >
              <Check className="h-4 w-4" /> Verify All In-Range Check-ins
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3.5 text-left">Student Intern</th>
                <th className="px-6 py-3.5 text-left">Check-in</th>
                <th className="px-6 py-3.5 text-left">Check-out</th>
                <th className="px-6 py-3.5 text-left">Distance From Site</th>
                <th className="px-6 py-3.5 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records.map(r => {
                const dist = Math.round(distanceMeters(r.inLoc, r.siteLoc));
                const flagged = dist > FLAG_RADIUS_METERS;
                return (
                  <tr key={r.id} className={`hover:bg-slate-50/50 ${flagged ? 'bg-rose-50/40' : ''}`}>
                    <td className="px-6 py-4 font-bold text-slate-900">{r.student}</td>
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium">{r.inTime}</div>
                      <a href={mapsLink(r.inLoc)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline">
                        <MapPin className="h-3 w-3" /> View pin
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium">{r.outTime}</div>
                      <a href={mapsLink(r.outLoc)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline">
                        <MapPin className="h-3 w-3" /> View pin
                      </a>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
