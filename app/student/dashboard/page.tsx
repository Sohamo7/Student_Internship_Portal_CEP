'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
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
  Sparkles,
  UserCheck
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
      <Sidebar role="student" />

      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl">
        {/* Welcome Header */}
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
              Here is your internship onboarding progress and connected modules.
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
          <Link href="/student/application" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Application Status"
              value="In Review"
              subtitle="Click to view submitted form"
              badge="Ready"
              badgeColor="amber"
              icon={<FileText className="h-5 w-5 text-amber-600" />}
            />
          </Link>

          <Link href="/student/project" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Assigned Project"
              value="Digital Literacy"
              subtitle="Click to view deliverables"
              badge="Assigned"
              badgeColor="purple"
              icon={<Briefcase className="h-5 w-5 text-purple-600" />}
            />
          </Link>

          <Link href="/student/attendance" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Attendance"
              value="23 / 24 Days"
              subtitle="Click for daily check-in"
              badge="95.8%"
              badgeColor="emerald"
              icon={<CalendarCheck className="h-5 w-5 text-emerald-600" />}
            />
          </Link>

          <Link href="/student/work-log" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Work Log"
              value="3 Logged"
              subtitle="Click to submit weekly report"
              badge="Active"
              badgeColor="blue"
              icon={<ClipboardList className="h-5 w-5 text-blue-600" />}
            />
          </Link>
        </div>

        {/* Connected Modules Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Connected Modules
            </h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              All Sections Connected
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Module 1: Application */}
            <Link
              href="/student/application"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-indigo-400 hover:shadow-md block"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">My Application</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Submit academic details, preferences, and view approval status.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Application Active
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>

            {/* Module 2: My Project */}
            <Link
              href="/student/project"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-purple-400 hover:shadow-md block"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900 group-hover:text-purple-600 transition-colors">My Project</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                View matched NGO project deliverables, mentor contacts, and goals.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                  Assigned
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 group-hover:translate-x-0.5 transition-transform">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>

            {/* Module 3: Attendance */}
            <Link
              href="/student/attendance"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-emerald-400 hover:shadow-md block"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Attendance</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Log daily check-ins, record working hours, and check streaks.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Check-in Ready
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                  Check In <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>

            {/* Module 4: Work Log */}
            <Link
              href="/student/work-log"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-blue-400 hover:shadow-md block"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Work Log</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Summarize completed tasks, log hours, and submit weekly reports.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  3 Logged
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  Submit <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
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
                Connected Dashboards Active
              </h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                All sections (Application, Project, Attendance, Work Logs, Profile) are now live and connected. You can also click <strong>"Switch to Admin Console"</strong> in the top bar to inspect the NGO administrative review center.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
