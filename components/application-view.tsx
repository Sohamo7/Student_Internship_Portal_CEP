'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import { ApplicationStatus } from '@/lib/supabase/types';
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  Pencil,
  Save,
  Undo2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

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

const PROGRAM_INTERESTS = [
  'Education & Tutoring',
  'Healthcare & Public Health',
  'Environmental Conservation',
  'Vocational Training',
  'Community Outreach',
  'Digital Literacy',
  'Women Empowerment',
];

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
  const { profile, user, updateProfile } = useAuth();
  const status: ApplicationStatus = profile?.application_status || 'approved';
  const copy = STATUS_COPY[status];
  const StatusIcon = status === 'approved' ? CheckCircle2 : status === 'rejected' ? XCircle : Clock;
  const calloutIcon = {
    pending: 'bg-amber-50 text-amber-600',
    approved: 'bg-teal-50 text-teal-600',
    rejected: 'bg-rose-50 text-rose-600',
  }[status];

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [degree, setDegree] = useState(profile?.degree || '');
  const [programInterest, setProgramInterest] = useState(profile?.program_interest || PROGRAM_INTERESTS[0]);
  const [skills, setSkills] = useState(profile?.skills || '');
  const [statementOfPurpose, setStatementOfPurpose] = useState(profile?.statement_of_purpose || '');

  const startEditing = () => {
    setName(profile?.name || '');
    setPhone(profile?.phone || '');
    setCollege(profile?.college || '');
    setDegree(profile?.degree || '');
    setProgramInterest(profile?.program_interest || PROGRAM_INTERESTS[0]);
    setSkills(profile?.skills || '');
    setStatementOfPurpose(profile?.statement_of_purpose || '');
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSaveError('Full Name is required.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      if (updateProfile) {
        const res = await updateProfile({
          name: name.trim(),
          phone: phone.trim(),
          college: college.trim(),
          degree: degree.trim(),
          program_interest: programInterest.trim(),
          skills: skills.trim(),
          statement_of_purpose: statementOfPurpose.trim(),
        });
        if (!res.success) {
          throw new Error(res.error || 'Failed to update application.');
        }
      }
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save application changes.');
    } finally {
      setSaving(false);
    }
  };

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

        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 shadow-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Your application details have been updated successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-xs">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-3 border-b border-slate-100">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <FileText className="h-4 w-4 text-indigo-500" /> Applicant Information
            </h2>

            {!isEditing ? (
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Application
              </button>
            ) : (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  <Undo2 className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
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
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Email <span className="text-slate-400 font-normal">(Primary account email)</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile?.email || user?.email || ''}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2 text-xs text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">University / College</label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. National Institute of Technology"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Degree & Major</label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. B.Tech Computer Science, B.A. Social Work"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Program Field of Interest</label>
                  <select
                    value={programInterest}
                    onChange={(e) => setProgramInterest(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {PROGRAM_INTERESTS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Skills & Proficiencies</label>
                  <textarea
                    rows={2}
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. Teaching, Data Analysis, Community Organizing, Content Writing"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Statement of Purpose</label>
                  <textarea
                    rows={4}
                    value={statementOfPurpose}
                    onChange={(e) => setStatementOfPurpose(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Describe your motivation for volunteering with this NGO and what you hope to achieve..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {saving ? 'Saving...' : 'Save Application Changes'}
                </button>
              </div>
            </form>
          )}

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

