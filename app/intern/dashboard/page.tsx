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
} from 'lucide-react';

export default function InternDashboardPage() {
  const router = useRouter();
  const { user, role } = useAuth();

  useEffect(() => {
    if (!user) router.push('/login');
    else if (role === 'admin') router.push('/admin/dashboard');
  }, [user, role, router]);

  if (!user || role === 'admin') return null;

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar role="intern" />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 gradient-bg-animated">
        {/* Welcome Header */}
        <FadeInUp>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Intern Dashboard
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
            <Link href="/intern/application" className="block">
              <StatCard
                title="Application"
                value="Approved"
                subtitle="Click to view submission details"
                badge="Active Intern"
                badgeColor="emerald"
                icon={<FileText className="h-5 w-5 text-emerald-600" />}
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/intern/project" className="block">
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
            <Link href="/intern/attendance" className="block">
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
            <Link href="/intern/work-log" className="block">
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
      </main>
    </div>
  );
}
