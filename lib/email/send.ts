// Server-only. Never import this from a 'use client' component — it reads
// RESEND_API_KEY directly (no NEXT_PUBLIC_ prefix), so it must only run on
// the server. Client code should call lib/email/client.ts instead, which
// hits the /api/send-email route.
import { Resend } from 'resend';

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NGO Portal <onboarding@resend.dev>';

/** Escapes user-supplied text before it is placed inside an HTML email. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Subjects are plain text: strip line breaks so input can never inject mail headers. */
function cleanSubject(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, 200);
}

export interface EmailAttachment {
  filename: string;
  path?: string;
  content?: string | Buffer;
}

interface SendResult {
  sent: boolean;
  error?: string;
}

/** Sends an email via Resend with timeout protection and attachment fallback */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: EmailAttachment[]
): Promise<SendResult> {
  if (!isResendConfigured()) {
    // Safe no-op fallback: log instead of sending, so the app works fully
    // in demo/dev environments without a Resend account.
    console.log(
      `[email:not-configured] Would send "${subject}" to ${to}${
        attachments && attachments.length > 0 ? ` with ${attachments.length} attachment(s)` : ''
      }`
    );
    return { sent: false };
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const sendWithTimeout = async (attList?: EmailAttachment[]) => {
      const sendPromise = resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: cleanSubject(subject),
        html,
        ...(attList && attList.length > 0 ? { attachments: attList } : {}),
      });

      const timeoutPromise = new Promise<{ error: { message: string } | null }>((_, reject) =>
        setTimeout(() => reject(new Error('Resend email timeout (10s)')), 10000)
      );

      return Promise.race([sendPromise, timeoutPromise]);
    };

    let { error } = await sendWithTimeout(attachments);

    // If attachment fetching failed (e.g. invalid URL, remote 404, or expired signed URL),
    // automatically fallback to sending without attachment payload so the recipient
    // ALWAYS receives the email notification with the direct download link intact.
    if (error && attachments && attachments.length > 0) {
      console.warn('[email:attachment-failed, retrying without attachment payload]', error);
      const fallback = await sendWithTimeout(undefined);
      error = fallback.error;
    }

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

