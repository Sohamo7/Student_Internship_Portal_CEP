'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { useTheme } from '@/lib/theme/theme-context';
import { PageLoader } from '@/components/loading';
import { GraduationCap, Shield, LogOut, HeartHandshake, Briefcase, Sun, Moon } from 'lucide-react';

export function Navbar() {
  const { user, profile, role, logout, isLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Show full-screen loader while session is being restored
  if (isLoading) {
    return <PageLoader message="Restoring session…" />;
  }

  return (
    <motion.header
      className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xs"
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
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                NGO Internship Portal
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase text-indigo-600 dark:text-indigo-400">
                Connected Dashboards
              </span>
            </div>
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <motion.button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92, rotate: 15 }}
            aria-label="Toggle dark mode"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <motion.div
              key={isDark ? 'sun' : 'moon'}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </motion.div>
          </motion.button>

          {user && profile ? (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {/* User badge */}
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5">
                {role === 'admin' ? (
                  <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                ) : role === 'intern' ? (
                  <Briefcase className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                ) : (
                  <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {profile.name}
                  </span>
                  <span className="text-[10px] font-medium capitalize text-slate-500 dark:text-slate-400">
                    {role === 'admin' ? 'NGO Administrator' : role === 'intern' ? 'Active Intern' : 'Student'}
                  </span>
                </div>
              </div>

              {/* Logout button */}
              <motion.button
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer"
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
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
