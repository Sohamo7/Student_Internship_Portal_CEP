'use client';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface AssignedMember {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  track: string;
  supervisor_name: string;
  supervisor_email: string;
  duration_weeks: number;
  target_hours: number;
  quota: number;
  milestones: string[];
  assigned: AssignedMember[];
  created_at: string;
  attachment_path?: string | null;
  attachment_name?: string | null;
  attachment_url?: string | null;
}

const STORAGE_KEY = 'cep_projects';

const SEED_PROJECTS: Project[] = [];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CreateProjectInput = Omit<Project, 'id' | 'assigned' | 'created_at' | 'milestones'> & {
  milestones?: string[];
  attachment_path?: string | null;
  attachment_name?: string | null;
  attachment_url?: string | null;
};

const DEFAULT_MILESTONES = ['Complete onboarding', 'Deliver first milestone', 'Submit final report'];

// ---- Supabase row mapping ----

interface AssignmentRow {
  id: string;
  member_id: string | null;
  member_name: string;
  member_email: string;
}

interface ProjectRow extends Omit<Project, 'assigned'> {
  project_assignments?: AssignmentRow[] | null;
}

function fromRow(row: ProjectRow): Project {
  const { project_assignments, ...rest } = row;
  return {
    ...rest,
    milestones: rest.milestones ?? [],
    attachment_path: rest.attachment_path ?? null,
    attachment_name: rest.attachment_name ?? null,
    attachment_url: rest.attachment_url ?? null,
    assigned: (project_assignments ?? []).map((a) => ({
      id: a.member_id ?? a.id,
      name: a.member_name,
      email: a.member_email,
    })),
  };
}

const PROJECT_SELECT = '*, project_assignments(id, member_id, member_name, member_email)';

// ---- localStorage fallback ----

function readLocal(): Project[] {
  if (typeof window === 'undefined') return SEED_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PROJECTS));
      return SEED_PROJECTS;
    }
    return JSON.parse(raw) as Project[];
  } catch {
    return SEED_PROJECTS;
  }
}

function writeLocal(projects: Project[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects:', err);
  }
}

// ---- Public API ----

/** Every project visible to the caller (admins: all; members: only their own, enforced by RLS). */
export async function fetchProjects(): Promise<Project[]> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load projects:', error.message);
      return [];
    }
    return ((data as unknown as ProjectRow[]) || []).map(fromRow);
  }
  return readLocal();
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
  const milestones = data.milestones && data.milestones.length > 0 ? data.milestones : DEFAULT_MILESTONES;

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const insertPayload: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      track: data.track,
      supervisor_name: data.supervisor_name,
      supervisor_email: data.supervisor_email,
      duration_weeks: data.duration_weeks,
      target_hours: data.target_hours,
      quota: data.quota,
      milestones,
      attachment_path: data.attachment_path || null,
      attachment_name: data.attachment_name || null,
      attachment_url: data.attachment_url || null,
    };

    let { data: row, error } = await supabase
      .from('projects')
      .insert(insertPayload)
      .select(PROJECT_SELECT)
      .single();

    if (error && error.message?.includes('attachment_')) {
      delete insertPayload.attachment_path;
      delete insertPayload.attachment_name;
      delete insertPayload.attachment_url;
      const retry = await supabase.from('projects').insert(insertPayload).select(PROJECT_SELECT).single();
      row = retry.data;
      error = retry.error;
    }

    if (error) throw new Error(error.message);
    return fromRow(row as unknown as ProjectRow);
  }

  const newProject: Project = {
    ...data,
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    milestones,
    assigned: [],
    created_at: new Date().toISOString(),
    attachment_path: data.attachment_path || null,
    attachment_name: data.attachment_name || null,
    attachment_url: data.attachment_url || null,
  };
  writeLocal([newProject, ...readLocal()]);
  return newProject;
}