/** Standard responsive, email-client-safe wrapper table (works in Gmail, Outlook, Apple Mail) */
function wrapper(bodyHtml: string): string {
  return `
    <div style="background-color: #f8fafc; padding: 32px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; min-height: 100%;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Header Banner -->
        <tr>
          <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 24px 28px; text-align: left;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #c7d2fe; margin-bottom: 4px;">
              Community Engagement Program
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.01em;">
              NGO Student Internship Portal
            </div>
          </td>
        </tr>
        <!-- Main Content -->
        <tr>
          <td style="padding: 28px; color: #1e293b;">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 28px; text-align: center; font-size: 11px; line-height: 1.5; color: #64748b;">
            <div style="margin-bottom: 4px; font-weight: 700;">NGO Student Internship &amp; Community Engagement Portal</div>
            <div>This is an automated notification from the NGO Student Internship &amp; Project Management Portal.</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export function renderApplicationSubmittedHtml(name: string): string {
  return wrapper(`
    <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 14px; color: #0f172a;">Application Received, ${escapeHtml(name)}!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 12px;">
      Thank you for applying to volunteer with us. Your internship application has been successfully received
      and is now <strong>under review</strong> by our NGO team.
    </p>
    <div style="margin: 16px 0; padding: 14px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; font-size: 13px; color: #166534; line-height: 1.5;">
      <strong>Status: Pending Review</strong><br />
      Our coordinators review submissions on a rolling basis. You will receive an automated email as soon as an evaluation decision is reached.
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      We'll email you again as soon as a decision is made. Once approved, you'll be able to sign in to the
      portal using the same email and password you just created.
    </p>
  `);
}

export async function sendApplicationSubmittedEmail(to: string, name: string): Promise<SendResult> {
  return sendEmail(to, 'Your internship application has been received', renderApplicationSubmittedHtml(name));
}

export function renderApplicationApprovedHtml(
  name: string,
  joineeId?: string | null,
  role?: string | null
): string {
  const joineeSection = joineeId
    ? `
      <div style="margin: 16px 0; padding: 14px 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #047857; letter-spacing: 0.05em; margin-bottom: 4px;">
          Official Allocated ID
        </div>
        <div style="font-size: 16px; font-weight: 800; color: #065f46; font-family: monospace;">
          ${escapeHtml(joineeId)}
        </div>
        <div style="font-size: 12px; color: #047857; margin-top: 4px;">
          Designation: ${role === 'intern' ? 'Community Intern' : 'Student Volunteer'}
        </div>
      </div>
    `
    : '';

  return wrapper(`
    <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 14px; color: #059669;">You're Approved, ${escapeHtml(name)}! 🎉</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 12px;">
      Great news — your internship application has been <strong>approved</strong> by our NGO team.
    </p>
    ${joineeSection}
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      You can now sign in to the portal from the <strong>Sign In</strong> tab using the email and password you
      registered with. Once a project is assigned to you, we'll send you another email with the details.
    </p>
    <div style="margin: 24px 0 12px; text-align: center;">
      <a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || 'https://ngo-portal.org')}/login" target="_blank" style="display:inline-block; font-size: 14px; font-weight: 700; color: #ffffff; background: #059669; text-decoration: none; padding: 12px 24px; border-radius: 10px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">
        Sign In to Portal &rarr;
      </a>
    </div>
  `);
}

export async function sendApplicationApprovedEmail(
  to: string,
  name: string,
  joineeId?: string | null,
  role?: string | null
): Promise<SendResult> {
  return sendEmail(
    to,
    'Your application has been approved — portal access unlocked',
    renderApplicationApprovedHtml(name, joineeId, role)
  );
}

export interface ProjectEmailDetails {
  description?: string | null;
  track?: string | null;
  durationWeeks?: number | null;
  targetHours?: number | null;
  quota?: number | null;
  milestones?: string[] | null;
  portalUrl?: string | null;
}

export function renderProjectAssignedHtml(
  name: string,
  projectTitle: string,
  supervisorName: string,
  supervisorEmail: string,
  attachmentName?: string | null,
  attachmentUrl?: string | null,
  details?: ProjectEmailDetails
): string {
  const trackSection = details?.track
    ? `<span style="display:inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
        ${escapeHtml(details.track)} Track
      </span>`
    : '';

  const descriptionSection = details?.description
    ? `
      <div style="margin: 16px 0; padding: 14px 16px; background: #f8fafc; border-left: 3px solid #6366f1; border-radius: 4px; font-size: 13px; line-height: 1.6; color: #334155;">
        <strong style="color: #0f172a;">Project Scope &amp; Objectives:</strong><br />
        ${escapeHtml(details.description)}
      </div>
    `
    : '';

  const metricsSection =
    details?.durationWeeks || details?.targetHours
      ? `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: separate; border-spacing: 8px; margin: 16px 0 20px;">
        <tr>
          <td style="width: 50%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; vertical-align: top;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px;">Duration</div>
            <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${details.durationWeeks ? `${details.durationWeeks} Weeks` : 'Standard Duration'}</div>
          </td>
          <td style="width: 50%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; vertical-align: top;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px;">Target Commitment</div>
            <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${details.targetHours ? `${details.targetHours} Hours` : 'Standard'}</div>
          </td>
        </tr>
      </table>
    `
      : '';

  const milestonesSection =
    details?.milestones && details.milestones.length > 0
      ? `
      <div style="margin: 20px 0;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.04em; margin-bottom: 8px;">
          Milestones &amp; Deliverables Roadmap (${details.milestones.length} Phases)
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          ${details.milestones
            .map(
              (m, i) => `
            <div style="padding: 10px 14px; font-size: 13px; border-bottom: ${
              i < (details.milestones?.length || 0) - 1 ? '1px solid #f1f5f9' : 'none'
            }; color: #1e293b;">
              <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; background: #e0e7ff; color: #4338ca; border-radius: 50%; font-size: 10px; font-weight: 800; margin-right: 8px;">${
                i + 1
              }</span>
              <span>${escapeHtml(m)}</span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
      : '';

  const attachmentSection =
    attachmentName && attachmentUrl
      ? `
      <div style="margin: 20px 0; padding: 16px; border: 1px solid #c7d2fe; border-radius: 12px; background: #eef2ff;">
        <div style="font-size: 12px; font-weight: 700; color: #4338ca; margin-bottom: 6px;">
          📎 Project Document Included
        </div>
        <div style="font-size: 13px; color: #1e293b; margin-bottom: 12px; word-break: break-all;">
          <strong>${escapeHtml(attachmentName)}</strong>
        </div>
        <a href="${escapeHtml(attachmentUrl)}" target="_blank" style="display:inline-block; font-size: 13px; font-weight: 700; color: #ffffff; background: #4f46e5; text-decoration: none; padding: 9px 18px; border-radius: 8px;">
          Download Project Attachment &rarr;
        </a>
      </div>
    `
      : '';

  const supervisorSection = `
    <div style="margin: 20px 0; padding: 14px 16px; background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 12px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a21caf; letter-spacing: 0.05em; margin-bottom: 4px;">
        Assigned NGO Supervisor &amp; Mentor
      </div>
      <div style="font-size: 14px; font-weight: 700; color: #581c87; margin-bottom: 2px;">
        ${escapeHtml(supervisorName)}
      </div>
      <div style="font-size: 12px; color: #701a75;">
        Email: <a href="mailto:${escapeHtml(supervisorEmail)}" style="color: #9333ea; font-weight: 600; text-decoration: underline;">${escapeHtml(supervisorEmail)}</a>
      </div>
    </div>
  `;

  const portalButton = `
    <div style="margin: 24px 0 8px; text-align: center;">
      <a href="${escapeHtml(details?.portalUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ngo-portal.org'}/login`)}" target="_blank" style="display:inline-block; font-size: 14px; font-weight: 700; color: #ffffff; background: #4f46e5; text-decoration: none; padding: 12px 24px; border-radius: 10px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);">
        Open Project in Portal &rarr;
      </a>
      <div style="font-size: 11px; color: #64748b; margin-top: 8px;">
        Sign in to track your attendance, submit daily work logs, and coordinate with your supervisor.
      </div>
    </div>
  `;

  return wrapper(`
    <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 12px; color: #0f172a;">New Project Assigned, ${escapeHtml(name)}!</h2>
    ${trackSection}
    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 12px;">
      You've been assigned to <strong>${escapeHtml(projectTitle)}</strong>. Sign in to the portal to see the full project
      scope, milestones, and timeline.
    </p>
    ${descriptionSection}
    ${metricsSection}
    ${milestonesSection}
    ${attachmentSection}
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      Your supervisor for this project is <strong>${escapeHtml(supervisorName)}</strong>
      (<a href="mailto:${escapeHtml(supervisorEmail)}" style="color:#6366f1;">${escapeHtml(supervisorEmail)}</a>) — reach out to them
      with any questions before you get started.
    </p>
    ${supervisorSection}
    ${portalButton}
  `);
}

export async function sendProjectAssignedEmail(
  to: string,
  name: string,
  projectTitle: string,
  supervisorName: string,
  supervisorEmail: string,
  attachmentName?: string | null,
  attachmentUrl?: string | null,
  details?: ProjectEmailDetails
): Promise<SendResult> {
  const attachments: EmailAttachment[] = [];
  if (attachmentName && attachmentUrl) {
    if (attachmentUrl.startsWith('http://') || attachmentUrl.startsWith('https://')) {
      attachments.push({ filename: attachmentName, path: attachmentUrl });
    } else if (attachmentUrl.startsWith('data:')) {
      const base64Data = attachmentUrl.split(',')[1];
      if (base64Data) {
        attachments.push({ filename: attachmentName, content: base64Data });
      }
    }
  }

  return sendEmail(
    to,
    `You've been assigned to ${projectTitle}`,
    renderProjectAssignedHtml(
      name,
      projectTitle,
      supervisorName,
      supervisorEmail,
      attachmentName,
      attachmentUrl,
      details
    ),
    attachments.length > 0 ? attachments : undefined
  );
}

export async function sendAdminInviteEmail(
  to: string,
  name: string,
  inviteLink: string,
  invitedBy: string
): Promise<SendResult> {
  const html = wrapper(`
    <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 14px; color: #0f172a;">You've been invited as an NGO admin</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      Hi ${escapeHtml(name)}, ${escapeHtml(invitedBy || 'an existing admin')} has invited you to help manage the
      NGO Student Internship Portal (review applications, assign projects, track attendance).
    </p>
    <div style="margin: 24px 0 16px; text-align: center;">
      <a href="${escapeHtml(inviteLink)}" style="display:inline-block; background:#6366f1; color:#fff; text-decoration:none; font-size:14px; font-weight:700; padding:12px 24px; border-radius:10px; box-shadow: 0 2px 4px rgba(99, 102, 241, 0.25);">
        Accept Invite &amp; Set Password &rarr;
      </a>
    </div>
    <p style="font-size: 12px; line-height: 1.6; color: #64748b; margin-top: 16px;">
      This link can only be used once and expires after a while. If you weren't expecting this invitation,
      you can safely ignore this email.
    </p>
  `);
  return sendEmail(to, "You're invited to join the NGO portal as an admin", html);
}
