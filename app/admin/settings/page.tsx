'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';

import {
  IntakeWindow,
  OrgSettings,
  OrganizationProfile,
  Supervisor,
  GeofenceSettings,
  getIntakeStatus,
  loadSettings,
  normalizeSettings,
  saveSettings,
  validateSettings,
} from '@/lib/settings/settings-service';
import {
  Building2,
  CalendarRange,
  CheckCircle2,
  ArrowLeft,
  Save,
  Undo2,
  UserPlus,
  Trash2,
  Loader2,
  AlertCircle,
  Users,
  MapPin,
  Navigation,
  Crosshair,
  ExternalLink,
} from 'lucide-react';
import { captureLocation, mapsLink, LocationCaptureError } from '@/lib/geolocation';

const INPUT =
  'mt-1.5 block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20';

function inputClass(error?: string) {
  return `${INPUT} ${error ? 'border-rose-400' : 'border-slate-200'}`;
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700">{label}</label>
      {children}
      {error ? (
        <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  aside,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            {icon}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

const INTAKE_REASON_LABEL = {
  disabled: 'Closed — intake switched off',
  not_yet_open: 'Closed — opens later',
  ended: 'Closed — window has ended',
} as const;

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState<OrgSettings>(() => normalizeSettings(null));
  const [draft, setDraft] = useState<OrgSettings>(() => normalizeSettings(null));
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSettings()
      .then((result) => {
        if (cancelled) return;
        setSaved(result.settings);
        setDraft(result.settings);
        setWarning(result.warning ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const errors = useMemo(() => validateSettings(draft), [draft]);
  const visibleErrors = showErrors ? errors : {};
  const dirty = JSON.stringify({ ...draft, updated_at: undefined }) !== JSON.stringify({ ...saved, updated_at: undefined });
  const intakeStatus = getIntakeStatus(draft.intake);

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const touch = () => {
    setJustSaved(false);
    setSaveError(null);
    setLocationSuccess(null);
    setLocationError(null);
  };
  const setOrg = <K extends keyof OrganizationProfile>(key: K, value: OrganizationProfile[K]) => {
    touch();
    setDraft((d) => ({ ...d, organization: { ...d.organization, [key]: value } }));
  };
  const setIntake = <K extends keyof IntakeWindow>(key: K, value: IntakeWindow[K]) => {
    touch();
    setDraft((d) => ({ ...d, intake: { ...d.intake, [key]: value } }));
  };
  const setGeofence = <K extends keyof GeofenceSettings>(key: K, value: GeofenceSettings[K]) => {
    touch();
    setDraft((d) => ({ ...d, geofence: { ...d.geofence, [key]: value } }));
  };
  const handleUseCurrentLocation = async () => {
    setLocationError(null);
    setLocationSuccess(null);
    setDetectingLocation(true);
    try {
      const loc = await captureLocation();
      touch();
      setDraft((d) => ({
        ...d,
        geofence: {
          ...d.geofence,
          latitude: Number(loc.latitude.toFixed(6)),
          longitude: Number(loc.longitude.toFixed(6)),
        },
      }));
      setLocationSuccess(`Detected device coordinates: ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)} (±${Math.round(loc.accuracy)}m accuracy)`);
    } catch (err) {
      setLocationError(
        err instanceof LocationCaptureError || err instanceof Error
          ? err.message
          : 'Could not detect current location. Please ensure location services are enabled.'
      );
    } finally {
      setDetectingLocation(false);
    }
  };
  const setSupervisor = (index: number, patch: Partial<Supervisor>) => {
    touch();
    setDraft((d) => ({
      ...d,
      supervisors: d.supervisors.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };
  const addSupervisor = () => {
    touch();
    setDraft((d) => ({
      ...d,
      supervisors: [
        ...d.supervisors,
        { id: `sup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: '', email: '', phone: '', track: '' },
      ],
    }));
  };
  const removeSupervisor = (index: number) => {
    touch();
    setDraft((d) => ({ ...d, supervisors: d.supervisors.filter((_, i) => i !== index) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    setSaveError(null);
    if (Object.keys(errors).length > 0) {
      setSaveError('Please fix the highlighted fields before saving.');
      return;
    }
    setSaving(true);
    const result = await saveSettings(draft);
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    setSaved(result.settings);
    setDraft(result.settings);
    setShowErrors(false);
    setWarning(null);
    setJustSaved(true);
  };

  const handleReset = () => {
    setDraft(saved);
    setShowErrors(false);
    setSaveError(null);
    setJustSaved(false);
    setLocationSuccess(null);
    setLocationError(null);
  };

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="admin" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl">
        <div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Console
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">NGO Portal Settings</h1>
          <p className="text-sm text-slate-600">
            Organization profile, GPS attendance geofence, application intake window, and supervisor contacts.
          </p>
        </div>

        {warning && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading settings...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6" noValidate>
            {/* Organization profile */}
            <Section
              icon={<Building2 className="h-5 w-5" />}
              title="Organization Profile"
              description="Shown to volunteers and used as the NGO's public contact details."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Organization Name" error={visibleErrors['organization.name']}>
                  <input
                    type="text"
                    value={draft.organization.name}
                    onChange={(e) => setOrg('name', e.target.value)}
                    className={inputClass(visibleErrors['organization.name'])}
                  />
                </Field>
                <Field label="NGO Registration Number" error={visibleErrors['organization.registration_number']}>
                  <input
                    type="text"
                    value={draft.organization.registration_number}
                    onChange={(e) => setOrg('registration_number', e.target.value)}
                    className={inputClass(visibleErrors['organization.registration_number'])}
                  />
                </Field>
                <Field label="Contact / Support Email" error={visibleErrors['organization.contact_email']}>
                  <input
                    type="email"
                    value={draft.organization.contact_email}
                    onChange={(e) => setOrg('contact_email', e.target.value)}
                    className={inputClass(visibleErrors['organization.contact_email'])}
                  />
                </Field>
                <Field label="Phone (optional)">
                  <input
                    type="tel"
                    value={draft.organization.phone}
                    onChange={(e) => setOrg('phone', e.target.value)}
                    className={inputClass()}
                  />
                </Field>
                <Field label="Website (optional)" error={visibleErrors['organization.website']}>
                  <input
                    type="url"
                    placeholder="https://"
                    value={draft.organization.website}
                    onChange={(e) => setOrg('website', e.target.value)}
                    className={inputClass(visibleErrors['organization.website'])}
                  />
                </Field>
                <Field label="Address (optional)">
                  <input
                    type="text"
                    value={draft.organization.address}
                    onChange={(e) => setOrg('address', e.target.value)}
                    className={inputClass()}
                  />
                </Field>
              </div>
            </Section>

            {/* Intake window */}
            <Section
              icon={<CalendarRange className="h-5 w-5" />}
              title="Application Intake Window"
              description="Controls whether new volunteers can submit an application on the login page."
              aside={
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                    intakeStatus.open
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  {intakeStatus.open ? 'Open for applications' : INTAKE_REASON_LABEL[intakeStatus.reason || 'disabled']}
                </span>
              }
            >
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.intake.enabled}
                  onChange={(e) => setIntake('enabled', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600"
                />
                Accept new applications
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Opens on (optional)"
                  error={visibleErrors['intake.opens_on']}
                  hint="Leave empty to open immediately."
                >
                  <input
                    type="date"
                    value={draft.intake.opens_on}
                    onChange={(e) => setIntake('opens_on', e.target.value)}
                    className={inputClass(visibleErrors['intake.opens_on'])}
                  />
                </Field>
                <Field
                  label="Closes on (optional)"
                  error={visibleErrors['intake.closes_on']}
                  hint="Inclusive — the last day applications are accepted."
                >
                  <input
                    type="date"
                    value={draft.intake.closes_on}
                    min={draft.intake.opens_on || undefined}
                    onChange={(e) => setIntake('closes_on', e.target.value)}
                    className={inputClass(visibleErrors['intake.closes_on'])}
                  />
                </Field>
              </div>

              <Field
                label="Message shown while closed"
                error={visibleErrors['intake.closed_message']}
              >
                <textarea
                  rows={2}
                  value={draft.intake.closed_message}
                  onChange={(e) => setIntake('closed_message', e.target.value)}
                  className={inputClass(visibleErrors['intake.closed_message'])}
                />
              </Field>
            </Section>

            {/* GPS Geofence & Attendance Location */}
            <Section
              icon={<MapPin className="h-5 w-5" />}
              title="GPS Geofence & Attendance Location"
              description="Configure the NGO physical site coordinates and radius to verify volunteer & intern attendance check-ins."
              aside={
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                    draft.geofence.enabled
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-100 text-slate-600'
                  }`}
                >
                  {draft.geofence.enabled ? (
                    <>
                      <Navigation className="h-3.5 w-3.5 text-emerald-600" />
                      Active · {draft.geofence.radius_meters}m radius
                    </>
                  ) : (
                    'Geofence disabled'
                  )}
                </span>
              }
            >
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.geofence.enabled}
                  onChange={(e) => setGeofence('enabled', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600"
                />
                Enable GPS geofence verification for attendance
              </label>

              <Field
                label="Site / Center Name"
                error={visibleErrors['geofence.site_name']}
                hint="Used as a label in attendance records and verification tables."
              >
                <input
                  type="text"
                  placeholder="e.g. Main Headquarters, Downtown Center"
                  value={draft.geofence.site_name}
                  onChange={(e) => setGeofence('site_name', e.target.value)}
                  className={inputClass(visibleErrors['geofence.site_name'])}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field
                  label="Site Latitude"
                  error={visibleErrors['geofence.latitude']}
                  hint="Decimal degrees (-90.0 to 90.0)"
                >
                  <input
                    type="number"
                    step="any"
                    value={isNaN(draft.geofence.latitude) ? '' : draft.geofence.latitude}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setGeofence('latitude', isNaN(val) ? (e.target.value as unknown as number) : val);
                    }}
                    className={inputClass(visibleErrors['geofence.latitude'])}
                  />
                </Field>

                <Field
                  label="Site Longitude"
                  error={visibleErrors['geofence.longitude']}
                  hint="Decimal degrees (-180.0 to 180.0)"
                >
                  <input
                    type="number"
                    step="any"
                    value={isNaN(draft.geofence.longitude) ? '' : draft.geofence.longitude}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setGeofence('longitude', isNaN(val) ? (e.target.value as unknown as number) : val);
                    }}
                    className={inputClass(visibleErrors['geofence.longitude'])}
                  />
                </Field>

                <Field
                  label="Geofence Radius (meters)"
                  error={visibleErrors['geofence.radius_meters']}
                  hint="Check-ins beyond this distance get flagged."
                >
                  <input
                    type="number"
                    min="10"
                    max="500000"
                    step="10"
                    value={isNaN(draft.geofence.radius_meters) ? '' : draft.geofence.radius_meters}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setGeofence('radius_meters', isNaN(val) ? (e.target.value as unknown as number) : val);
                    }}
                    className={inputClass(visibleErrors['geofence.radius_meters'])}
                  />
                </Field>
              </div>

              {/* Quick radius presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quick Radius Presets</label>
                <div className="flex flex-wrap gap-2">
                  {[100, 250, 500, 1000, 2000].map((meters) => (
                    <button
                      key={meters}
                      type="button"
                      onClick={() => setGeofence('radius_meters', meters)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        draft.geofence.radius_meters === meters
                          ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {meters >= 1000 ? `${meters / 1000} km` : `${meters} m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location detection & Google Maps action toolbar */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={detectingLocation}
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 disabled:opacity-50 cursor-pointer"
                >
                  {detectingLocation ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Crosshair className="h-3.5 w-3.5" />
                  )}
                  {detectingLocation ? 'Detecting device GPS...' : 'Use My Current Device Location'}
                </button>

                {!isNaN(draft.geofence.latitude) && !isNaN(draft.geofence.longitude) && (
                  <a
                    href={mapsLink({ latitude: draft.geofence.latitude, longitude: draft.geofence.longitude })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                    Preview Pin on Google Maps
                  </a>
                )}
              </div>

              {locationSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{locationSuccess}</span>
                </div>
              )}

              {locationError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{locationError}</span>
                </div>
              )}

              {/* Helper text explaining geofencing logic */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">How attendance geofencing works:</p>
                <p>
                  When volunteers or interns check in on their device, their GPS coordinates are captured. In the Attendance Verification console, the system calculates their straight-line distance from this configured site location. Any check-in farther than {draft.geofence.radius_meters || 500} meters is highlighted with a distance warning so admins can review it before confirming presence.
                </p>
              </div>
            </Section>

            {/* Supervisors */}
            <Section
              icon={<Users className="h-5 w-5" />}
              title="Supervisor Contacts"
              description="Saved supervisors can be picked when creating a project."
              aside={
                <button
                  type="button"
                  onClick={addSupervisor}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Add supervisor
                </button>
              }
            >
              {draft.supervisors.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  No supervisors yet. Add one to reuse their details across projects.
                </p>
              ) : (
                <div className="space-y-3">
                  {draft.supervisors.map((sup, i) => (
                    <div key={sup.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Name" error={visibleErrors[`supervisors.${i}.name`]}>
                          <input
                            type="text"
                            value={sup.name}
                            onChange={(e) => setSupervisor(i, { name: e.target.value })}
                            className={inputClass(visibleErrors[`supervisors.${i}.name`])}
                          />
                        </Field>
                        <Field label="Email" error={visibleErrors[`supervisors.${i}.email`]}>
                          <input
                            type="email"
                            value={sup.email}
                            onChange={(e) => setSupervisor(i, { email: e.target.value })}
                            className={inputClass(visibleErrors[`supervisors.${i}.email`])}
                          />
                        </Field>
                        <Field label="Phone (optional)">
                          <input
                            type="tel"
                            value={sup.phone}
                            onChange={(e) => setSupervisor(i, { phone: e.target.value })}
                            className={inputClass()}
                          />
                        </Field>
                        <Field label="Track / Area (optional)">
                          <input
                            type="text"
                            value={sup.track}
                            onChange={(e) => setSupervisor(i, { track: e.target.value })}
                            className={inputClass()}
                          />
                        </Field>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeSupervisor(i)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Save bar */}
            <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-md backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-[1.25rem] text-xs">
                {saveError ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-rose-700">
                    <AlertCircle className="h-4 w-4" /> {saveError}
                  </span>
                ) : justSaved ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Settings saved
                    {saved.updated_at ? ` · ${new Date(saved.updated_at).toLocaleTimeString()}` : ''}
                  </span>
                ) : dirty ? (
                  <span className="font-semibold text-amber-700">You have unsaved changes.</span>
                ) : saved.updated_at ? (
                  <span className="text-slate-400">Last saved {new Date(saved.updated_at).toLocaleString()}</span>
                ) : (
                  <span className="text-slate-400">Showing defaults — nothing saved yet.</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!dirty || saving}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Undo2 className="h-4 w-4" /> Discard
                </button>
                <button
                  type="submit"
                  disabled={saving || (!dirty && Boolean(saved.updated_at))}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
