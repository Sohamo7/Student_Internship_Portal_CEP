'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import {
  getStoredReportedIssues,
  createReportedIssue,
} from '@/lib/issues/issue-service';
import { ReportedIssue, IssuePriority } from '@/lib/supabase/types';
import {
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Calendar,
  AlertCircle,
  PlusCircle,
  MessageSquare,
  ShieldAlert,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';

const ISSUE_CATEGORIES = [
  'Technical & Equipment (Laptops, Network, Software)',
  'Field & Community Center Operations',
  'Supervisor & Mentorship Guidance',
  'Attendance & Hours Discrepancy',
  'Stipend, Certificate or Admin Query',
  'Other General Grievance',
];

const PRIORITIES: { value: IssuePriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low - General Question', color: 'border-slate-200 text-slate-700 bg-slate-50' },
  { value: 'medium', label: 'Medium - Standard Support', color: 'border-blue-200 text-blue-800 bg-blue-50' },
  { value: 'high', label: 'High - Project Blocker', color: 'border-amber-200 text-amber-800 bg-amber-50' },
  { value: 'urgent', label: 'Urgent - Immediate Attention', color: 'border-rose-200 text-rose-800 bg-rose-50' },
];

export default function InternReportIssuePage() {
  const { user, profile } = useAuth();
  const [issues, setIssues] = useState<ReportedIssue[]>([]);
  const [category, setCategory] = useState(ISSUE_CATEGORIES[0]);
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load intern's issues
  useEffect(() => {
    const all = getStoredReportedIssues();
    const userEmail = profile?.email || user?.email || 'intern@ngo.org';
    const filtered = all.filter((i) => i.applicant_email.toLowerCase() === userEmail.toLowerCase());
    setIssues(filtered);
  }, [user, profile]);

  const openCount = issues.filter((i) => i.status === 'open').length;
  const inProgressCount = issues.filter((i) => i.status === 'in_progress').length;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter a brief title describing the issue.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please describe the issue in detail.');
      return;
    }

    setSubmitting(true);
    const newIssue = createReportedIssue({
      applicant_id: user?.id || 'demo-intern-uuid-001',
      applicant_name: profile?.name || 'Aarav Patel',
      applicant_email: profile?.email || 'intern@ngo.org',
      category,
      priority,
      title: title.trim(),
      description: description.trim(),
    });

    setIssues((prev) => [newIssue, ...prev]);
    setTitle('');
    setDescription('');
    setSubmitting(false);
    setSuccessMsg('Your issue has been reported directly to the NGO Administration. They will review and send a solution.');
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="intern" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <Link
            href="/intern/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Report an Issue / Helpdesk
              </h1>
              <p className="text-sm text-slate-600">
                Facing difficulties or need equipment support? Report it directly to your NGO Admin team.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800 shadow-2xs">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              Direct Help Channel
            </span>
          </div>
        </div>

        {/* Issue Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Reported</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{issues.length}</div>
            <span className="text-[11px] text-slate-400">All submissions by you</span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-amber-700">Under Review / In Progress</span>
            <div className="text-2xl font-black text-amber-700 mt-1">{openCount + inProgressCount}</div>
            <span className="text-[11px] text-amber-600 font-medium">Pending admin resolution</span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-emerald-700">Resolved & Answered</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Solutions provided</span>
          </div>
        </div>

        {/* Report New Issue Form */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-rose-600" />
              Submit an Issue Report
            </h2>
            <span className="text-xs text-slate-500">NGO Admin is alerted immediately upon submission</span>
          </div>

          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {ISSUE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Urgency / Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as IssuePriority)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Issue Subject / Brief Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Broken projector at village learning center, need curriculum printouts..."
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Detailed Explanation & Location/Deliverable Affected
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, what assistance is needed, and any steps already attempted..."
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? 'Submitting...' : 'Send Issue to Admin'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* My Reported Issues History */}
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">My Reported Issues & Solutions</h2>
            <span className="text-xs text-slate-500">{issues.length} Record(s)</span>
          </div>

          {issues.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No issues reported. If you encounter any blockers during your internship, submit them above.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {issues.map((item) => (
                <div key={item.id} className="p-6 hover:bg-slate-50/50 transition-colors space-y-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          item.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : item.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.priority} priority
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="font-medium text-slate-700">{item.category}</span>
                        <span>•</span>
                        <span>Reported on {new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div>
                      {item.status === 'resolved' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Resolved
                        </span>
                      )}
                      {item.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                          <Clock className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                          In Progress
                        </span>
                      )}
                      {item.status === 'open' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                          Pending Admin Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs text-slate-700 leading-relaxed">
                    <strong className="block text-slate-900 mb-1">Your Report:</strong>
                    {item.description}
                  </div>

                  {/* Admin Solution Box */}
                  {item.admin_solution ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-emerald-800 text-xs">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span>Solution & Action Taken by NGO Admin:</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed font-medium pl-6">
                        {item.admin_solution}
                      </p>
                      {item.resolved_at && (
                        <div className="text-[10px] text-emerald-700 pl-6 pt-1">
                          Resolved on {new Date(item.resolved_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>Admin has not replied yet. They have been notified and will post a solution shortly.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
