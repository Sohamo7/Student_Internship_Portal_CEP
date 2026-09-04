'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, ready: true },
    { label: 'Application', href: '#', icon: FileText, ready: false, badge: 'Week 2' },
    { label: 'Project', href: '#', icon: Briefcase, ready: false, badge: 'Week 3' },
    { label: 'Attendance', href: '#', icon: CalendarCheck, ready: false, badge: 'Week 4' },
    { label: 'Work Log', href: '#', icon: ClipboardList, ready: false, badge: 'Week 4' },
    { label: 'Profile', href: '#', icon: User, ready: false, badge: 'Soon' },
  ];

  const adminNav = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, ready: true },
    { label: 'Applications', href: '#', icon: FileText, ready: false, badge: 'Week 2' },
    { label: 'Students', href: '#', icon: Users, ready: false, badge: 'Week 2' },
    { label: 'Projects', href: '#', icon: Briefcase, ready: false, badge: 'Week 3' },
    { label: 'Attendance', href: '#', icon: CalendarCheck, ready: false, badge: 'Week 4' },
    { label: 'Work Logs', href: '#', icon: ClipboardList, ready: false, badge: 'Week 4' },
    { label: 'Settings', href: '#', icon: Settings, ready: false, badge: 'Soon' },
  ];

  const items = role === 'admin' ? adminNav : studentNav;

  return (
    <aside className="flex flex-col w-full md:w-64 border-r border-slate-200/90 bg-white p-4">
      {/* Role Profile Header */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold shadow-sm ${
            role === 'admin' ? 'bg-purple-600 shadow-purple-500/20' : 'bg-indigo-600 shadow-indigo-500/20'
          }`}>
            {role === 'admin' ? <ShieldCheck className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-semibold text-slate-900">
              {profile?.name || (role === 'admin' ? 'NGO Admin' : 'Student')}
            </span>
            <span className="text-xs text-slate-500 capitalize">
              {role === 'admin' ? 'Portal Administrator' : 'Internship Candidate'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (!item.ready) {
            return (
              <div
                key={item.label}
                className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed transition-colors"
                title={`${item.label} (${item.badge})`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout button in sidebar */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
