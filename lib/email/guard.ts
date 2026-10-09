// Small, dependency-free helpers for the /api/send-email route, kept separate
// so they can be unit-tested without Next.js or Supabase.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

/** Trims and caps free text so a request can't smuggle in huge payloads. */
export function clampText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/**
 * Best-effort "at most one per key per window" limiter. State lives in this
 * server instance's memory, so on serverless hosting each instance counts
 * separately — it blunts abuse but is not a hard guarantee. (The real
 * protection is that only admins / verified applicants can trigger an email.)
 */
export function createThrottle(windowMs: number, now: () => number = Date.now) {
  const last = new Map<string, number>();
  return {
    /** Returns true if the action may proceed (and records it). */
    allow(key: string): boolean {
      const t = now();
      for (const [k, at] of last) if (t - at >= windowMs) last.delete(k); // keep the map small
      const prev = last.get(key);
      if (prev !== undefined && t - prev < windowMs) return false;
      last.set(key, t);
      return true;
    },
  };
}
