'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Project } from '@/lib/projects/project-service';
import { downloadAttachment } from '@/lib/projects/project-attachment-service';
import {
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Users,
  FileText,
  Download,
  Mail,
  Copy,
  Check,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ClipboardList,
  CalendarCheck,
  CalendarOff,
  AlertTriangle,
  Loader2,
  GraduationCap,
  Heart,
  BookOpen,
  Laptop,
  CheckCircle,
  Layers,
} from 'lucide-react';

interface ProjectDetailViewProps {
  project: Project;
  allProjects?: Project[];
  onSelectProject?: (project: Project) => void;
  role: 'student' | 'intern';
  currentUserEmail?: string;
  currentUserId?: string;
}

export function ProjectDetailView({
  project,
  allProjects,
  onSelectProject,
  role,
  currentUserEmail,
}: ProjectDetailViewProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [completedMilestones, setCompletedMilestones] = useState<number[]>([]);

  const isStudent = role === 'student';
  const theme = isStudent
    ? {
        accent: 'indigo',
        badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        activePill: 'bg-indigo-600 text-white',
        borderFocus: 'border-indigo-300',
        progressFill: 'from-indigo-600 to-purple-600',
        primaryBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white',
        cardHighlight: 'border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30',
        trackBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      }
    : {
        accent: 'teal',
        badgeBg: 'bg-teal-50 border-teal-200 text-teal-700',
        activePill: 'bg-teal-600 text-white',
        borderFocus: 'border-teal-300',
        progressFill: 'from-teal-600 to-emerald-600',
        primaryBtn: 'bg-teal-600 hover:bg-teal-500 text-white',
        cardHighlight: 'border-teal-100 bg-gradient-to-br from-teal-50/50 via-white to-emerald-50/30',
        trackBadge: 'bg-teal-100 text-teal-800 border-teal-200',
      };

  // Load completed milestones from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = `cep_milestone_progress_${project.id}_${currentUserEmail || 'default'}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCompletedMilestones(JSON.parse(saved));
      } else {
        setCompletedMilestones([]);
      }
    } catch {
      setCompletedMilestones([]);
    }
  }, [project.id, currentUserEmail]);

  const toggleMilestone = (index: number) => {
    const updated = completedMilestones.includes(index)
      ? completedMilestones.filter((i) => i !== index)
      : [...completedMilestones, index];

    setCompletedMilestones(updated);
    if (typeof window !== 'undefined') {
      const storageKey = `cep_milestone_progress_${project.id}_${currentUserEmail || 'default'}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save milestone progress:', err);
      }
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadSuccess(false);
    try {
      await downloadAttachment(project.attachment_path, project.attachment_url, project.attachment_name);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download error:', err);
      alert('Unable to download attachment. Please try again or contact your supervisor.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyEmail = (email: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  // Calculations
  const totalMilestones = project.milestones?.length || 0;
  const completedCount = completedMilestones.filter((i) => i < totalMilestones).length;
  const milestoneProgressPct =
    totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

  const assignedCount = project.assigned?.length || 0;
  const quota = project.quota || 1;
  const cohortCapacityPct = Math.min(100, Math.round((assignedCount / quota) * 100));

  const avgWeeklyHours =
    project.duration_weeks > 0 ? Math.round(project.target_hours / project.duration_weeks) : 0;

  const startDateFormatted = project.created_at
    ? new Date(project.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const estimatedEndDate = project.created_at
    ? new Date(
        new Date(project.created_at).getTime() + (project.duration_weeks || 4) * 7 * 86400000
      ).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'In Progress';

  return (
    <div className="space-y-6">
      {/* Project Switcher if multiple projects */}
      {allProjects && allProjects.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Layers className="h-4 w-4" /> Assigned Projects ({allProjects.length}):
          </div>
          {allProjects.map((p) => {
            const isSelected = p.id === project.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProject && onSelectProject(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? theme.activePill + ' shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Hero Card */}
      <div className={`rounded-3xl border bg-white p-6 sm:p-8 shadow-xs space-y-6 ${theme.cardHighlight}`}>
        {/* Header Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold ${theme.trackBadge}`}>
                <GraduationCap className="h-3.5 w-3.5" />
                {project.track} Track
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 shadow-2xs">
                Ref ID: <span className="font-mono text-slate-800">{project.id.slice(0, 12)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active &amp; Allocated
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {project.title}
            </h1>
          </div>

          <div className="flex flex-col sm:items-end text-xs text-slate-500 shrink-0">
            <span className="font-medium">Allotted on</span>
            <span className="font-bold text-slate-800 text-sm">{startDateFormatted}</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Est. target completion: {estimatedEndDate}</span>
          </div>
        </div>

        {/* Project Scope Description */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-slate-500" />
            Project Scope &amp; Briefing
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {project.description || 'No detailed project description specified.'}
          </p>
        </div>

        {/* 4 Core Parameter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2 text-indigo-600 mb-1.5">
              <Calendar className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</span>
            </div>
            <div className="text-xl font-black text-slate-900">{project.duration_weeks} Weeks</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Estimated program span</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2 text-purple-600 mb-1.5">
              <Clock className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Commitment</span>
            </div>
            <div className="text-xl font-black text-slate-900">{project.target_hours} Hours</div>
            <div className="text-[11px] text-slate-500 mt-0.5">~{avgWeeklyHours} hrs/week target</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2 text-emerald-600 mb-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Milestones</span>
            </div>
            <div className="text-xl font-black text-slate-900">
              {completedCount} / {totalMilestones}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{milestoneProgressPct}% deliverables ready</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2 text-blue-600 mb-1.5">
              <Users className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cohort Size</span>
            </div>
            <div className="text-xl font-black text-slate-900">
              {assignedCount} / {quota}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {quota - assignedCount > 0 ? `${quota - assignedCount} slots open` : 'Cohort capacity reached'}
            </div>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        {totalMilestones > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Deliverables Completion Progress
              </span>
              <span className="font-black text-slate-900">
                {completedCount} of {totalMilestones} Completed ({milestoneProgressPct}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${theme.progressFill} transition-all duration-500 ease-out`}
                style={{ width: `${milestoneProgressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Two Column Section: Milestones & Supervisor/Attachment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Deliverables & Milestones (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Milestones Checklist */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Project Milestones &amp; Roadmap</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click to mark deliverables as you progress through each phase of the project.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {totalMilestones} Phases
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {project.milestones && project.milestones.length > 0 ? (
                project.milestones.map((milestone, idx) => {
                  const isDone = completedMilestones.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleMilestone(idx)}
                      className={`group flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                        isDone
                          ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={isDone ? 'Mark milestone incomplete' : 'Mark milestone complete'}
                        className="mt-0.5 shrink-0 focus:outline-hidden"
                      >
                        {isDone ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600 transition-transform group-hover:scale-110" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                              isDone ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Deliverable Phase {idx + 1}
                          </span>
                          {isDone ? (
                            <span className="ml-auto rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              Completed
                            </span>
                          ) : (
                            <span className="ml-auto rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              In Progress
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm font-medium leading-relaxed ${
                            isDone ? 'text-emerald-950 line-through opacity-85' : 'text-slate-800'
                          }`}
                        >
                          {milestone}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  No specific milestone deliverables registered yet for this project.
                </div>
              )}
            </div>
          </div>

          {/* Program Guidelines & Evaluation Criteria */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Program Guidelines &amp; Evaluation Criteria
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <CalendarCheck className="h-4 w-4 text-indigo-600" />
                  Attendance Benchmark
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Maintain a minimum of 80% geo-verified attendance during all scheduled work days.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <ClipboardList className="h-4 w-4 text-purple-600" />
                  Weekly Work Logs
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Record daily tasks and submit weekly summaries by Sunday for supervisor approval.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Users className="h-4 w-4 text-blue-600" />
                  Supervisor Check-Ins
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Coordinate with your assigned mentor for periodic reviews and milestone sign-offs.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Award className="h-4 w-4 text-amber-600" />
                  Certificate Issuance
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Official CEP certificate generated upon fulfilling hours and passing supervisor review.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Supervisor, Attachment & Cohort Peers (1 col) */}
        <div className="space-y-6">
          {/* Supervisor Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Assigned NGO Supervisor
            </h2>

            <div className="flex items-center gap-3.5">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-lg shadow-sm">
                {(project.supervisor_name || 'Supervisor')
                  .split(' ')
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-900 truncate">
                  {project.supervisor_name || 'Lead Mentor'}
                </h3>
                <p className="text-xs font-medium text-slate-500">Project Lead &amp; Mentor</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="font-mono text-slate-700 truncate min-w-0">
                  {project.supervisor_email}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyEmail(project.supervisor_email)}
                  title="Copy email address"
                  className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <a
                href={`mailto:${project.supervisor_email}?subject=CEP%20Project%20Query%20-%20${encodeURIComponent(project.title)}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Mail className="h-4 w-4 text-indigo-600" />
                <span>Send Email to Supervisor</span>
              </a>
            </div>
          </div>

          {/* Attachment Document Section */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Project Brief &amp; Documents
            </h2>

            {project.attachment_name ? (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Official Dossier</div>
                    <div className="text-sm font-bold text-slate-900 break-words line-clamp-2">
                      {project.attachment_name}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-all cursor-pointer disabled:opacity-60"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Downloading Brief...</span>
                    </>
                  ) : downloadSuccess ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-300" />
                      <span>Download Started</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download Project Brief</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500 bg-slate-50/50">
                <FileText className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                No additional document attached. All guidelines and expectations are documented in the project briefing.
              </div>
            )}
          </div>

          {/* Assigned Cohort Peers */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cohort Peers ({assignedCount})
              </h2>
              <span className="text-[11px] font-semibold text-slate-500">
                {cohortCapacityPct}% capacity
              </span>
            </div>

            {/* Capacity fill indicator */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-400 rounded-full transition-all"
                style={{ width: `${cohortCapacityPct}%` }}
              />
            </div>

            <div className="space-y-2.5 pt-1">
              {project.assigned && project.assigned.length > 0 ? (
                project.assigned.map((member) => {
                  const isCurrent =
                    currentUserEmail &&
                    member.email &&
                    member.email.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
                  return (
                    <div
                      key={member.id || member.email}
                      className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border text-xs ${
                        isCurrent
                          ? 'border-indigo-200 bg-indigo-50/60 font-semibold'
                          : 'border-slate-200/80 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 font-bold text-slate-700 text-[10px]">
                          {(member.name || 'Member')
                            .split(' ')
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            {member.name}
                            {isCurrent && (
                              <span className="rounded bg-indigo-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                                You
                              </span>
                            )}
                          </div>
                          <div className="truncate text-[11px] text-slate-400">{member.email}</div>
                        </div>
                      </div>

                      <a
                        href={`mailto:${member.email}`}
                        title={`Send email to ${member.name}`}
                        className="shrink-0 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 text-center py-2">
                  No cohort peers assigned yet.
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Navigation Hub */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Direct Shortcuts
            </h2>

            <div className="space-y-2">
              <Link
                href={`/${role}/attendance`}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className="h-4 w-4 text-emerald-600" />
                  <span>Geo-Attendance Check-In</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <Link
                href={`/${role}/work-log`}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="h-4 w-4 text-purple-600" />
                  <span>Submit Today&apos;s Work Log</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              {role === 'intern' ? (
                <>
                  <Link
                    href="/intern/leave"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <CalendarOff className="h-4 w-4 text-amber-600" />
                      <span>Request Leave of Absence</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href="/intern/report"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                      <span>Report an Issue or Query</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                </>
              ) : (
                <Link
                  href="/student/application"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-amber-600" />
                    <span>View Application Submission</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
