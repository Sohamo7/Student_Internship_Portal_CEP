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
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  FileText,
  Download,
  ExternalLink,
} from 'lucide-react';
import { downloadAttachment } from '@/lib/projects/project-attachment-service';

function ProjectCard({ project }: { project: Project }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadAttachment(project.attachment_path, project.attachment_url, project.attachment_name);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs space-y-6">
      {/* Track & Title */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-md bg-teal-50 border border-teal-200 px-2.5 py-1 text-[11px] font-bold text-teal-700">
            {project.track} Track
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            Created on {new Date(project.created_at).toLocaleDateString()}
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{project.title}</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{project.description}</p>
      </div>

      {/* Project Parameters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-2 text-teal-600 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</span>
          </div>
          <div className="text-base font-bold text-slate-900">{project.duration_weeks} Weeks</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Commitment</span>
          </div>
          <div className="text-base font-bold text-slate-900">{project.target_hours} Hours</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Milestones</span>
          </div>
          <div className="text-base font-bold text-slate-900">{project.milestones.length} Deliverables</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cohort Size</span>
          </div>
          <div className="text-base font-bold text-slate-900">{project.assigned?.length || 0} / {project.quota} Interns</div>
        </div>
      </div>

      {/* Attachment Document Section */}
      {project.attachment_name && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Project Brief &amp; Attachment</div>
                <div className="truncate text-sm font-bold text-slate-900">{project.attachment_name}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-500 transition-colors cursor-pointer disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Attachment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Supervisor Details */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold text-base">
            {project.supervisor_name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assigned NGO Supervisor</span>
            <h3 className="text-sm font-bold text-slate-900">{project.supervisor_name}</h3>
          </div>
        </div>
        <a
          href={`mailto:${project.supervisor_email}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Mail className="h-3.5 w-3.5 text-slate-500" />
          <span>{project.supervisor_email}</span>
        </a>
      </div>

      {/* Milestones & Deliverables */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-sm font-bold text-slate-900 mb-3">Project Milestones &amp; Deliverables</h4>
        <div className="space-y-2">
          {project.milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold shrink-0">{i + 1}</span>
              <span>{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cohort Peers */}
      {project.assigned && project.assigned.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Assigned Cohort Members ({project.assigned.length})</h4>
          <div className="flex flex-wrap gap-2">
            {project.assigned.map((m) => (
              <span key={m.email} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-medium">
                <Users className="h-3 w-3 text-slate-400" />
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}
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
