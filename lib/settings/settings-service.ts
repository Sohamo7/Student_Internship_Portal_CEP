import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrganizationProfile {
  name: string;
  registration_number: string;
  contact_email: string;
  phone: string;
  website: string;
  address: string;
}

/** Dates are inclusive, local calendar dates formatted YYYY-MM-DD ('' = no bound). */
export interface IntakeWindow {
  /** Master switch: when false, applications are closed regardless of dates. */
  enabled: boolean;
  opens_on: string;
  closes_on: string;
  /** Shown to prospective volunteers while applications are closed. */
  closed_message: string;
}

export interface Supervisor {
  id: string;
  name: string;
  email: string;
  phone: string;
  track: string;
}

export interface OrgSettings {
  organization: OrganizationProfile;
  intake: IntakeWindow;
  supervisors: Supervisor[];
  updated_at?: string;
}

export const SETTINGS_STORAGE_KEY = 'cep_org_settings';

export const DEFAULT_SETTINGS: OrgSettings = {
  organization: {
    name: 'Navodaya Social Development Trust',
    registration_number: 'NGO-MH-2018-99201',
    contact_email: 'admin@ngo.org',
    phone: '',
    website: '',
    address: '',
  },
  intake: {
    enabled: true,
    opens_on: '',
    closes_on: '',
    closed_message: 'Applications are currently closed. Please check back for the next intake.',
  },
  supervisors: [
    { id: 'sup-001', name: 'Dr. Arvind Rao', email: 'arvind.rao@ngo.org', phone: '', track: 'Education' },
    { id: 'sup-002', name: 'Dr. Meera Sen', email: 'meera.sen@ngo.org', phone: '', track: 'Healthcare' },
    { id: 'sup-003', name: 'Er. Rajesh Bose', email: 'rajesh.bose@ngo.org', phone: '', track: 'Environment' },
    { id: 'sup-004', name: 'Smt. Geeta Joshi', email: 'geeta.joshi@ngo.org', phone: '', track: 'Vocational' },
  ],
};

// ---------------------------------------------------------------------------
// Normalisation + validation
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

/** Merges unknown stored data over the defaults so old/partial/corrupt payloads never crash the UI. */
export function normalizeSettings(raw: unknown): OrgSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const org = (r.organization && typeof r.organization === 'object' ? r.organization : {}) as Record<string, unknown>;
  const intake = (r.intake && typeof r.intake === 'object' ? r.intake : {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;

  const supervisors = Array.isArray(r.supervisors)
    ? (r.supervisors as unknown[])
        .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === 'object')
        .map((s, i) => ({
          id: str(s.id, `sup-${i}`) || `sup-${i}`,
          name: str(s.name),
          email: str(s.email),
          phone: str(s.phone),
          track: str(s.track),
        }))
    : d.supervisors;

  return {
    organization: {
      name: str(org.name, d.organization.name),
      registration_number: str(org.registration_number, d.organization.registration_number),
      contact_email: str(org.contact_email, d.organization.contact_email),
      phone: str(org.phone),
      website: str(org.website),
      address: str(org.address),
    },
    intake: {
      enabled: typeof intake.enabled === 'boolean' ? intake.enabled : d.intake.enabled,
      opens_on: str(intake.opens_on),
      closes_on: str(intake.closes_on),
      closed_message: str(intake.closed_message, d.intake.closed_message),
    },
    supervisors,
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : undefined,
  };
}

export type SettingsErrors = Record<string, string>;

/**
 * Field-level validation. Keys: `organization.name`, `intake.closes_on`,
 * `supervisors.<index>.email`, …  An empty object means the settings are valid.
 */
