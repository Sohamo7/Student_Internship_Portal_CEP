'use client';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ReportedIssue, IssueStatus } from '@/lib/supabase/types';

const ISSUES_STORAGE_KEY = 'cep_reported_issues';

const SEED_ISSUES: ReportedIssue[] = [
  {
    id: 'issue-seed-001',
    applicant_id: 'demo-intern-uuid-001',
    applicant_name: 'Aarav Patel',
    applicant_email: 'intern@ngo.org',
    category: 'Technical & Equipment',
    priority: 'high',
    title: 'Faulty charging adapter on refurbished center laptop #4',
    description: 'During the afternoon computer literacy workshop, laptop #4 stopped charging due to a loose pin on the adapter brick. Need a replacement adapter so students can use it.',
    status: 'open',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
  },
  {
    id: 'issue-seed-002',
    applicant_id: 'demo-intern-uuid-001',
    applicant_name: 'Aarav Patel',
    applicant_email: 'intern@ngo.org',
    category: 'Field & Community Center',
    priority: 'medium',
    title: 'Need 15 additional printed workbooks for Week 2 module',
    description: 'Student turnout increased by 15 students at the community center. Requesting additional copies of the intro workbook.',
    status: 'resolved',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    admin_solution: '30 additional spiral-bound workbook sets were printed and dispatched to Center B. Coordinator Sunita has received them.',
  },
  {
    id: 'issue-seed-003',
    applicant_id: 'demo-intern-uuid-002',
    applicant_name: 'Meera Joshi',
    applicant_email: 'meera.intern@ngo.org',
    category: 'Supervisor / Mentorship',
    priority: 'low',
    title: 'Rescheduling weekly check-in call with Dr. Rao',
    description: 'Due to university lab exam on Wednesday, requested shifting the supervisor call to Thursday morning.',
    status: 'in_progress',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    admin_solution: 'Dr. Rao was informed and rescheduled the call to Thursday 11:30 AM via Google Meet.',
  },
];

type IssueRow = Omit<ReportedIssue, 'admin_solution' | 'resolved_at'> & {
  admin_solution: string | null;
  resolved_at: string | null;
};

function fromRow(row: IssueRow): ReportedIssue {
  return {
    ...row,
    admin_solution: row.admin_solution ?? undefined,
    resolved_at: row.resolved_at ?? undefined,
  };
}

// ---- localStorage fallback ----

function readLocal(): ReportedIssue[] {
  if (typeof window === 'undefined') return SEED_ISSUES;
  try {
    const raw = localStorage.getItem(ISSUES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(SEED_ISSUES));
      return SEED_ISSUES;
    }
    return JSON.parse(raw) as ReportedIssue[];
  } catch {
    return SEED_ISSUES;
  }
}

function writeLocal(issues: ReportedIssue[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(issues));
  } catch (err) {
    console.error('Failed to save reported issues:', err);
  }
}

// ---- Public API ----

/** Issues visible to the caller, newest first (admins: all; others: their own, enforced by RLS). */
export async function fetchReportedIssues(): Promise<ReportedIssue[]> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reported_issues')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load reported issues:', error.message);
      return [];
    }
    return ((data as IssueRow[]) || []).map(fromRow);
  }
  return readLocal();
}

export async function createReportedIssue(
  data: Omit<ReportedIssue, 'id' | 'created_at' | 'status'>
): Promise<ReportedIssue> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from('reported_issues')
      .insert({
        applicant_id: data.applicant_id,
        applicant_name: data.applicant_name,
        applicant_email: data.applicant_email,
        category: data.category,
        priority: data.priority,
        title: data.title,
        description: data.description,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromRow(row as IssueRow);
  }

  const newIssue: ReportedIssue = {
    ...data,
    id: `issue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: 'open',
    created_at: new Date().toISOString(),
  };
  writeLocal([newIssue, ...readLocal()]);
  return newIssue;
}

export async function provideIssueSolution(
  id: string,
  solution: string,
  status: IssueStatus = 'resolved'
): Promise<ReportedIssue | null> {
  const resolvedAt = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reported_issues')
      .update({ admin_solution: solution, status, resolved_at: resolvedAt })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data as IssueRow) : null;
  }

  let updatedIssue: ReportedIssue | null = null;
  const updated = readLocal().map((issue) => {
    if (issue.id !== id) return issue;
    updatedIssue = { ...issue, admin_solution: solution, status, resolved_at: resolvedAt };
    return updatedIssue;
  });
  if (updatedIssue) writeLocal(updated);
  return updatedIssue;
}
