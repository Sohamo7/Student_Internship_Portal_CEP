import { ApplicationStatus } from '@/lib/supabase/types';

// Single source of truth for the "application gate" on sign-in: new volunteers
// cannot enter the portal until an NGO admin approves their application.
// Used by both the Supabase and the demo (localStorage) login paths.

export const APPLICATION_PENDING_MESSAGE =
  'Your internship application is still under review. We\u2019ll email you as soon as an NGO admin approves it — then you can sign in here.';

export const APPLICATION_REJECTED_MESSAGE =
  'Your internship application was not approved, so portal access is unavailable. Please contact the NGO team for details.';

/**
 * Returns the message to show when sign-in must be blocked, or null when the
 * account may enter. A missing status (admin accounts, legacy rows) counts as approved.
 */
export function getApplicationGateError(status: ApplicationStatus | undefined): string | null {
  if (status === 'pending') return APPLICATION_PENDING_MESSAGE;
  if (status === 'rejected') return APPLICATION_REJECTED_MESSAGE;
  return null;
}
