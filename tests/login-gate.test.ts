import { describe, it, expect } from 'vitest';
import {
  APPLICATION_PENDING_MESSAGE,
  APPLICATION_REJECTED_MESSAGE,
  getApplicationGateError,
} from '@/lib/auth/login-gate';
import { fetchApplications, updateApplicationStatus } from '@/lib/applications/application-service';
import { UserProfile } from '@/lib/supabase/types';

const REGISTERED_USERS_KEY = 'cep_registered_users';

function storeApplicant(profile: UserProfile) {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify({ [profile.email]: { password: 'pw', profile } }));
}

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

  it('keeps a new applicant locked out until an admin approves them', async () => {
    storeApplicant({
      id: 'student-1',
      name: 'New Volunteer',
      email: 'new@college.edu',
      role: 'student',
      application_status: 'pending',
    });

    const find = async () => (await fetchApplications()).find((a) => a.email === 'new@college.edu') as UserProfile;

    expect(getApplicationGateError((await find()).application_status)).toBe(APPLICATION_PENDING_MESSAGE);

    await updateApplicationStatus({ id: 'student-1', email: 'new@college.edu' }, 'approved');
    expect(getApplicationGateError((await find()).application_status)).toBeNull();

    await updateApplicationStatus({ id: 'student-1', email: 'new@college.edu' }, 'rejected');
    expect(getApplicationGateError((await find()).application_status)).toBe(APPLICATION_REJECTED_MESSAGE);
  });
});
