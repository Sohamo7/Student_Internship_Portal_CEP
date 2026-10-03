// Server-only. Never import this from a 'use client' component — it reads
// RESEND_API_KEY directly (no NEXT_PUBLIC_ prefix), so it must only run on
// the server. Client code should call lib/email/client.ts instead, which
// hits the /api/send-email route.
import { Resend } from 'resend';

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NGO Portal <onboarding@resend.dev>';

interface SendResult {
  sent: boolean;
  error?: string;
}

async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  if (!isResendConfigured()) {
    // Safe no-op fallback: log instead of sending, so the app works fully
    // in demo/dev environments without a Resend account.
    console.log(`[email:not-configured] Would send "${subject}" to ${to}`);
    return { sent: false };
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    if (error) {
      console.error('[email:resend-error]', error);
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error('[email:send-failed]', err);
    return { sent: false, error: err instanceof Error ? err.message : 'Unknown email error' };
  }
}

function wrapper(bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1e293b;">
      <div style="font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #6366f1; margin-bottom: 16px;">
        NGO Student Internship Portal
      </div>
      ${bodyHtml}
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        This is an automated notification from the NGO Student Internship &amp; Project Management Portal.
      </div>
    </div>
  `;
}

export async function sendApplicationSubmittedEmail(to: string, name: string): Promise<SendResult> {
  const html = wrapper(`
    <h2 style="font-size: 18px; margin: 0 0 12px;">Application Received, ${name}!</h2>
    <p style="font-size: 14px; line-height: 1.6;">
      Thank you for applying to volunteer with us. Your internship application has been successfully received
      and is now <strong>under review</strong> by our NGO team.
    </p>
    <p style="font-size: 14px; line-height: 1.6;">
      We'll email you again as soon as a decision is made. Once approved, you'll be able to sign in to the
      portal using the same email and password you just created.
    </p>
  `);
  return sendEmail(to, 'Your internship application has been received', html);
}

export async function sendApplicationApprovedEmail(to: string, name: string): Promise<SendResult> {
  const html = wrapper(`
    <h2 style="font-size: 18px; margin: 0 0 12px; color: #059669;">You're Approved, ${name}! 🎉</h2>
    <p style="font-size: 14px; line-height: 1.6;">
      Great news — your internship application has been <strong>approved</strong> by our NGO team.
    </p>
    <p style="font-size: 14px; line-height: 1.6;">
      You can now sign in to the portal from the <strong>Sign In</strong> tab using the email and password you
      registered with. Once a project is assigned to you, we'll send you another email with the details.
    </p>
  `);
  return sendEmail(to, 'Your application has been approved — portal access unlocked', html);
}

export async function sendProjectAssignedEmail(
  to: string,
  name: string,
  projectTitle: string,
  supervisorName: string,
  supervisorEmail: string
): Promise<SendResult> {
  const html = wrapper(`
    <h2 style="font-size: 18px; margin: 0 0 12px;">New Project Assigned, ${name}!</h2>
    <p style="font-size: 14px; line-height: 1.6;">
      You've been assigned to <strong>${projectTitle}</strong>. Sign in to the portal to see the full project
      scope, milestones, and timeline.
    </p>
    <p style="font-size: 14px; line-height: 1.6;">
      Your supervisor for this project is <strong>${supervisorName}</strong>
      (<a href="mailto:${supervisorEmail}" style="color:#6366f1;">${supervisorEmail}</a>) — reach out to them
      with any questions before you get started.
    </p>
  `);
  return sendEmail(to, `You've been assigned to ${projectTitle}`, html);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendAdminInviteEmail(
  to: string,
  name: string,
  inviteLink: string,
  invitedBy: string
): Promise<SendResult> {
  const html = wrapper(`
    <h2 style="font-size: 18px; margin: 0 0 12px;">You've been invited as an NGO admin</h2>
    <p style="font-size: 14px; line-height: 1.6;">
      Hi ${escapeHtml(name)}, ${escapeHtml(invitedBy || 'an existing admin')} has invited you to help manage the
      NGO Student Internship Portal (review applications, assign projects, track attendance).
    </p>
    <p style="margin: 20px 0;">
      <a href="${escapeHtml(inviteLink)}" style="display:inline-block; background:#6366f1; color:#fff; text-decoration:none; font-size:14px; font-weight:600; padding:10px 18px; border-radius:10px;">
        Accept invite &amp; set your password
      </a>
    </p>
    <p style="font-size: 12px; line-height: 1.6; color: #64748b;">
      This link can only be used once and expires after a while. If you weren't expecting this invitation,
      you can safely ignore this email.
    </p>
  `);
  return sendEmail(to, "You're invited to join the NGO portal as an admin", html);
}
