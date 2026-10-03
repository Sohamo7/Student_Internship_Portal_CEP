'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import { Project, fetchProjectsForMember } from '@/lib/projects/project-service';
import {
  Briefcase,
  ArrowLeft,
  Mail,
  Loader2,
} from 'lucide-react';

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
            {project.track} Track
          </span>
          <h2 className="mt-3 text-xl font-bold text-slate-900">{project.title}</h2>
          <p className="mt-1 text-xs text-slate-600 max-w-2xl leading-relaxed">{project.description}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs space-y-1.5 min-w-[220px]">
          <div className="font-bold text-slate-900">Project Parameters:</div>
          <div className="text-slate-600">Duration: <span className="font-semibold text-slate-800">{project.duration_weeks} Weeks</span></div>
          <div className="text-slate-600">Target Hours: <span className="font-semibold text-slate-800">{project.target_hours} Hours</span></div>
          <div className="text-slate-600">Milestones: <span className="font-semibold text-slate-800">{project.milestones.length}</span></div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-base">
            {project.supervisor_name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assigned NGO Supervisor</span>
            <h3 className="text-sm font-bold text-slate-900">{project.supervisor_name}</h3>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
          <Mail className="h-3.5 w-3.5 text-slate-400" /> {project.supervisor_email}
        </span>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <h4 className="text-sm font-bold text-slate-900 mb-3">Project Milestones</h4>
        <div className="space-y-2">
          {project.milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold shrink-0">{i + 1}</span>
              {m}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InternProjectPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchProjectsForMember(user.email)
      .then((result) => {
        if (!cancelled) setProjects(result);
      })
      .catch((err) => console.error('Failed to load projects:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="intern" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl">
        <div>
          <Link href="/intern/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">My Assigned Project</h1>
              <p className="text-sm text-slate-600">Detailed scope, deliverables, and supervisor mentorship details.</p>
            </div>
            {projects.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 shadow-2xs">
                <Briefcase className="h-4 w-4 text-purple-600" /> Allotted & Active
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your project...
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-400">
            <Briefcase className="h-6 w-6 mx-auto mb-2 text-slate-300" />
            No project has been assigned to you yet. Check back after the NGO admin allocates you to a program.
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}
