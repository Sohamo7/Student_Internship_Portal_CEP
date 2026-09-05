'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ApplicationStatus, UserProfile } from '@/lib/supabase/types';
import {
  Search,
  ArrowLeft,
  Check,
  X,
  Loader2,
} from 'lucide-react';

type FilterOption = 'All' | ApplicationStatus;

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

// Reads/writes the same localStorage record that the "Apply" tab on /login
// writes to in demo/offline mode, so approving here really unlocks sign in.
function readLocalApplications(): UserProfile[] {
  try {
    const stored = JSON.parse(localStorage.getItem('cep_registered_users') || '{}');
    return Object.values(stored as Record<string, { profile: UserProfile }>).map((u) => u.profile);
  } catch {
    return [];
  }
}

function writeLocalApplicationStatus(email: string, status: ApplicationStatus) {
  const stored = JSON.parse(localStorage.getItem('cep_registered_users') || '{}');
  if (stored[email]) {
    stored[email].profile.application_status = status;
    stored[email].profile.reviewed_at = new Date().toISOString();
    localStorage.setItem('cep_registered_users', JSON.stringify(stored));
  }
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const configured = isSupabaseConfigured();

  const loadApplications = async () => {
    setLoading(true);
    if (configured) {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });
      setApplications((data as UserProfile[]) || []);
    } else {
      setApplications(readLocalApplications());
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    loadApplications();
  }, []);

  const updateStatus = async (applicant: UserProfile, newStatus: ApplicationStatus) => {
    setUpdatingId(applicant.id);
    if (configured) {
      const supabase = createClient();
      await supabase
        .from('profiles')
        .update({ application_status: newStatus, reviewed_at: new Date().toISOString() })
        .eq('id', applicant.id);
    } else {
      writeLocalApplicationStatus(applicant.email, newStatus);
    }
    setApplications((prev) =>
      prev.map((a) => (a.id === applicant.id ? { ...a, application_status: newStatus } : a))
    );
    setUpdatingId(null);
  };

  const filtered = applications.filter((a) => {
    const status: ApplicationStatus = a.application_status || 'approved';
    const matchesFilter = filter === 'All' || status === filter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      a.name.toLowerCase().includes(term) || (a.college || '').toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = applications.filter((a) => (a.application_status || 'approved') === 'pending').length;

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
                Review Student Applications
              </h1>
              <p className="text-sm text-slate-600">
                Approving an applicant here is what unlocks the <strong>Sign In</strong> tab on their login page —
                new volunteers can&apos;t access the portal until you do this.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                {pendingCount} Pending Intake
              </span>
            </div>
          </div>
          {!configured && (
            <p className="mt-2 text-[11px] text-slate-400">
              Demo mode: reading applications submitted via the Apply tab from this browser&apos;s local storage.
            </p>
          )}
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search applicant name or university..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2 text-xs text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {(['All', 'pending', 'approved', 'rejected'] as FilterOption[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f === 'All' ? 'All' : STATUS_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Applications Table */}
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading applications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              No applications match this filter yet.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5 text-left">Applicant</th>
                  <th className="px-6 py-3.5 text-left">University</th>
                  <th className="px-6 py-3.5 text-left">Program Track</th>
                  <th className="px-6 py-3.5 text-left">Applied Date</th>
                  <th className="px-6 py-3.5 text-left">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((app) => {
                  const status: ApplicationStatus = app.application_status || 'approved';
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{app.name}</div>
                        <div className="text-[11px] text-slate-400">{app.email}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{app.college || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                          {app.program_interest || app.degree || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold border ${
                            status === 'approved'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : status === 'rejected'
                              ? 'bg-rose-50 border-rose-200 text-rose-800'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => updateStatus(app, 'approved')}
                            disabled={updatingId === app.id || status === 'approved'}
                            className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Approve — unlocks portal login for this volunteer"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(app, 'rejected')}
                            disabled={updatingId === app.id || status === 'rejected'}
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Reject application"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
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
