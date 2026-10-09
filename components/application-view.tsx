'use client';

import React from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import { ApplicationStatus } from '@/lib/supabase/types';
import { FileText, CheckCircle2, Clock, XCircle, ArrowLeft } from 'lucide-react';

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rejected: 'border-rose-200 bg-rose-50 text-rose-800',
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_COPY: Record<ApplicationStatus, { title: string; body: string }> = {
  pending: {
    title: 'Application Under Review',
    body: 'Your application has been submitted and is waiting for an NGO admin to review it.',
  },
  approved: {
    title: 'Application Approved',
    body: 'Your internship application has been approved. Check the Project tab for your allocation and deliverables.',
  },
  rejected: {
    title: 'Application Not Approved',
    body: 'Your application was not approved. Please contact the NGO team for details.',
  },
};

function Field({ label, value, wide = false }: { label: string; value?: string; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <span className="block text-xs font-semibold text-slate-700">{label}</span>
      <div className="mt-1.5 min-h-[2.5rem] whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700">
        {value || <span className="text-slate-400">Not provided</span>}
      </div>
    </div>
  );
}

export function ApplicationView({ role }: { role: 'student' | 'intern' }) {
  const { profile, user } = useAuth();
  const status: ApplicationStatus = profile?.application_status || 'approved';
  const copy = STATUS_COPY[status];
  const StatusIcon = status === 'approved' ? CheckCircle2 : status === 'rejected' ? XCircle : Clock;
  const calloutIcon = {
    pending: 'bg-amber-50 text-amber-600',
    approved: 'bg-teal-50 text-teal-600',
    rejected: 'bg-rose-50 text-rose-600',
  }[status];

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role={role} />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={`/${role}/dashboard`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Internship Application</h1>
            <p className="text-sm text-slate-600">The details you submitted for NGO placement and their review status.</p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold shadow-2xs ${STATUS_STYLES[status]}`}
          >
            <Clock className="h-4 w-4" />
            Status: {STATUS_LABEL[status]}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${calloutIcon}`}>
              <StatusIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{copy.title}</h2>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{copy.body}</p>
              {profile?.reviewed_at && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Reviewed on {new Date(profile.reviewed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
            <FileText className="h-4 w-4 text-indigo-500" /> Applicant Information
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Full Name" value={profile?.name} />
            <Field label="Contact Email" value={profile?.email || user?.email} />
            <Field label="Phone" value={profile?.phone} />
            <Field label="University / College" value={profile?.college} />
            <Field label="Degree & Major" value={profile?.degree} />
            <Field label="Program Field of Interest" value={profile?.program_interest} />
            <Field label="Skills" value={profile?.skills} wide />
            <Field label="Résumé / Document" value={profile?.resume_name || undefined} wide />
            <Field label="Statement of Purpose" value={profile?.statement_of_purpose} wide />
          </div>
          {profile?.created_at && (
            <p className="mt-5 text-[11px] text-slate-400">
              Account created {new Date(profile.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
