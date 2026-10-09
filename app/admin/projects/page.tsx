'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import {
  Project,
  fetchProjects,
  createProject,
  assignMember,
  unassignMember,
} from '@/lib/projects/project-service';
import { notifyProjectAssigned } from '@/lib/email/client';
import { fetchApplications, selectApprovedMembers } from '@/lib/applications/application-service';
import { useOrgSettings } from '@/lib/settings/use-org-settings';
import {
  Briefcase,
  Plus,
  ArrowLeft,
  X,
  UserPlus,
  Trash2,
} from 'lucide-react';

const TRACKS = ['Education', 'Healthcare', 'Environment', 'Vocational', 'Community Outreach'];

function NewProjectForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [track, setTrack] = useState(TRACKS[0]);
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [quota, setQuota] = useState(4);
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [targetHours, setTargetHours] = useState(120);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useOrgSettings();
  const savedSupervisors = settings.supervisors.filter((s) => s.name.trim() && s.email.trim());

  const pickSupervisor = (id: string) => {
    const found = savedSupervisors.find((s) => s.id === id);
    if (!found) return;
    setSupervisorName(found.name);
    setSupervisorEmail(found.email);
    const matchingTrack = TRACKS.find((t) => t.toLowerCase() === found.track.toLowerCase());
    if (matchingTrack) setTrack(matchingTrack);
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !supervisorName.trim() || !supervisorEmail.trim()) {
      setError('Please fill in the project title and supervisor details.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createProject({
        title: title.trim(),
        description: description.trim() || 'No description provided yet.',
        track,
        supervisor_name: supervisorName.trim(),
        supervisor_email: supervisorEmail.trim(),
        quota,
        duration_weeks: durationWeeks,
        target_hours: targetHours,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create the project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-purple-200 bg-purple-50/40 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">New Project Program</h3>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && <p className="text-xs font-medium text-rose-700">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Winter Blanket Drive Coordination" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Track</label>
          <select value={track} onChange={(e) => setTrack(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white">
            {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What will assigned volunteers work on?" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
      </div>

      {savedSupervisors.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Saved supervisor (from Settings)</label>
          <select
            defaultValue=""
            onChange={(e) => pickSupervisor(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
          >
            <option value="" disabled>Choose to auto-fill name &amp; email…</option>
            {savedSupervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.track ? ` — ${s.track}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Supervisor Name</label>
          <input value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} placeholder="e.g. Dr. Arvind Rao" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Supervisor Email</label>
          <input value={supervisorEmail} onChange={(e) => setSupervisorEmail(e.target.value)} placeholder="supervisor@ngo.org" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Quota (Volunteers)</label>
          <input type="number" min={1} value={quota} onChange={(e) => setQuota(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Weeks)</label>
          <input type="number" min={1} value={durationWeeks} onChange={(e) => setDurationWeeks(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Target Hours</label>
          <input type="number" min={1} value={targetHours} onChange={(e) => setTargetHours(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 cursor-pointer disabled:opacity-60">
        Create Project
      </button>
    </form>
  );
}

function AssignPanel({ project, onChange, onClose }: { project: Project; onChange: () => void; onClose: () => void }) {
  // Quick-pick list = approved programme members; admins can still type anyone in.
  const [directory, setDirectory] = useState<{ id: string; name: string; email: string }[]>([]);
  const [pick, setPick] = useState('');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const customMode = useCustom || directory.length === 0;

  useEffect(() => {
    let cancelled = false;
    fetchApplications()
      .then((apps) => {
        if (cancelled) return;
        const members = selectApprovedMembers(apps).map((m) => ({ id: m.id, name: m.name, email: m.email }));
        setDirectory(members);
        setPick((current) => current || members[0]?.email || '');
      })
      .catch((err) => console.error('Failed to load member directory:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const [assignError, setAssignError] = useState<string | null>(null);

  const handleAssign = async () => {
    let assignedName = '';
    let assignedEmail = '';
    if (customMode) {
      if (!customName.trim() || !customEmail.trim()) return;
      assignedName = customName.trim();
      assignedEmail = customEmail.trim();
      try {
        await assignMember(project.id, { id: `manual-${Date.now()}`, name: assignedName, email: assignedEmail });
      } catch (err) {
        setAssignError(err instanceof Error ? err.message : 'Failed to assign volunteer.');
        return;
      }
      setCustomName('');
      setCustomEmail('');
    } else {
      const found = directory.find((d) => d.email === pick);
      if (!found) return;
      assignedName = found.name;
      assignedEmail = found.email;
      try {
        await assignMember(project.id, { id: found.id, name: found.name, email: found.email });
      } catch (err) {
        setAssignError(err instanceof Error ? err.message : 'Failed to assign volunteer.');
        return;
      }
    }
    setAssignError(null);
    notifyProjectAssigned(assignedEmail, assignedName, project.title, project.supervisor_name, project.supervisor_email);
    onChange();
  };

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-900">Manage Assigned Volunteers</h4>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className="space-y-1.5">
        {project.assigned.length === 0 && <p className="text-[11px] text-slate-400">No one assigned yet.</p>}
        {project.assigned.map((m) => (
          <div key={m.email} className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs">
            <span className="font-semibold text-slate-800">{m.name}</span>
            <span className="text-slate-400">{m.email}</span>
            <button onClick={async () => {
              try {
                await unassignMember(project.id, m.email);
                setAssignError(null);
              } catch (err) {
                setAssignError(err instanceof Error ? err.message : 'Failed to remove volunteer.');
              }
              onChange();
            }} className="text-rose-500 hover:text-rose-700 cursor-pointer">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {assignError && <p className="text-[11px] font-medium text-rose-700">{assignError}</p>}

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
        {!customMode ? (
          <>
            <select value={pick} onChange={(e) => setPick(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white">
              {directory.map((d) => <option key={d.email} value={d.email}>{d.name} ({d.email})</option>)}
            </select>
            <button type="button" onClick={() => setUseCustom(true)} className="text-[11px] font-semibold text-purple-600 hover:underline cursor-pointer">
              or enter someone else
            </button>
          </>
        ) : (
          <>
            <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Name" className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs w-32" />
            <input value={customEmail} onChange={(e) => setCustomEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs w-40" />
            {directory.length > 0 && (
              <button type="button" onClick={() => setUseCustom(false)} className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer">
                pick from directory
              </button>
            )}
          </>
        )}
        <button onClick={handleAssign} className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-purple-500 cursor-pointer">
          <UserPlus className="h-3.5 w-3.5" /> Assign
        </button>
      </div>
    </div>
  );
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [managingId, setManagingId] = useState<string | null>(null);

  const refresh = () => {
    fetchProjects()
      .then(setProjects)
      .catch((err) => console.error('Failed to load projects:', err));
  };

  useEffect(() => {
    let cancelled = false;
    fetchProjects()
      .then((all) => {
        if (!cancelled) setProjects(all);
      })
      .catch((err) => console.error('Failed to load projects:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="admin" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl">
        <div>
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 mb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Console
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">NGO Project Allocation</h1>
              <p className="text-sm text-slate-600">Manage community impact programs and student/intern allocations.</p>
            </div>
            <button
              onClick={() => setShowForm((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> New Project Program
            </button>
          </div>
        </div>

        {showForm && (
          <NewProjectForm
            onCreated={() => { setShowForm(false); refresh(); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">{p.track}</span>
                <span className="text-xs font-semibold text-slate-500">{p.assigned.length} / {p.quota} Filled</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Lead Supervisor: <span className="font-semibold text-slate-700">{p.supervisor_name}</span></p>
              </div>

              <div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-purple-600" style={{ width: `${Math.min(100, (p.assigned.length / p.quota) * 100)}%` }} />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Capacity: {Math.max(0, p.quota - p.assigned.length)} slots left</span>
                <button onClick={() => setManagingId(managingId === p.id ? null : p.id)} className="font-bold text-purple-600 hover:text-purple-700 cursor-pointer">
                  Manage Students →
                </button>
              </div>

              {managingId === p.id && (
                <AssignPanel project={p} onChange={refresh} onClose={() => setManagingId(null)} />
              )}
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-400">
            <Briefcase className="h-6 w-6 mx-auto mb-2 text-slate-300" />
            No projects yet — create one to get started.
          </div>
        )}
      </main>
    </div>
  );
}
