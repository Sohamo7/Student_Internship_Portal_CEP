'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import { Project, fetchProjectsForMember } from '@/lib/projects/project-service';
import { ProjectDetailView } from '@/components/project-detail-view';
import {
  Briefcase,
  ArrowLeft,
  Loader2,
  CalendarCheck,
  FileText,
  Sparkles,
} from 'lucide-react';

export default function StudentProjectPage() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const targetEmail = profile?.email || user?.email;
    const targetId = profile?.id || user?.id;
    if (!targetEmail) return;

    let cancelled = false;
    fetchProjectsForMember(targetEmail, targetId)
      .then((result) => {
        if (!cancelled) {
          setProjects(result);
          if (result.length > 0) {
            setSelectedProject(result[0]);
          }
        }
      })
      .catch((err) => console.error('Failed to load student projects:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, profile]);

  const activeProject = selectedProject || (projects.length > 0 ? projects[0] : null);

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/70 min-h-screen">
      <Sidebar role="student" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
        {/* Top Header */}
        <div className="space-y-1">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Student Dashboard
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-1">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                My Assigned Project
              </h1>
              <p className="text-sm text-slate-600">
                Complete project specifications, deliverables roadmap, supervisor mentorship, and cohort details.
              </p>
            </div>
            {projects.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-bold text-purple-700 shadow-2xs self-start sm:self-auto">
                <Briefcase className="h-4 w-4 text-purple-600" />
                <span>{projects.length === 1 ? '1 Project Allotted' : `${projects.length} Projects Allotted`}</span>
              </span>
            )}
          </div>
        </div>

        {/* Content area */}
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-xs">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <h2 className="text-sm font-bold text-slate-800">Loading your project details...</h2>
            <p className="text-xs text-slate-500 mt-1">Retrieving scope, deliverables, and supervisor mentorship data.</p>
          </div>
        ) : projects.length === 0 || !activeProject ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs space-y-4 max-w-2xl mx-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mx-auto">
              <Briefcase className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">No Project Assigned Yet</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your volunteer application is active. The NGO administrator is currently allocating candidates to community initiatives based on your profile and track preferences.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/student/application"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <FileText className="h-4 w-4 text-amber-600" />
                <span>Review Application</span>
              </Link>
              <Link
                href="/student/attendance"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-xs"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>Go to Attendance</span>
              </Link>
            </div>
          </div>
        ) : (
          <ProjectDetailView
            project={activeProject}
            allProjects={projects}
            onSelectProject={(p) => setSelectedProject(p)}
            role="student"
            currentUserEmail={profile?.email || user?.email}
            currentUserId={profile?.id || user?.id}
          />
        )}
      </main>
    </div>
  );
}
