import { describe, it, expect } from 'vitest';
import {
  APPLICATION_PENDING_MESSAGE,
  APPLICATION_REJECTED_MESSAGE,
  getApplicationGateError,
} from '@/lib/auth/login-gate';
import { effectiveStatus } from '@/lib/applications/application-service';
import { UserProfile } from '@/lib/supabase/types';

describe('login gating by application status', () => {
  it('blocks sign-in while the application is pending', () => {
    expect(getApplicationGateError('pending')).toBe(APPLICATION_PENDING_MESSAGE);
  });

  it('blocks sign-in when the application was rejected', () => {
    expect(getApplicationGateError('rejected')).toBe(APPLICATION_REJECTED_MESSAGE);
  });

  it('allows approved members, and accounts with no status (admins, legacy rows)', () => {
    expect(getApplicationGateError('approved')).toBeNull();
    expect(getApplicationGateError(undefined)).toBeNull();
  });

  it('correctly tracks status transition from pending to approved to rejected', () => {
    const applicant: UserProfile = {
      id: 'student-1',
      name: 'New Volunteer',
      email: 'new@college.edu',
      role: 'student',
      application_status: 'pending',
    };

    // Pending: gated
    expect(getApplicationGateError(applicant.application_status)).toBe(APPLICATION_PENDING_MESSAGE);
    expect(effectiveStatus(applicant)).toBe('pending');

    // Admin approves: gate opens
    applicant.application_status = 'approved';
    expect(getApplicationGateError(applicant.application_status)).toBeNull();
    expect(effectiveStatus(applicant)).toBe('approved');

    // Admin rejects: gated
    applicant.application_status = 'rejected';
    expect(getApplicationGateError(applicant.application_status)).toBe(APPLICATION_REJECTED_MESSAGE);
    expect(effectiveStatus(applicant)).toBe('rejected');
  });
});
