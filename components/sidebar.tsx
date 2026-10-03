'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  GraduationCap,
  CalendarOff,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

interface SubNavItem {
  label: string;
  href: string;
  tag?: 'student' | 'intern';
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubNavItem[];
}

interface SidebarProps {
  role: 'student' | 'admin' | 'intern';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  // State to track which accordion items are open in the sidebar
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      Applications: pathname?.startsWith('/admin/applications') ?? false,
      Students: pathname?.startsWith('/admin/students') ?? false,
      Attendance: pathname?.startsWith('/admin/attendance') ?? false,
      'Work Logs': pathname?.startsWith('/admin/work-logs') ?? false,
    };
    return initial;
  });

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const studentNav: NavItem[] = [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Application', href: '/student/application', icon: FileText },
    { label: 'Project', href: '/student/project', icon: Briefcase },
    { label: 'Attendance', href: '/student/attendance', icon: CalendarCheck },
    { label: 'Work Log', href: '/student/work-log', icon: ClipboardList },
    { label: 'Profile', href: '/student/profile', icon: User },
  ];

  const internNav: NavItem[] = [
    { label: 'Dashboard', href: '/intern/dashboard', icon: LayoutDashboard },
    { label: 'Application', href: '/intern/application', icon: FileText },
    { label: 'Project', href: '/intern/project', icon: Briefcase },
    { label: 'Attendance', href: '/intern/attendance', icon: CalendarCheck },
    { label: 'Leave', href: '/intern/leave', icon: CalendarOff },
    { label: 'Report Issue', href: '/intern/report', icon: AlertTriangle },
    { label: 'Work Log', href: '/intern/work-log', icon: ClipboardList },
    { label: 'Profile', href: '/intern/profile', icon: User },
  ];

  const adminNav: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    {
      label: 'Applications',
      icon: FileText,
      subItems: [
        { label: 'Student Applications', href: '/admin/applications?role=student', tag: 'student', icon: GraduationCap },
        { label: 'Intern Applications', href: '/admin/applications?role=intern', tag: 'intern', icon: Users },
      ],
    },
    { label: 'Leave Requests', href: '/admin/leave', icon: CalendarOff },
    { label: 'Issue Reports', href: '/admin/issues', icon: AlertTriangle },
    {
      label: 'Students',
      icon: Users,
      subItems: [
        { label: 'Student Directory', href: '/admin/students?role=student', tag: 'student', icon: GraduationCap },
        { label: 'Intern Directory', href: '/admin/students?role=intern', tag: 'intern', icon: Users },
      ],
    },
    { label: 'Projects', href: '/admin/projects', icon: Briefcase },
    {
      label: 'Attendance',
      icon: CalendarCheck,
      subItems: [
        { label: 'Student Attendance', href: '/admin/attendance?role=student', tag: 'student', icon: GraduationCap },
        { label: 'Intern Attendance', href: '/admin/attendance?role=intern', tag: 'intern', icon: Users },
      ],
    },
    {
      label: 'Work Logs',
      icon: ClipboardList,
      subItems: [
        { label: 'Student Work Logs', href: '/admin/work-logs?role=student', tag: 'student', icon: GraduationCap },
        { label: 'Intern Work Logs', href: '/admin/work-logs?role=intern', tag: 'intern', icon: Users },
      ],
    },
    { label: 'Admin Team', href: '/admin/admins', icon: ShieldCheck },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const items = role === 'admin' ? adminNav : role === 'intern' ? internNav : studentNav;

  return (
    <motion.aside
      className="flex flex-col w-full md:w-64 border-r border-slate-200/90 bg-white p-4 shrink-0"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Role Profile Header */}
      <motion.div
        className="mb-5 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 shadow-2xs"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold shadow-sm ${
              role === 'admin'
                ? 'bg-purple-600 shadow-purple-500/20'
                : role === 'intern'
                ? 'bg-teal-600 shadow-teal-500/20'
                : 'bg-indigo-600 shadow-indigo-500/20'
            }`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {role === 'admin' ? (
              <ShieldCheck className="h-5 w-5" />
            ) : role === 'intern' ? (
              <Briefcase className="h-5 w-5" />
            ) : (
              <GraduationCap className="h-5 w-5" />
            )}
          </motion.div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-semibold text-slate-900">
              {profile?.name || (role === 'admin' ? 'NGO Admin' : role === 'intern' ? 'Intern' : 'Student')}
            </span>
            <span className="text-xs text-slate-500 capitalize">
              {role === 'admin' ? 'Portal Administrator' : role === 'intern' ? 'Active Intern' : 'Internship Candidate'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-0.5">
        {items.map((item, index) => {
          const Icon = item.icon;
          const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
          const isOpen = Boolean(openMenus[item.label]);

          // Check if parent or any sub-item is active
          const isDirectActive = Boolean(item.href && pathname === item.href.split('?')[0]);
          const isSubActive = Boolean(
            hasSubItems &&
              item.subItems?.some((sub) => pathname === sub.href.split('?')[0])
          );
          const isItemActive = isDirectActive || isSubActive;

          return (
            <motion.div
              key={item.label}
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.05 + index * 0.02, duration: 0.25, ease: 'easeOut' }}
            >
              {hasSubItems ? (
                <div>
                  {/* Button that slides down the options */}
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                      isItemActive
                        ? 'bg-purple-50 text-purple-900 font-semibold border border-purple-200/60'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${isItemActive ? 'text-purple-600' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </motion.div>
                  </button>

                  {/* Slide down submenu */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key={`sub-${item.label}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden pl-4 pr-1 pt-1 pb-1 space-y-1 border-l-2 border-slate-200 ml-4 my-1"
                      >
                        {item.subItems?.map((sub) => {
                          const SubIcon = sub.icon || Icon;
                          return (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                                sub.tag === 'student'
                                  ? 'text-indigo-700 hover:bg-indigo-50/80 font-medium'
                                  : 'text-teal-700 hover:bg-teal-50/80 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                                <span className="truncate">{sub.label}</span>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                                  sub.tag === 'student'
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'bg-teal-50 border-teal-200 text-teal-700'
                                }`}
                              >
                                {sub.tag === 'student' ? 'Student' : 'Intern'}
                              </span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href={item.href || '#'}
                  className={`relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                    isDirectActive
                      ? 'bg-purple-600 text-white shadow-xs font-semibold shadow-purple-600/15'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {isDirectActive && (
                    <motion.div
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-l-full bg-white/60"
                      layoutId="sidebar-active-indicator"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}
                </Link>
              )}
            </motion.div>
          );
        })}
      </nav>

      {/* Logout button in sidebar */}
      <motion.div
        className="pt-3 border-t border-slate-200 mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
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
