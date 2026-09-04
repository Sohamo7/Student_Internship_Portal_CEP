'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { GraduationCap, Shield, LogOut, HeartHandshake, ArrowLeftRight } from 'lucide-react';

export function Navbar() {
  const { user, profile, role, isConfigured, logout, switchRole } = useAuth();

  return (
    <motion.header
      className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/80 backdrop-blur-xl shadow-2xs"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20"
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <HeartHandshake className="h-5 w-5" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                NGO Internship Portal
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase text-indigo-600">
                Connected Dashboards
              </span>
            </div>
          </Link>

          {/* Environment status indicator */}
          <div className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            <motion.span
              className={`h-2 w-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}
              animate={isConfigured ? {} : { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {isConfigured ? 'Supabase Connected' : 'Demo / Local Mode'}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {user && profile ? (
            <motion.div
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {/* Universal Switcher between Student & Admin Dashboards */}
              <motion.button
                onClick={() => switchRole(role === 'admin' ? 'student' : 'admin')}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
                title="Click to jump to the other connected dashboard"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>Switch to {role === 'admin' ? 'Student Dashboard' : 'Admin Console'}</span>
              </motion.button>

              {/* User badge */}
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                {role === 'admin' ? (
                  <Shield className="h-4 w-4 text-purple-600" />
                ) : (
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800">
                    {profile.name}
                  </span>
                  <span className="text-[10px] font-medium capitalize text-slate-500">
                    {role === 'admin' ? 'NGO Administrator' : 'Student'}
                  </span>
                </div>
              </div>

              {/* Active Dashboard Link */}
              <Link
                href={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                className="inline-flex items-center rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-200 transition-colors"
              >
                Home
              </Link>

              {/* Logout button */}
              <motion.button
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Logout</span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Log In
              </Link>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/register"
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 transition-colors btn-3d"
                >
                  Student Registration
                </Link>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