export async function assignMember(projectId: string, member: AssignedMember): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { error } = await supabase.from('project_assignments').insert({
      project_id: projectId,
      // Only real profile ids can be linked; hand-typed assignees have none.
      member_id: UUID_RE.test(member.id) ? member.id : null,
      member_name: member.name,
      member_email: member.email,
    });
    // 23505 = already assigned (unique project/email) — same no-op as the local path.
    if (error && error.code !== '23505') throw new Error(error.message);
    return;
  }

  writeLocal(
    readLocal().map((p) => {
      if (p.id !== projectId) return p;
      if (p.assigned.some((m) => m.email.toLowerCase() === member.email.toLowerCase())) return p;
      return { ...p, assigned: [...p.assigned, member] };
    })
  );
}

export async function unassignMember(projectId: string, email: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('project_assignments')
      .select('id, member_email')
      .eq('project_id', projectId);
    if (error) throw new Error(error.message);
    const ids = ((data as { id: string; member_email: string }[]) || [])
      .filter((r) => r.member_email.toLowerCase() === email.toLowerCase())
      .map((r) => r.id);
    if (ids.length === 0) return;
    const { error: delError } = await supabase.from('project_assignments').delete().in('id', ids);
    if (delError) throw new Error(delError.message);
    return;
  }

  writeLocal(
    readLocal().map((p) =>
      p.id === projectId
        ? { ...p, assigned: p.assigned.filter((m) => m.email.toLowerCase() !== email.toLowerCase()) }
        : p
    )
  );
}

export async function fetchProjectsForMember(email: string, memberId?: string): Promise<Project[]> {
  const normalized = email ? email.trim().toLowerCase() : '';
  const projects = await fetchProjects();
  return projects.filter((p) =>
    p.assigned.some(
      (m) =>
        (normalized && m.email && m.email.trim().toLowerCase() === normalized) ||
        (memberId && m.id && m.id === memberId)
    )
  );
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export async function updateProject(id: string, data: UpdateProjectInput): Promise<Project> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const updatePayload: Record<string, unknown> = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.track !== undefined) updatePayload.track = data.track;
    if (data.supervisor_name !== undefined) updatePayload.supervisor_name = data.supervisor_name;
    if (data.supervisor_email !== undefined) updatePayload.supervisor_email = data.supervisor_email;
    if (data.duration_weeks !== undefined) updatePayload.duration_weeks = data.duration_weeks;
    if (data.target_hours !== undefined) updatePayload.target_hours = data.target_hours;
    if (data.quota !== undefined) updatePayload.quota = data.quota;
    if (data.milestones !== undefined) updatePayload.milestones = data.milestones;
    if (data.attachment_path !== undefined) updatePayload.attachment_path = data.attachment_path;
    if (data.attachment_name !== undefined) updatePayload.attachment_name = data.attachment_name;
    if (data.attachment_url !== undefined) updatePayload.attachment_url = data.attachment_url;

    let { data: row, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .select(PROJECT_SELECT)
      .single();

    if (error && error.message?.includes('attachment_')) {
      delete updatePayload.attachment_path;
      delete updatePayload.attachment_name;
      delete updatePayload.attachment_url;
      const retry = await supabase.from('projects').update(updatePayload).eq('id', id).select(PROJECT_SELECT).single();
      row = retry.data;
      error = retry.error;
    }

    if (error) throw new Error(error.message);
    return fromRow(row as unknown as ProjectRow);
  }

  const existing = readLocal();
  const updated = existing.map((p) => {
    if (p.id !== id) return p;
    return {
      ...p,
      ...data,
      milestones: data.milestones ?? p.milestones,
      attachment_path: data.attachment_path !== undefined ? data.attachment_path : p.attachment_path,
      attachment_name: data.attachment_name !== undefined ? data.attachment_name : p.attachment_name,
      attachment_url: data.attachment_url !== undefined ? data.attachment_url : p.attachment_url,
    };
  });
  writeLocal(updated);
  const found = updated.find((p) => p.id === id);
  if (!found) throw new Error('Project not found');
  return found;
}

export async function deleteProject(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  writeLocal(readLocal().filter((p) => p.id !== id));
}

