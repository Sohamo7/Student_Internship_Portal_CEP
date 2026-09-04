'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  CalendarCheck,
  ClipboardList,
  User,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  role: 'student' | 'admin';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  const studentNav = [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Application', href: '/student/application', icon: FileText },
    { label: 'Project', href: '/student/project', icon: Briefcase },
    { label: 'Attendance', href: '/student/attendance', icon: CalendarCheck },
    { label: 'Work Log', href: '/student/work-log', icon: ClipboardList },
    { label: 'Profile', href: '/student/profile', icon: User },
  ];

  const adminNav = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Applications', href: '/admin/applications', icon: FileText },
    { label: 'Students', href: '/admin/students', icon: Users },
    { label: 'Projects', href: '/admin/projects', icon: Briefcase },
    { label: 'Attendance', href: '/admin/attendance', icon: CalendarCheck },
    { label: 'Work Logs', href: '/admin/work-logs', icon: ClipboardList },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const items = role === 'admin' ? adminNav : studentNav;

  return (
    <motion.aside
      className="flex flex-col w-full md:w-64 border-r border-slate-200/90 bg-white p-4 shrink-0"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Role Profile Header */}
      <motion.div
        className="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 shadow-2xs"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold shadow-sm ${
              role === 'admin' ? 'bg-purple-600 shadow-purple-500/20' : 'bg-indigo-600 shadow-indigo-500/20'
            }`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {role === 'admin' ? <ShieldCheck className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
          </motion.div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-semibold text-slate-900">
              {profile?.name || (role === 'admin' ? 'NGO Admin' : 'Student')}
            </span>
            <span className="text-xs text-slate-500 capitalize">
              {role === 'admin' ? 'Portal Administrator' : 'Internship Candidate'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <motion.div
              key={item.label}
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.3, ease: 'easeOut' }}
            >
              <Link
                href={item.href}
                className={`relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold shadow-indigo-600/15'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-l-full bg-white/40"
                    layoutId="sidebar-active-indicator"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Logout button in sidebar */}
      <motion.div
        className="pt-4 border-t border-slate-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out</span>
        </motion.button>
      </motion.div>
    </motion.aside>
  );
}