export function validateSettings(s: OrgSettings): SettingsErrors {
  const e: SettingsErrors = {};
  const { organization: o, intake: i } = s;

  if (!o.name.trim()) e['organization.name'] = 'Organization name is required.';
  if (!o.registration_number.trim()) e['organization.registration_number'] = 'Registration number is required.';
  if (!o.contact_email.trim()) e['organization.contact_email'] = 'Contact email is required.';
  else if (!EMAIL_RE.test(o.contact_email.trim())) e['organization.contact_email'] = 'Enter a valid email address.';
  if (o.website.trim() && !/^https?:\/\/\S+\.\S+/.test(o.website.trim())) {
    e['organization.website'] = 'Website must start with http:// or https://';
  }

  if (i.opens_on && !DATE_RE.test(i.opens_on)) e['intake.opens_on'] = 'Enter a valid date.';
  if (i.closes_on && !DATE_RE.test(i.closes_on)) e['intake.closes_on'] = 'Enter a valid date.';
  if (i.opens_on && i.closes_on && DATE_RE.test(i.opens_on) && DATE_RE.test(i.closes_on) && i.closes_on < i.opens_on) {
    e['intake.closes_on'] = 'Closing date cannot be before the opening date.';
  }
  if (!i.closed_message.trim()) e['intake.closed_message'] = 'Add a message for applicants while intake is closed.';

  const seen = new Set<string>();
  s.supervisors.forEach((sup, idx) => {
    if (!sup.name.trim()) e[`supervisors.${idx}.name`] = 'Name is required.';
    if (!sup.email.trim()) e[`supervisors.${idx}.email`] = 'Email is required.';
    else if (!EMAIL_RE.test(sup.email.trim())) e[`supervisors.${idx}.email`] = 'Enter a valid email address.';
    else if (seen.has(sup.email.trim().toLowerCase())) e[`supervisors.${idx}.email`] = 'Duplicate supervisor email.';
    seen.add(sup.email.trim().toLowerCase());
  });
  return e;
}

/** Trims every string so stored values are clean. */
export function cleanSettings(s: OrgSettings): OrgSettings {
  const t = (v: string) => v.trim();
  return {
    organization: {
      name: t(s.organization.name),
      registration_number: t(s.organization.registration_number),
      contact_email: t(s.organization.contact_email),
      phone: t(s.organization.phone),
      website: t(s.organization.website),
      address: t(s.organization.address),
    },
    intake: { ...s.intake, closed_message: t(s.intake.closed_message) },
    supervisors: s.supervisors.map((x) => ({
      ...x,
      name: t(x.name),
      email: t(x.email),
      phone: t(x.phone),
      track: t(x.track),
    })),
    updated_at: s.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Intake window
// ---------------------------------------------------------------------------

export interface IntakeStatus {
  open: boolean;
  /** Why it is closed (admin-facing label); empty when open. */
  reason: '' | 'disabled' | 'not_yet_open' | 'ended';
}

function localDateString(now: Date): string {
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

export function getIntakeStatus(intake: IntakeWindow, now: Date = new Date()): IntakeStatus {
  if (!intake.enabled) return { open: false, reason: 'disabled' };
  const today = localDateString(now);
  if (intake.opens_on && today < intake.opens_on) return { open: false, reason: 'not_yet_open' };
  if (intake.closes_on && today > intake.closes_on) return { open: false, reason: 'ended' };
  return { open: true, reason: '' };
}

// ---------------------------------------------------------------------------
// Persistence — Supabase `org_settings` row when configured, else localStorage
// ---------------------------------------------------------------------------

export interface LoadResult {
  settings: OrgSettings;
  source: 'supabase' | 'local' | 'default';
  /** Set when Supabase is configured but the settings could not be read. */
  warning?: string;
}

function readLocal(): OrgSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? normalizeSettings(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export async function loadSettings(): Promise<LoadResult> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('org_settings').select('data, updated_at').eq('id', 1).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return { settings: normalizeSettings(null), source: 'default' };
      return {
        settings: normalizeSettings({ ...(data.data as object), updated_at: data.updated_at }),
        source: 'supabase',
      };
    } catch (err) {
      return {
        settings: normalizeSettings(null),
        source: 'default',
        warning: `Could not read saved settings from Supabase (${
          err instanceof Error ? err.message : 'unknown error'
        }). Run the org_settings section of supabase/schema.sql.`,
      };
    }
  }
  const local = readLocal();
  return local ? { settings: local, source: 'local' } : { settings: normalizeSettings(null), source: 'default' };
}

export type SaveResult = { ok: true; settings: OrgSettings } | { ok: false; error: string };

export async function saveSettings(input: OrgSettings): Promise<SaveResult> {
  const errors = validateSettings(input);
  if (Object.keys(errors).length > 0) return { ok: false, error: 'Please fix the highlighted fields.' };

  const cleaned = cleanSettings(input);
  const updated_at = new Date().toISOString();
  const { updated_at: _ignored, ...payload } = cleaned;
  void _ignored;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('org_settings').upsert({ id: 1, data: payload, updated_at });
      if (error) return { ok: false, error: error.message };
      return { ok: true, settings: { ...cleaned, updated_at } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to save settings.' };
    }
  }

  try {
    const stored = { ...cleaned, updated_at };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(stored));
    return { ok: true, settings: stored };
  } catch {
    return { ok: false, error: 'Could not save to browser storage (is it full or disabled?).' };
  }
}
