import { describe, it, expect } from 'vitest';
import {
  checkIn,
  checkOut,
  computeHours,
  fetchMyAttendance,
  statusLabel,
  verifyAttendance,
} from '@/lib/attendance';

const IN_LOC = { latitude: 18.5204, longitude: 73.8567, accuracy: 12, capturedAt: '2026-10-01T09:00:00.000Z' };
const OUT_LOC = { latitude: 18.5205, longitude: 73.8568, accuracy: 9, capturedAt: '2026-10-01T17:00:00.000Z' };

describe('attendance check-in / check-out', () => {
  it('check-in opens an unverified record for the user', async () => {
    const row = await checkIn('user-1', 'Asha', 'asha@college.edu', IN_LOC, 'student');

    expect(row.student_id).toBe('user-1');
    expect(row.check_out_at).toBeNull();
    expect(row.verified).toBe(false);
    expect(row.in_latitude).toBe(IN_LOC.latitude);
    expect(row.in_longitude).toBe(IN_LOC.longitude);
    expect(computeHours(row)).toBe('In Progress');
    expect(statusLabel(row)).toBe('Pending Today');

    const mine = await fetchMyAttendance('user-1');
    expect(mine.map((r) => r.id)).toContain(row.id);
  });

  it('check-out closes the same record, stores where it happened, and awaits verification', async () => {
    const opened = await checkIn('user-2', 'Ravi', 'ravi@college.edu', IN_LOC, 'intern');
    const closed = await checkOut(opened.id, OUT_LOC);

    expect(closed.id).toBe(opened.id);
    expect(closed.check_out_at).toBeTruthy();
    expect(closed.out_latitude).toBe(OUT_LOC.latitude);
    expect(closed.out_accuracy).toBe(OUT_LOC.accuracy);
    expect(computeHours(closed)).toMatch(/^\d+\.\d{2} hrs$/);
    expect(statusLabel(closed)).toBe('Pending Verification');

    // The change is persisted, not just returned.
    const persisted = (await fetchMyAttendance('user-2')).find((r) => r.id === opened.id);
    expect(persisted?.check_out_at).toBe(closed.check_out_at);

    await verifyAttendance(opened.id);
    const verified = (await fetchMyAttendance('user-2')).find((r) => r.id === opened.id);
    expect(statusLabel(verified!)).toBe('Verified');
  });

  it('refuses to check out a record that does not exist', async () => {
    await expect(checkOut('no-such-record', OUT_LOC)).rejects.toThrow('Attendance record not found.');
  });

  it("only returns the signed-in user's own records", async () => {
    const a = await checkIn('user-a', 'A', 'a@college.edu', IN_LOC, 'student');
    const b = await checkIn('user-b', 'B', 'b@college.edu', IN_LOC, 'student');

    const aIds = (await fetchMyAttendance('user-a')).map((r) => r.id);
    expect(aIds).toContain(a.id);
    expect(aIds).not.toContain(b.id);
  });
});
