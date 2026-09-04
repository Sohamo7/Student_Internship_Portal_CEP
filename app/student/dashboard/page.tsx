'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';
import {
  FileText,
  Briefcase,
  CalendarCheck,
  ClipboardList,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, profile, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/student/dashboard');
    } else if (!isLoading && role && role !== 'student') {
      router.push('/admin/dashboard');
    }
  }, [user, role, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 bg-slate-50/60">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <span className="text-xs font-medium text-slate-500">Loading student workspace...</span>
        </div>
      </div>
    );
  }

  const studentName = profile?.name || 'Student';

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      {/* Responsive Left Navigation */}
      <Sidebar role="student" />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl">
        {/* Student Welcome Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Welcome, {studentName}!
              </h1>
              <span className="rounded-md bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                Student
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Here is your internship onboarding progress and assignment overview.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 shadow-2xs">
              <Clock className="h-3.5 w-3.5 text-indigo-600" />
              Week 1 Active
            </span>
          </div>
        </div>

        {/* Foundation Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Application Status"
            value="Not Submitted"
            subtitle="Application form opens in Week 2"
            badge="Week 2"
            badgeColor="amber"
            icon={<FileText className="h-5 w-5 text-amber-600" />}
          />

          <StatCard
            title="Assigned Project"
            value="Not Assigned"
            subtitle="Matched after application approval"
            badge="Week 3"
            badgeColor="purple"
            icon={<Briefcase className="h-5 w-5 text-purple-600" />}
          />

          <StatCard
            title="Attendance"
            value="0 / 0 Days"
            subtitle="Daily check-ins start in Week 4"
            badge="Week 4"
            badgeColor="blue"
            icon={<CalendarCheck className="h-5 w-5 text-blue-600" />}
          />

          <StatCard
            title="Work Log"
            value="0 Logged"
            subtitle="Weekly activity submissions"
            badge="Week 4"
            badgeColor="slate"
            icon={<ClipboardList className="h-5 w-5 text-slate-600" />}
          />
        </div>

        {/* Quick Action Modules */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Internship Modules
            </h2>
            <span className="text-xs font-semibold text-slate-500">Foundation Mode</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Module 1: Application */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">My Application</h3>
              <p className="mt-1 text-xs text-slate-600">
                Submit academic details, resume, and NGO program preferences.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Week 2 Target
                </span>
                <button
                  disabled
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 cursor-not-allowed"
                >
                  Opens Soon <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Module 2: My Project */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">My Project</h3>
              <p className="mt-1 text-xs text-slate-600">
                View matched NGO project deliverables, mentor contacts, and goals.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                  Week 3 Target
                </span>
                <button
                  disabled
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 cursor-not-allowed"
                >
                  Opens Soon <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Module 3: Attendance */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">Attendance</h3>
              <p className="mt-1 text-xs text-slate-600">
                Log daily working hours, on-site presence, and weekly schedule.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Week 4 Target
                </span>
                <button
                  disabled
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 cursor-not-allowed"
                >
                  Opens Soon <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Module 4: Work Log */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">Work Log</h3>
              <p className="mt-1 text-xs text-slate-600">
                Summarize completed tasks and upload project artifacts.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  Week 4 Target
                </span>
                <button
                  disabled
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 cursor-not-allowed"
                >
                  Opens Soon <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Banner */}
        <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Week 1 Foundation Milestone Achieved
              </h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Your student authentication and role separation are fully functioning. Your account is secured by Supabase RLS and Next.js route protection. In Week 2, the interactive internship application form will be linked here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
