'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  PulseDot,
  AnimatedCounter,
} from '@/components/motion-wrapper';
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
  const { user, role } = useAuth();

  useEffect(() => {
    if (!user) router.push('/login');
    else if (role === 'student') router.push('/student/dashboard');
  }, [user, role, router]);

  if (!user || role === 'student') return null;

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar role="admin" />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 gradient-bg-animated">
        {/* Admin Header */}
        <FadeInUp>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                NGO Admin Console
              </h1>
              <PulseDot color="#8b5cf6" size={8} />
            </div>
            <p className="text-sm text-slate-600">
              Full management access. Review applications, manage students, projects, and attendance.
            </p>
          </div>
        </FadeInUp>

        {/* Stat Summary */}
        <StaggerContainer className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.1}>
          <StaggerItem>
            <Link href="/admin/students" className="block">
              <StatCard
                title="Total Students"
                value={18}
                subtitle="Click to open student directory"
                badge="Active"
                badgeColor="blue"
                icon={<Users className="h-5 w-5 text-blue-600" />}
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/admin/applications" className="block">
              <StatCard
                title="Pending Reviews"
                value={6}
                subtitle="Click to review applications"
                badge="Action Required"
                badgeColor="amber"
                icon={<FileText className="h-5 w-5 text-amber-600" />}
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/admin/projects" className="block">
              <StatCard
                title="Active Projects"
                value={4}
                subtitle="Click to manage projects"
                badge="Running"
                badgeColor="purple"
                icon={<Briefcase className="h-5 w-5 text-purple-600" />}
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/admin/attendance" className="block">
              <StatCard
                title="Avg Attendance"
                value="94.2%"
                subtitle="Click to verify attendance logs"
                badge="This Month"
                badgeColor="emerald"
                icon={<CalendarCheck className="h-5 w-5 text-emerald-600" />}
              />
            </Link>
          </StaggerItem>
        </StaggerContainer>

        {/* Admin Management Modules */}
        <FadeInUp delay={0.3}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Management Center</h2>
            <motion.span
              className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1.5"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <PulseDot color="#8b5cf6" size={5} />
              Admin Access
            </motion.span>
          </div>
        </FadeInUp>

        <StaggerContainer className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.08}>
          {/* 1. Applications */}
          <StaggerItem>
            <Link
              href="/admin/applications"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-amber-400 hover:shadow-md block card-3d"
            >
              <div className="flex items-center justify-between">
                <motion.div
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <FileText className="h-5 w-5" />
                </motion.div>
                <motion.span
                  className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  6 Pending
                </motion.span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Review Applications</h3>
              <p className="mt-1 text-xs text-slate-600">
                Evaluate student submissions and approve or decline applicants with 1-click actions.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                Open Review <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </StaggerItem>

          {/* 2. Students */}
          <StaggerItem>
            <Link
              href="/admin/students"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-blue-400 hover:shadow-md block card-3d"
            >
              <div className="flex items-center justify-between">
                <motion.div
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                  whileHover={{ rotate: -10, scale: 1.1 }}
                >
                  <Users className="h-5 w-5" />
                </motion.div>
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
          </StaggerItem>

          {/* 3. Projects */}
          <StaggerItem>
            <Link
              href="/admin/projects"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-purple-400 hover:shadow-md block card-3d"
            >
              <div className="flex items-center justify-between">
                <motion.div
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <Briefcase className="h-5 w-5" />
                </motion.div>
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
          </StaggerItem>

          {/* 4. Attendance */}
          <StaggerItem>
            <Link
              href="/admin/attendance"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-emerald-400 hover:shadow-md block card-3d"
            >
              <div className="flex items-center justify-between">
                <motion.div
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"
                  whileHover={{ rotate: -10, scale: 1.1 }}
                >
                  <CalendarCheck className="h-5 w-5" />
                </motion.div>
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
          </StaggerItem>

          {/* 5. Work Logs */}
          <StaggerItem>
            <Link
              href="/admin/work-logs"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-indigo-400 hover:shadow-md block card-3d"
            >
              <div className="flex items-center justify-between">
                <motion.div
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <ClipboardList className="h-5 w-5" />
                </motion.div>
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
          </StaggerItem>

          {/* 6. Settings */}
          <StaggerItem>
            <Link
              href="/admin/settings"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-slate-400 hover:shadow-md block card-3d"
            >
              <div className="flex items-center justify-between">
                <motion.div
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-700 group-hover:text-white transition-colors"
                  whileHover={{ rotate: -10, scale: 1.1 }}
                >
                  <ShieldCheck className="h-5 w-5" />
                </motion.div>
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
          </StaggerItem>
        </StaggerContainer>
      </main>
    </div>
  );
}
