import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeHours,
  statusLabel,
  formatTime,
  formatDate,
  mapAttendanceRow,
  assertSupabaseConfigured,
  checkOut,
} from '@/lib/attendance';

const { mockSupabaseClient, mockConfigState } = vi.hoisted(() => {
  return {
    mockConfigState: { configured: true },
    mockSupabaseClient: {
      from: vi.fn(),
    },
  };
});

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => mockConfigState.configured,
  getSupabaseConfig: () => {
    if (!mockConfigState.configured) throw new Error('Not configured');
    return { url: 'https://test.supabase.co', anonKey: 'test-key' };
  },
  createClient: () => mockSupabaseClient,
}));

const OUT_LOC = { latitude: 18.5205, longitude: 73.8568, accuracy: 9, capturedAt: '2026-10-01T17:00:00.000Z' };

describe('attendance display helpers', () => {
  it('formats dates and times cleanly', () => {
    expect(formatTime('')).toBe('—');
    expect(formatDate('')).toBe('—');
    expect(formatTime('invalid')).toBe('—');
    expect(formatDate('invalid')).toBe('—');

    const iso = '2026-10-01T09:30:00.000Z';
    expect(formatTime(iso)).not.toBe('—');
    expect(formatDate(iso)).not.toBe('—');
  });

  it('computes session hours accurately', () => {
    expect(computeHours({ check_in_at: '2026-10-01T09:00:00.000Z', check_out_at: null })).toBe('In Progress');

    const twoHours = computeHours({
      check_in_at: '2026-10-01T09:00:00.000Z',
      check_out_at: '2026-10-01T11:00:00.000Z',
    });
    expect(twoHours).toBe('2.00 hrs');
  });

  it('determines status labels correctly', () => {
    expect(statusLabel({ check_out_at: null, verified: false })).toBe('Pending Today');
    expect(statusLabel({ check_out_at: '2026-10-01T17:00:00.000Z', verified: false })).toBe('Pending Verification');
    expect(statusLabel({ check_out_at: '2026-10-01T17:00:00.000Z', verified: true })).toBe('Verified');
  });
});

describe('mapAttendanceRow', () => {
  it('maps single-object profile join strictly separating intern and student', () => {
    const internRow = mapAttendanceRow({
      id: 'att-1',
      student_id: 'user-intern',
      check_in_at: '2026-10-01T09:00:00.000Z',
      check_out_at: null,
      in_latitude: 18.52,
      in_longitude: 73.85,
      verified: false,
      profiles: { name: 'Priya Sharma', email: 'priya@ngo.org', role: 'intern' },
    });

    expect(internRow.role).toBe('intern');
    expect(internRow.student_name).toBe('Priya Sharma');
    expect(internRow.student_email).toBe('priya@ngo.org');

    const studentRow = mapAttendanceRow({
      id: 'att-2',
      student_id: 'user-student',
      check_in_at: '2026-10-01T09:00:00.000Z',
      check_out_at: null,
      in_latitude: 18.52,
      in_longitude: 73.85,
      verified: false,
      profiles: { name: 'Rahul Verma', email: 'rahul@college.edu', role: 'student' },
    });

    expect(studentRow.role).toBe('student');
    expect(studentRow.student_name).toBe('Rahul Verma');
    expect(studentRow.student_email).toBe('rahul@college.edu');
  });

  it('safely extracts profile when PostgREST returns profiles as an array', () => {
    const arrayRow = mapAttendanceRow({
      id: 'att-3',
      student_id: 'user-arr',
      check_in_at: '2026-10-01T09:00:00.000Z',
      check_out_at: null,
      in_latitude: 18.52,
      in_longitude: 73.85,
      verified: false,
      profiles: [{ name: 'Aarav Patel', email: 'aarav@ngo.org', role: 'intern' }],
    });

    expect(arrayRow.role).toBe('intern');
    expect(arrayRow.student_name).toBe('Aarav Patel');
    expect(arrayRow.student_email).toBe('aarav@ngo.org');
  });

  it('handles case-insensitive roles and rejects unknown roles from being classified as intern', () => {
    const uppercaseRow = mapAttendanceRow({
      id: 'att-4',
      student_id: 'user-4',
      check_in_at: '2026-10-01T09:00:00.000Z',
      check_out_at: null,
      in_latitude: 18.52,
      in_longitude: 73.85,
      verified: false,
      profiles: { name: 'Test', email: 'test@example.com', role: 'Intern' },
    });
    expect(uppercaseRow.role).toBe('intern');

    const unknownRow = mapAttendanceRow({
      id: 'att-5',
      student_id: 'user-5',
      check_in_at: '2026-10-01T09:00:00.000Z',
      check_out_at: null,
      in_latitude: 18.52,
      in_longitude: 73.85,
      verified: false,
      profiles: { name: 'Admin User', email: 'admin@ngo.org', role: 'admin' },
    });
    expect(unknownRow.role).toBeUndefined();

    const missingProfileRow = mapAttendanceRow({
      id: 'att-6',
      student_id: 'user-6',
      check_in_at: '2026-10-01T09:00:00.000Z',
      check_out_at: null,
      in_latitude: 18.52,
      in_longitude: 73.85,
      verified: false,
      profiles: null,
    });
    expect(missingProfileRow.role).toBeUndefined();
  });
});

describe('assertSupabaseConfigured', () => {
  it('throws descriptive error when unconfigured', () => {
    mockConfigState.configured = false;
    expect(() => assertSupabaseConfigured('Check-in')).toThrow(
      'Supabase is not configured. Check-in requires active database credentials'
    );
  });

  it('does not throw when configured', () => {
    mockConfigState.configured = true;
    expect(() => assertSupabaseConfigured('Check-in')).not.toThrow();
  });
});

describe('checkOut safety with mock client', () => {
  beforeEach(() => {
    mockConfigState.configured = true;
  });

  it('rejects checkout on already checked out record', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'att-closed', check_out_at: '2026-10-01T17:00:00.000Z', student_id: 'user-1' },
            error: null,
          }),
        }),
      }),
    });

    await expect(checkOut('att-closed', OUT_LOC)).rejects.toThrow(
      'This attendance session has already been checked out.'
    );
  });

  it('rejects checkout when record is not found', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
    });

    await expect(checkOut('att-missing', OUT_LOC)).rejects.toThrow(
      'Attendance record not found.'
    );
  });
});
