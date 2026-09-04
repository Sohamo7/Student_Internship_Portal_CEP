'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';
import {
  Users,
  FileText,
  Briefcase,
  CalendarCheck,
  ClipboardList,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, profile, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/admin/dashboard');
    } else if (!isLoading && role && role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, role, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 bg-slate-50/60">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-purple-600 border-t-transparent" />
          <span className="text-xs font-medium text-slate-500">Loading admin console...</span>
        </div>
      </div>
    );
  }

  const adminName = profile?.name || 'NGO Administrator';

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="admin" />

      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                NGO Management Console
              </h1>
              <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                Admin
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back, {adminName}. Manage applicants, assign projects, and verify student engagement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              Admin Authorization Active
            </span>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/students" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Registered Students"
              value="18"
              subtitle="Click to open directory"
              badge="Active"
              badgeColor="blue"
              icon={<Users className="h-5 w-5 text-blue-600" />}
            />
          </Link>

          <Link href="/admin/applications" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Applications"
              value="6 Pending"
              subtitle="Click to review applicants"
              badge="Action Req."
              badgeColor="amber"
              icon={<FileText className="h-5 w-5 text-amber-600" />}
            />
          </Link>

          <Link href="/admin/projects" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Projects"
              value="4 Programs"
              subtitle="Click to allocate students"
              badge="Allotted"
              badgeColor="purple"
              icon={<Briefcase className="h-5 w-5 text-purple-600" />}
            />
          </Link>

          <Link href="/admin/attendance" className="block transition-transform hover:-translate-y-0.5">
            <StatCard
              title="Attendance Today"
              value="17 Verified"
              subtitle="Click for daily log"
              badge="94%"
              badgeColor="emerald"
              icon={<CalendarCheck className="h-5 w-5 text-emerald-600" />}
            />
          </Link>
        </div>

        {/* NGO Action Modules */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Management Modules
            </h2>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              All Sections Connected
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Applications */}
            <Link
              href="/admin/applications"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-amber-400 hover:shadow-md block"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  6 Pending
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Review Applications</h3>
              <p className="mt-1 text-xs text-slate-600">
                Evaluate student submissions and approve or decline applicants with 1-click actions.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                Open Review <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            {/* 2. Students */}
            <Link
              href="/admin/students"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-blue-400 hover:shadow-md block"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  18 Students
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Student Directory</h3>
              <p className="mt-1 text-xs text-slate-600">
                Access list of verified students, view contact details, projects, and attendance streaks.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-700 group-hover:translate-x-0.5 transition-transform">
                View Directory <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            {/* 3. Projects */}
            <Link
              href="/admin/projects"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-purple-400 hover:shadow-md block"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Briefcase className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                  4 Active
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Project Allocation</h3>
              <p className="mt-1 text-xs text-slate-600">
                Create NGO community projects, set capacity quotas, and map student interns.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-700 group-hover:translate-x-0.5 transition-transform">
                Manage Projects <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            {/* 4. Attendance */}
            <Link
              href="/admin/attendance"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-emerald-400 hover:shadow-md block"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Live Log
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Attendance Verification</h3>
              <p className="mt-1 text-xs text-slate-600">
                Monitor student attendance streaks, check-in timestamps, and verify daily presences.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                Verify Attendance <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            {/* 5. Work Logs */}
            <Link
              href="/admin/work-logs"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-indigo-400 hover:shadow-md block"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  Review
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Work Log Approvals</h3>
              <p className="mt-1 text-xs text-slate-600">
                Review weekly activity reports, deliverables submitted, and mark milestones approved.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-700 group-hover:translate-x-0.5 transition-transform">
                Open Reports <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            {/* 6. Settings */}
            <Link
              href="/admin/settings"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-slate-400 hover:shadow-md block"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  Config
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 group-hover:text-slate-700 transition-colors">NGO Settings</h3>
              <p className="mt-1 text-xs text-slate-600">
                Manage organization profile, intake application windows, and supervisor contacts.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:translate-x-0.5 transition-transform">
                Configure <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
