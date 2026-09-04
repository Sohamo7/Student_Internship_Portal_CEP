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
} from '@/components/motion-wrapper';
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
  const { user, role } = useAuth();

  useEffect(() => {
    if (!user) router.push('/login');
    else if (role === 'admin') router.push('/admin/dashboard');
  }, [user, role, router]);

  if (!user || role === 'admin') return null;

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar role="student" />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 gradient-bg-animated">
        {/* Welcome Header */}
        <FadeInUp>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Student Dashboard
              </h1>
              <PulseDot color="#10b981" size={8} />
            </div>
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>All modules are live and connected. Click any card to navigate.</span>
            </p>
          </div>
        </FadeInUp>

        {/* Quick Stats Grid */}
        <StaggerContainer className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.1}>
          <StaggerItem>
            <Link href="/student/application" className="block">
              <StatCard
                title="Application"
                value="Submitted"
                subtitle="Click to view submission details"
                badge="Under Review"
                badgeColor="amber"
                icon={<FileText className="h-5 w-5 text-amber-600" />}
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/student/project" className="block">
              <StatCard
                title="Assigned Project"
                value="Digital Literacy"
                subtitle="Click to view deliverables"
                badge="Assigned"
                badgeColor="purple"
                icon={<Briefcase className="h-5 w-5 text-purple-600" />}
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/student/attendance" className="block">
              <StatCard
                title="Attendance"
                value="23 / 24 Days"
                subtitle="Click for daily check-in"
                badge="95.8%"
                badgeColor="emerald"
                icon={<CalendarCheck className="h-5 w-5 text-emerald-600" />}
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/student/work-log" className="block">
              <StatCard
                title="Work Log"
                value="3 Logged"
                subtitle="Click to submit weekly report"
                badge="Active"
                badgeColor="blue"
                icon={<ClipboardList className="h-5 w-5 text-blue-600" />}
              />
            </Link>
          </StaggerItem>
        </StaggerContainer>

        {/* Connected Modules Grid */}
        <FadeInUp delay={0.3}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Connected Modules
            </h2>
            <motion.span
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1.5"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <PulseDot color="#10b981" size={5} />
              All Sections Connected
            </motion.span>
          </div>
        </FadeInUp>

        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.08}>
          {/* Module 1: Application */}
          <StaggerItem>
            <Link
              href="/student/application"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-indigo-400 hover:shadow-md block card-3d"
            >
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                whileHover={{ rotate: 10, scale: 1.1 }}
              >
                <FileText className="h-5 w-5" />
              </motion.div>
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
          </StaggerItem>

          {/* Module 2: My Project */}
          <StaggerItem>
            <Link
              href="/student/project"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-purple-400 hover:shadow-md block card-3d"
            >
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors"
                whileHover={{ rotate: -10, scale: 1.1 }}
              >
                <Briefcase className="h-5 w-5" />
              </motion.div>
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
          </StaggerItem>

          {/* Module 3: Attendance */}
          <StaggerItem>
            <Link
              href="/student/attendance"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-emerald-400 hover:shadow-md block card-3d"
            >
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"
                whileHover={{ rotate: 10, scale: 1.1 }}
              >
                <CalendarCheck className="h-5 w-5" />
              </motion.div>
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
          </StaggerItem>

          {/* Module 4: Work Log */}
          <StaggerItem>
            <Link
              href="/student/work-log"
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-blue-400 hover:shadow-md block card-3d"
            >
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                whileHover={{ rotate: -10, scale: 1.1 }}
              >
                <ClipboardList className="h-5 w-5" />
              </motion.div>
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
          </StaggerItem>
        </StaggerContainer>

        {/* Milestone Banner */}
        <FadeInUp delay={0.5}>
          <motion.div
            className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs overflow-hidden relative"
            whileHover={{ borderColor: 'rgba(99, 102, 241, 0.4)' }}
          >
            <motion.div
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-indigo-50 blur-2xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <div className="flex items-start gap-4 relative">
              <motion.div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="h-5 w-5" />
              </motion.div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Connected Dashboards Active
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  All sections (Application, Project, Attendance, Work Logs, Profile) are now live and connected. You can also click <strong>&quot;Switch to Admin Console&quot;</strong> in the top bar to inspect the NGO administrative review center.
                </p>
              </div>
            </div>
          </motion.div>
        </FadeInUp>
      </main>
    </div>
  );
}
