'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import {
  GraduationCap,
  Shield,
  ArrowRight,
  CheckCircle,
  Database,
  Lock,
  Compass,
  FileCheck2,
  Calendar,
  Award
} from 'lucide-react';

export default function LandingPage() {
  const { user, role } = useAuth();

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-indigo-50/50 via-white to-white py-16 sm:py-24 dark:border-slate-800 dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/50 dark:text-indigo-300">
              <span>🚀 Week 1 Completed — Core Foundation Online</span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              Connecting Students with <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Purpose-Driven</span> NGO Projects
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
              The official portal for student internships, project matching, real-time attendance verification, and performance certification.
            </p>

            {/* Quick Action CTA */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <Link
                  href={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all"
                  >
                    <GraduationCap className="h-5 w-5" />
                    <span>Student Registration</span>
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span>Portal Login</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Role Flow Diagram Section */}
      <section className="py-16 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Architecture & Security
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Strict Role-Based Architecture
            </p>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Students and NGO administrators follow distinct authentication flows with server-enforced permissions.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Student Card */}
            <div className="relative rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white p-8 shadow-sm transition-all hover:shadow-md dark:border-indigo-950 dark:from-slate-900 dark:to-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Student Portal</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Public registration enabled. Students sign up with email and password to access their personal dashboard.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Self-serve registration & profile setup
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Access to /student/dashboard only
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Strictly blocked from NGO Admin routes
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800">
                <Link
                  href="/register"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                >
                  Register as a Student <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Admin Card */}
            <div className="relative rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/40 to-white p-8 shadow-sm transition-all hover:shadow-md dark:border-purple-950 dark:from-slate-900 dark:to-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">NGO Admin Portal</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Invitation-only security model. NGO administration accounts are created directly or promoted via database role assignments.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  No public admin self-registration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Full access to /admin/dashboard & management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Protected by Next.js Middleware and Supabase RLS
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
                >
                  Log in to Admin Console <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Week Roadmap Tracker */}
      <section className="py-16 bg-slate-50/80 border-t border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project Plan</h2>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">5-Week Development Roadmap</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Week 1 */}
            <div className="rounded-xl border-2 border-indigo-500 bg-white p-5 shadow-sm dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Week 1</span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Current</span>
              </div>
              <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Foundation</h4>
              <p className="mt-1 text-xs text-slate-500">Auth, Supabase RLS, Student/Admin Dashboards & Navigation.</p>
            </div>

            {/* Week 2 */}
            <div className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">Week 2</span>
              <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Applications</h4>
              <p className="mt-1 text-xs text-slate-500">Student detailed application form, admin review & accept/reject.</p>
            </div>

            {/* Week 3 */}
            <div className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">Week 3</span>
              <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Projects</h4>
              <p className="mt-1 text-xs text-slate-500">NGO project creation, student assignment, supervisor mapping.</p>
            </div>

            {/* Week 4 */}
            <div className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">Week 4</span>
              <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Attendance</h4>
              <p className="mt-1 text-xs text-slate-500">Daily check-in, weekly work logs, verification workflows.</p>
            </div>

            {/* Week 5 */}
            <div className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">Week 5</span>
              <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Certificates</h4>
              <p className="mt-1 text-xs text-slate-500">Completion approval, automated certificate generation & export.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
