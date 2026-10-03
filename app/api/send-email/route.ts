import { NextRequest, NextResponse } from 'next/server';
import {
  sendApplicationSubmittedEmail,
  sendApplicationApprovedEmail,
  sendProjectAssignedEmail,
} from '@/lib/email/send';
import { requireAdmin } from '@/lib/supabase/require-admin';

type EmailRequestBody =
  | { type: 'application_submitted'; to: string; name: string }
  | { type: 'application_approved'; to: string; name: string }
  | {
      type: 'project_assigned';
      to: string;
      name: string;
      projectTitle: string;
      supervisorName: string;
      supervisorEmail: string;
    };

export async function POST(request: NextRequest) {
  let body: EmailRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body?.type || !body?.to || !body?.name) {
    return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
  }

  try {
    switch (body.type) {
      case 'application_submitted': {
        const result = await sendApplicationSubmittedEmail(body.to, body.name);
        return NextResponse.json({ success: true, ...result });
      }
      case 'application_approved': {
        const admin = await requireAdmin();
        if (!admin) {
          return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required.' }, { status: 403 });
        }
        const result = await sendApplicationApprovedEmail(body.to, body.name);
        return NextResponse.json({ success: true, ...result });
      }
      case 'project_assigned': {
        const admin = await requireAdmin();
        if (!admin) {
          return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required.' }, { status: 403 });
        }
        if (!body.projectTitle || !body.supervisorName || !body.supervisorEmail) {
          return NextResponse.json({ success: false, error: 'Missing project assignment fields.' }, { status: 400 });
        }
        const result = await sendProjectAssignedEmail(
          body.to,
          body.name,
          body.projectTitle,
          body.supervisorName,
          body.supervisorEmail
        );
        return NextResponse.json({ success: true, ...result });
      }
      default:
        return NextResponse.json({ success: false, error: 'Unknown email type.' }, { status: 400 });
    }
  } catch (err) {
    console.error('[api/send-email] failed:', err);
    return NextResponse.json({ success: false, error: 'Failed to send email.' }, { status: 500 });
  }
}

