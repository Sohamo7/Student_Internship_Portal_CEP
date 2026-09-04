'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import {
  FadeInUp,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  FloatingShapes,
  MorphBlob,
  TiltCard,
  PulseDot,
} from '@/components/motion-wrapper';
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

  const techStack = [
    { icon: <Layers className="h-5 w-5" />, label: 'Next.js 16', desc: 'App Router with RSC' },
    { icon: <Database className="h-5 w-5" />, label: 'Supabase', desc: 'Auth + PostgreSQL + RLS' },
    { icon: <Lock className="h-5 w-5" />, label: 'Edge Middleware', desc: 'Role-based route guards' },
    { icon: <Sparkles className="h-5 w-5" />, label: 'Framer Motion', desc: '3D effects & animations' },
  ];

  return (
    <div className="flex flex-1 flex-col">
      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 border-b border-slate-200/80 bg-white">
        {/* Animated Background Elements */}
        <FloatingShapes count={8} />
        <MorphBlob className="-top-20 -right-20" color="rgba(99, 102, 241, 0.06)" size={400} />
        <MorphBlob className="bottom-0 -left-24" color="rgba(139, 92, 246, 0.05)" size={350} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <FadeInUp delay={0.1}>
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs"
              whileHover={{ scale: 1.05 }}
            >
              <PulseDot color="#6366f1" size={6} />
              <span>Week 1 Foundation Milestone Live</span>
            </motion.div>
          </FadeInUp>

          {/* Heading */}
          <FadeInUp delay={0.2}>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Connecting Passionate Students with{' '}
              <motion.span
                className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent bg-[length:200%_200%]"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              >
                NGO Impact Projects
              </motion.span>
            </h1>
          </FadeInUp>

          {/* Subtitle */}
          <FadeInUp delay={0.35}>
            <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
              A production-ready foundation designed for role-based student and NGO admin workflows, built with Next.js 16, Supabase, and Tailwind CSS.
            </p>
          </FadeInUp>

          {/* CTA Buttons */}
          <FadeInUp delay={0.5}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all btn-3d"
                  >
                    <span>Go to Your {role === 'admin' ? 'Admin' : 'Student'} Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all btn-3d"
                    >
                      <span>Portal Login</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
                    >
                      <span>Student Registration</span>
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </FadeInUp>

          {/* Tech Stack Pills */}
          <FadeInUp delay={0.65}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {techStack.map((tech, i) => (
                <motion.div
                  key={tech.label}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  whileHover={{ y: -3, boxShadow: '0 8px 20px -4px rgba(0,0,0,0.06)' }}
                >
                  <div className="text-indigo-600">{tech.icon}</div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900">{tech.label}</div>
                    <div className="text-[10px] text-slate-500">{tech.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ═══════════ ROLE PORTALS ═══════════ */}
      <section className="relative py-20 bg-slate-50/60 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Role-Based Architecture</h2>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">Two Dedicated Workspaces</p>
              <p className="mt-2 text-sm text-slate-600">
                Strict isolation enforced by server edge middleware and Supabase Row Level Security.
              </p>
            </div>
          </FadeInUp>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Student Card */}
            <ScaleIn delay={0.15}>
              <TiltCard className="relative rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xs hover:shadow-lg transition-shadow overflow-hidden group">
                <motion.div
                  className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-indigo-100/50 blur-2xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <div className="relative">
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <GraduationCap className="h-6 w-6" />
                  </motion.div>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">Student Workspace</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Public registration enabled. Students can sign up, manage their internship profile, submit applications, check project assignments, and log attendance.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                    {['Self-serve registration & profile setup', 'Access to /student/dashboard only', 'Strictly blocked from NGO Admin routes'].map((item, i) => (
                      <motion.li
                        key={item}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <Link
                      href="/register"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group-hover:gap-2 transition-all"
                    >
                      Register as a Student <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </TiltCard>
            </ScaleIn>

            {/* Admin Card */}
            <ScaleIn delay={0.3}>
              <TiltCard className="relative rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xs hover:shadow-lg transition-shadow overflow-hidden group">
                <motion.div
                  className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-purple-100/50 blur-2xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
                <div className="relative">
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    whileHover={{ rotate: -10, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Shield className="h-6 w-6" />
                  </motion.div>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">NGO Admin Portal</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Invitation-only security model. NGO administration accounts are created directly or promoted via database role assignments.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                    {['No public admin self-registration', 'Full access to /admin/dashboard & management', 'Protected by Next.js Middleware and Supabase RLS'].map((item, i) => (
                      <motion.li
                        key={item}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <Link
                      href="/login"
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 group-hover:gap-2 transition-all"
                    >
                      Log in to Admin Console <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </TiltCard>
            </ScaleIn>
          </div>
        </div>
      </section>

      {/* ═══════════ 5-WEEK ROADMAP ═══════════ */}
      <section className="py-20 bg-white border-t border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp>
            <div className="text-center">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project Plan</h2>
              <p className="mt-2 text-2xl font-bold text-slate-900">5-Week Development Roadmap</p>
            </div>
          </FadeInUp>

          <StaggerContainer className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5" staggerDelay={0.1}>
            {[
              { week: 1, title: 'Foundation', desc: 'Auth, Supabase RLS, Student/Admin Dashboards & Navigation.', active: true },
              { week: 2, title: 'Applications', desc: 'Student detailed application form, admin review & accept/reject.' },
              { week: 3, title: 'Projects', desc: 'NGO project creation, student assignment, supervisor mapping.' },
              { week: 4, title: 'Attendance', desc: 'Daily check-in, weekly work logs, verification workflows.' },
              { week: 5, title: 'Certificates', desc: 'Completion approval, automated certificate generation & export.' },
            ].map((item) => (
              <StaggerItem key={item.week}>
                <motion.div
                  className={`rounded-xl p-5 shadow-2xs h-full ${
                    item.active
                      ? 'border-2 border-indigo-500 bg-indigo-50/30'
                      : 'border border-slate-200 bg-white'
                  }`}
                  whileHover={{
                    y: -4,
                    boxShadow: '0 12px 24px -8px rgba(0,0,0,0.06)',
                    borderColor: item.active ? undefined : 'rgba(99, 102, 241, 0.3)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      item.active
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      Week {item.week}
                    </span>
                    {item.active && (
                      <motion.span
                        className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <PulseDot color="#10b981" size={5} />
                        Current
                      </motion.span>
                    )}
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="mt-1 text-xs text-slate-600">{item.desc}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}
