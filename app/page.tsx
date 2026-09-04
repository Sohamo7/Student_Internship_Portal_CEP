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
  Layers,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const { role, user } = useAuth();

  return (
    <div className="flex flex-1 flex-col bg-slate-50/60">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Week 1 Foundation Milestone Live</span>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Connecting Passionate Students with{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              NGO Impact Projects
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
            A production-ready foundation designed for role-based student and NGO admin workflows, built with Next.js 16, Supabase, and Tailwind CSS.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <Link
                href={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
              >
                <span>Go to Your {role === 'admin' ? 'Admin' : 'Student'} Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                >
                  <span>Portal Login</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <span>Student Registration</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Role Portals Grid */}
      <section className="py-16 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Role-Based Architecture</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">Two Dedicated Workspaces</p>
            <p className="mt-2 text-sm text-slate-600">
              Strict isolation enforced by server edge middleware and Supabase Row Level Security.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Student Card */}
            <div className="relative rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xs transition-all hover:shadow-md hover:border-indigo-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">Student Workspace</h3>
              <p className="mt-2 text-sm text-slate-600">
                Public registration enabled. Students can sign up, manage their internship profile, submit applications, check project assignments, and log attendance.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
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
              <div className="mt-6 pt-6 border-t border-slate-100">
                <Link
                  href="/register"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Register as a Student <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Admin Card */}
            <div className="relative rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xs transition-all hover:shadow-md hover:border-purple-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">NGO Admin Portal</h3>
              <p className="mt-2 text-sm text-slate-600">
                Invitation-only security model. NGO administration accounts are created directly or promoted via database role assignments.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
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
              <div className="mt-6 pt-6 border-t border-slate-100">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  Log in to Admin Console <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Week Roadmap Tracker */}
      <section className="py-16 bg-white border-t border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project Plan</h2>
            <p className="mt-2 text-2xl font-bold text-slate-900">5-Week Development Roadmap</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Week 1 */}
            <div className="rounded-xl border-2 border-indigo-500 bg-indigo-50/30 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">Week 1</span>
                <span className="text-[10px] font-semibold text-emerald-600">Current</span>
              </div>
              <h4 className="mt-3 text-sm font-bold text-slate-900">Foundation</h4>
              <p className="mt-1 text-xs text-slate-600">Auth, Supabase RLS, Student/Admin Dashboards & Navigation.</p>
            </div>

            {/* Week 2 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Week 2</span>
              <h4 className="mt-3 text-sm font-bold text-slate-900">Applications</h4>
              <p className="mt-1 text-xs text-slate-600">Student detailed application form, admin review & accept/reject.</p>
            </div>

            {/* Week 3 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Week 3</span>
              <h4 className="mt-3 text-sm font-bold text-slate-900">Projects</h4>
              <p className="mt-1 text-xs text-slate-600">NGO project creation, student assignment, supervisor mapping.</p>
            </div>

            {/* Week 4 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Week 4</span>
              <h4 className="mt-3 text-sm font-bold text-slate-900">Attendance</h4>
              <p className="mt-1 text-xs text-slate-600">Daily check-in, weekly work logs, verification workflows.</p>
            </div>

            {/* Week 5 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Week 5</span>
              <h4 className="mt-3 text-sm font-bold text-slate-900">Certificates</h4>
              <p className="mt-1 text-xs text-slate-600">Completion approval, automated certificate generation & export.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
