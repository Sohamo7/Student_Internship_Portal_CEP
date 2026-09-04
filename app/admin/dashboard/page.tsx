'use client';

import React, { useEffect } from 'react';
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
  Lock,
  ArrowRight,
  UserCheck,
  CheckCircle2
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
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-purple-600 border-t-transparent" />
          <span className="text-xs font-medium text-slate-500">Loading admin console...</span>
        </div>
      </div>
    );
  }

  const adminName = profile?.name || 'Administrator';

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar role="admin" />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl dark:text-white">
                NGO Administration Portal
              </h1>
              <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                Admin
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Welcome back, {adminName}. Manage applicants, assign projects, and verify student engagement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/50 px-3 py-2 text-xs font-medium text-purple-700 shadow-2xs dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300">
              <ShieldCheck className="h-4 w-4" />
              Admin Authorization Active
            </span>
          </div>
        </div>

        {/* Foundation Metric Cards (Task 10) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Registered Students"
            value="0"
            subtitle="Public student accounts"
            badge="Week 1"
            badgeColor="blue"
            icon={<Users className="h-5 w-5 text-blue-600" />}
          />

          <StatCard
            title="Applications"
            value="0"
            subtitle="Pending intake review"
            badge="Week 2"
            badgeColor="amber"
            icon={<FileText className="h-5 w-5 text-amber-600" />}
          />

          <StatCard
            title="Projects"
            value="0"
            subtitle="NGO active programs"
            badge="Week 3"
            badgeColor="purple"
            icon={<Briefcase className="h-5 w-5 text-purple-600" />}
          />

          <StatCard
            title="Attendance Today"
            value="0"
            subtitle="Verified daily sign-ins"
            badge="Week 4"
            badgeColor="emerald"
            icon={<CalendarCheck className="h-5 w-5 text-emerald-600" />}
          />
        </div>

        {/* NGO Action Modules (Task 10) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Management Modules
            </h2>
            <span className="text-xs text-slate-500">Foundation Ready</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Applications */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-purple-200 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Week 2
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">Review Applications</h3>
              <p className="mt-1 text-xs text-slate-500">
                View student submissions, evaluate background, and approve or decline applicants.
              </p>
            </div>

            {/* 2. Students */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-purple-200 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Users className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Week 2
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">Student Directory</h3>
              <p className="mt-1 text-xs text-slate-500">
                Access list of verified students, view contact details and individual performance.
              </p>
            </div>

            {/* 3. Projects */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-purple-200 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Week 3
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">Project Allocation</h3>
              <p className="mt-1 text-xs text-slate-500">
                Create community projects, set quotas, and assign accepted students.
              </p>
            </div>

            {/* 4. Attendance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-purple-200 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Week 4
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">Attendance Verification</h3>
              <p className="mt-1 text-xs text-slate-500">
                Monitor student attendance streaks, check-in timestamps, and absences.
              </p>
            </div>

            {/* 5. Work Logs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-purple-200 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Week 4
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">Work Log Approvals</h3>
              <p className="mt-1 text-xs text-slate-500">
                Review weekly activity reports and milestone progress submissions.
              </p>
            </div>

            {/* Security Note */}
            <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-6 dark:border-purple-950 dark:bg-purple-950/20">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <ShieldCheck className="h-5 w-5" />
                <h4 className="text-sm font-bold">Protected NGO Zone</h4>
              </div>
              <p className="mt-2 text-xs text-purple-900/80 dark:text-purple-200/80">
                Access to this console is strictly restricted to accounts with <code className="font-mono font-bold">role = 'admin'</code> in the database.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
