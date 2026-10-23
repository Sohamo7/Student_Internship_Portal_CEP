'use client';

// Fire-and-forget notification triggers. Email delivery is never allowed to
// block or fail the action that caused it (submitting an application,
// approving one, or assigning a project), so every call here swallows its
// own errors and only logs a warning.

async function post(body: object): Promise<void> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('[email] notification not sent:', data.error || res.statusText);
    }
  } catch (err) {
    console.warn('[email] notification request failed:', err);
  }
}

export function notifyApplicationSubmitted(to: string, name: string): void {
  void post({ type: 'application_submitted', to, name });
}

export function notifyApplicationApproved(
  to: string,
  name: string,
  joineeId?: string | null,
  role?: string | null
): void {
  void post({
    type: 'application_approved',
    to,
    name,
    joineeId: joineeId || null,
    role: role || null,
  });
}

export interface ProjectAssignedPayload {
  to: string;
  name: string;
  projectTitle: string;
  supervisorName: string;
  supervisorEmail: string;
  description?: string | null;
  track?: string | null;
  durationWeeks?: number | null;
  targetHours?: number | null;
  quota?: number | null;
  milestones?: string[] | null;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  portalUrl?: string | null;
}

export function notifyProjectAssigned(
  toOrPayload: string | ProjectAssignedPayload,
  name?: string,
  projectTitle?: string,
  supervisorName?: string,
  supervisorEmail?: string,
  attachmentName?: string | null,
  attachmentUrl?: string | null,
  extra?: {
    description?: string | null;
    track?: string | null;
    durationWeeks?: number | null;
    targetHours?: number | null;
    quota?: number | null;
    milestones?: string[] | null;
    portalUrl?: string | null;
  }
): void {
  if (typeof toOrPayload === 'object' && toOrPayload !== null) {
    void post({
      type: 'project_assigned',
      to: toOrPayload.to,
      name: toOrPayload.name,
      projectTitle: toOrPayload.projectTitle,
      supervisorName: toOrPayload.supervisorName,
      supervisorEmail: toOrPayload.supervisorEmail,
      description: toOrPayload.description || null,
      track: toOrPayload.track || null,
      durationWeeks: toOrPayload.durationWeeks || null,
      targetHours: toOrPayload.targetHours || null,
      quota: toOrPayload.quota || null,
      milestones: toOrPayload.milestones || null,
      attachmentName: toOrPayload.attachmentName || null,
      attachmentUrl: toOrPayload.attachmentUrl || null,
      portalUrl: toOrPayload.portalUrl || null,
    });
    return;
  }

  void post({
    type: 'project_assigned',
    to: toOrPayload,
    name: name || '',
    projectTitle: projectTitle || '',
    supervisorName: supervisorName || '',
    supervisorEmail: supervisorEmail || '',
    description: extra?.description || null,
    track: extra?.track || null,
    durationWeeks: extra?.durationWeeks || null,
    targetHours: extra?.targetHours || null,
    quota: extra?.quota || null,
    milestones: extra?.milestones || null,
    attachmentName: attachmentName || null,
    attachmentUrl: attachmentUrl || null,
    portalUrl: extra?.portalUrl || null,
  });
}
