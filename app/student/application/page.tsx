'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import {
  FileText,
  CheckCircle2,
  Clock,
  Send,
  Upload,
  Sparkles,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

export default function StudentApplicationPage() {
  const { profile } = useAuth();
  const [submitted, setSubmitted] = useState(true);
  const [college, setCollege] = useState('Delhi Technological University (DTU)');
  const [degree, setDegree] = useState('B.Tech in Information Technology');
  const [interest, setInterest] = useState('Community Digital Literacy & Youth Education');
  const [sop, setSop] = useState('I want to volunteer my coding and digital skills to help teach basic computer literacy to underprivileged middle-school students in rural centers.');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="student" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/student/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Internship Application
            </h1>
            <p className="text-sm text-slate-600">
              Submit your academic credentials and program preferences for NGO placement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 shadow-2xs">
              <Clock className="h-4 w-4 text-amber-600" />
              Status: Under Review
            </span>
          </div>
        </div>

        {/* Status Callout */}
        <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Application Submitted</h2>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Your application was received by <strong>Navodaya Social Development Trust</strong>. The NGO coordinator will evaluate your statement and assign an active project.
              </p>
            </div>
          </div>
        </div>

        {/* Application Form Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
            Applicant Information
          </h2>

          {saveSuccess && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Application details updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={profile?.name || 'Rahul Sharma'}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Contact Email</label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || 'student@ngo.org'}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">University / College</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Degree & Major</label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Program Field of Interest</label>
              <select
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Community Digital Literacy & Youth Education">Community Digital Literacy & Youth Education</option>
                <option value="Rural Healthcare & Nutrition Awareness">Rural Healthcare & Nutrition Awareness</option>
                <option value="Environmental Sustainability & Clean Water">Environmental Sustainability & Clean Water</option>
                <option value="Women Empowerment & Vocational Training">Women Empowerment & Vocational Training</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Statement of Purpose</label>
              <textarea
                rows={4}
                value={sop}
                onChange={(e) => setSop(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">Resume: <code className="text-indigo-600 font-mono">rahul_resume_2026.pdf</code></span>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Save & Update Application</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
