'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { formatPercent, loadAdminOverview, RosterMember } from '@/lib/dashboard/stats';
import {
  Users,
  Search,
  ArrowLeft,
  GraduationCap,
  Loader2,
} from 'lucide-react';

function AdminStudentsContent() {
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get('role');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'intern'>(
    initialRoleParam === 'student' ? 'student' : initialRoleParam === 'intern' ? 'intern' : 'all'
  );
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [unlinked, setUnlinked] = useState(0);
  const [loading, setLoading] = useState(true);

  // Approved volunteer profiles (applications data), each enriched with their
  // assigned projects (project service) plus derived attendance, logs and leave.
  useEffect(() => {
    let cancelled = false;
    loadAdminOverview()
      .then((overview) => {
        if (cancelled) return;
        setMembers(overview.roster.filter((m) => m.hasProfile));
        setUnlinked(overview.stats.unlinkedAssignees);
      })
      .catch((err) => console.error('Failed to load directory:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'student' || r === 'intern') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoleFilter(r);
    }
  }, [searchParams]);

  const studentCount = members.filter((m) => m.role === 'student').length;
  const internCount = members.filter((m) => m.role === 'intern').length;

  const filtered = members.filter((s) => {
    if (roleFilter !== 'all' && s.role !== roleFilter) return false;
    const term = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.projects.join(' ').toLowerCase().includes(term) ||
      s.college.toLowerCase().includes(term)
    );
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
                  ? 'Student Directory'
                  : roleFilter === 'intern'
                  ? 'Intern Directory'
                  : 'Volunteer & Intern Directory'}
              </h1>
              <p className="text-sm text-slate-600">
                {roleFilter === 'student'
                  ? 'Active student community engagement volunteers, college programs, and metrics.'
                  : roleFilter === 'intern'
                  ? 'Active professional interns, department placements, and metrics.'
                  : 'View student community engagement volunteers and active internship personnel.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {roleFilter !== 'intern' && (
                <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                  {studentCount} Students
                </span>
              )}
              {roleFilter !== 'student' && (
                <span className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">
                  {internCount} Active Interns
                </span>
              )}
            </div>
          </div>
        </div>

        {!loading && unlinked > 0 && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
            {unlinked} {unlinked === 1 ? 'person is' : 'people are'} assigned to a project or have attendance records but
            {unlinked === 1 ? ' has' : ' have'} no approved volunteer profile, so they are not listed here.
          </p>
        )}

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, college, or assigned project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2 text-xs text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3.5 text-left">Member</th>
                <th className="px-6 py-3.5 text-left">Joinee ID</th>
                <th className="px-6 py-3.5 text-left">Role Type</th>
                <th className="px-6 py-3.5 text-left">University / College</th>
                <th className="px-6 py-3.5 text-left">Assigned Project</th>
                <th className="px-6 py-3.5 text-left">Attendance Rate</th>
                <th className="px-6 py-3.5 text-left">Logs Submitted</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((s) => {
                const isStudent = s.role === 'student';
                return (
                  <tr key={s.key} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-400">{s.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {s.joinee_id ? (
                        <span className="inline-flex rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-700">
                          {s.joinee_id}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
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
                    <td className="px-6 py-4 font-medium text-slate-800">{s.college}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{s.projects.length > 0 ? (
                        <div className="flex flex-col items-start gap-1">
                          {s.projects.map((title) => (
                            <span key={title} className="rounded bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                              {title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}</td>
                    <td className="px-6 py-4 font-bold text-emerald-700">{formatPercent(s.attendanceRate)}</td>
                    <td className="px-6 py-4 font-mono font-semibold">{s.logs} reports</td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`rounded-md border px-2.5 py-0.5 text-[10px] font-bold ${
                          s.status === 'On Leave'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {loading && (
            <div className="flex items-center justify-center gap-2 p-8 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading directory...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">No members match this view yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminStudentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading directory...</div>}>
      <AdminStudentsContent />
    </Suspense>
  );
}
