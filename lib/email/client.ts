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

export function notifyApplicationApproved(to: string, name: string): void {
  void post({ type: 'application_approved', to, name });
}

export function notifyProjectAssigned(
  to: string,
  name: string,
  projectTitle: string,
  supervisorName: string,
  supervisorEmail: string
): void {
  void post({ type: 'project_assigned', to, name, projectTitle, supervisorName, supervisorEmail });
}
