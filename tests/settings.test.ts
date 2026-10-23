import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SETTINGS,
  DEFAULT_GEOFENCE,
  normalizeSettings,
  validateSettings,
  cleanSettings,
  saveSettings,
  loadSettings,
  OrgSettings,
} from '@/lib/settings/settings-service';

describe('geofence settings in org-settings service', () => {
  it('has sensible default geofence configuration', () => {
    expect(DEFAULT_SETTINGS.geofence).toBeDefined();
    expect(DEFAULT_SETTINGS.geofence.enabled).toBe(true);
    expect(typeof DEFAULT_SETTINGS.geofence.site_name).toBe('string');
    expect(DEFAULT_SETTINGS.geofence.site_name.length).toBeGreaterThan(0);
    expect(DEFAULT_SETTINGS.geofence.latitude).toBeGreaterThanOrEqual(-90);
    expect(DEFAULT_SETTINGS.geofence.latitude).toBeLessThanOrEqual(90);
    expect(DEFAULT_SETTINGS.geofence.longitude).toBeGreaterThanOrEqual(-180);
    expect(DEFAULT_SETTINGS.geofence.longitude).toBeLessThanOrEqual(180);
    expect(DEFAULT_SETTINGS.geofence.radius_meters).toBeGreaterThan(0);
  });

  it('normalizes missing or corrupted geofence data safely', () => {
    const normalized = normalizeSettings({});
    expect(normalized.geofence).toBeDefined();
    expect(normalized.geofence.enabled).toBe(DEFAULT_GEOFENCE.enabled);
    expect(normalized.geofence.latitude).toBe(DEFAULT_GEOFENCE.latitude);
    expect(normalized.geofence.longitude).toBe(DEFAULT_GEOFENCE.longitude);
    expect(normalized.geofence.radius_meters).toBe(DEFAULT_GEOFENCE.radius_meters);

    // handles string numbers from forms or json
    const fromStrings = normalizeSettings({
      geofence: {
        enabled: false,
        site_name: ' Pune Field Center ',
        latitude: '18.5204',
        longitude: '73.8567',
        radius_meters: '750',
      },
    });

    expect(fromStrings.geofence.enabled).toBe(false);
    expect(fromStrings.geofence.site_name).toBe(' Pune Field Center ');
    expect(fromStrings.geofence.latitude).toBeCloseTo(18.5204);
    expect(fromStrings.geofence.longitude).toBeCloseTo(73.8567);
    expect(fromStrings.geofence.radius_meters).toBe(750);
  });

  it('validates latitude boundaries strictly', () => {
    const s: OrgSettings = {
      ...DEFAULT_SETTINGS,
      geofence: { ...DEFAULT_SETTINGS.geofence, latitude: 95 },
    };
    const errors = validateSettings(s);
    expect(errors['geofence.latitude']).toBeDefined();

    const s2: OrgSettings = {
      ...DEFAULT_SETTINGS,
      geofence: { ...DEFAULT_SETTINGS.geofence, latitude: -95 },
    };
    expect(validateSettings(s2)['geofence.latitude']).toBeDefined();

    const s3: OrgSettings = {
      ...DEFAULT_SETTINGS,
      geofence: { ...DEFAULT_SETTINGS.geofence, latitude: NaN },
    };
    expect(validateSettings(s3)['geofence.latitude']).toBeDefined();
  });

  it('validates longitude boundaries strictly', () => {
    const s: OrgSettings = {
      ...DEFAULT_SETTINGS,
      geofence: { ...DEFAULT_SETTINGS.geofence, longitude: 185 },
    };
    const errors = validateSettings(s);
    expect(errors['geofence.longitude']).toBeDefined();

    const s2: OrgSettings = {
      ...DEFAULT_SETTINGS,
      geofence: { ...DEFAULT_SETTINGS.geofence, longitude: -190 },
    };
    expect(validateSettings(s2)['geofence.longitude']).toBeDefined();

    const s3: OrgSettings = {
      ...DEFAULT_SETTINGS,
      geofence: { ...DEFAULT_SETTINGS.geofence, longitude: NaN },
    };
    expect(validateSettings(s3)['geofence.longitude']).toBeDefined();
  });

  it('validates geofence radius strictly', () => {
    const s0: OrgSettings = {
      ...DEFAULT_SETTINGS,
      geofence: { ...DEFAULT_SETTINGS.geofence, radius_meters: 0 },
    };
    expect(validateSettings(s0)['geofence.radius_meters']).toBeDefined();

    const sNegative: OrgSettings = {
      ...DEFAULT_SETTINGS,
      geofence: { ...DEFAULT_SETTINGS.geofence, radius_meters: -50 },
    };
    expect(validateSettings(sNegative)['geofence.radius_meters']).toBeDefined();

    const sTooLarge: OrgSettings = {
      ...DEFAULT_SETTINGS,
      geofence: { ...DEFAULT_SETTINGS.geofence, radius_meters: 600000 },
    };
    expect(validateSettings(sTooLarge)['geofence.radius_meters']).toBeDefined();
  });

  it('validates site name requirement', () => {
    const s: OrgSettings = {
      ...DEFAULT_SETTINGS,
      geofence: { ...DEFAULT_SETTINGS.geofence, site_name: '   ' },
    };
    expect(validateSettings(s)['geofence.site_name']).toBeDefined();
  });

  it('cleans and trims geofence fields cleanly', () => {
    const s: OrgSettings = {
      ...DEFAULT_SETTINGS,
      geofence: {
        enabled: true,
        site_name: '   Mumbai Community Center   ',
        latitude: 19.076,
        longitude: 72.8777,
        radius_meters: 450.4,
      },
    };
    const cleaned = cleanSettings(s);
    expect(cleaned.geofence.site_name).toBe('Mumbai Community Center');
    expect(cleaned.geofence.radius_meters).toBe(450);
    expect(cleaned.geofence.latitude).toBe(19.076);
    expect(cleaned.geofence.longitude).toBe(72.8777);
  });

  it('persists and loads geofence settings successfully', async () => {
    const custom: OrgSettings = {
      ...DEFAULT_SETTINGS,
      geofence: {
        enabled: true,
        site_name: 'Bengaluru Field Office',
        latitude: 12.9716,
        longitude: 77.5946,
        radius_meters: 800,
      },
    };

    const saveRes = await saveSettings(custom);
    expect(saveRes.ok).toBe(true);

    const loadRes = await loadSettings();
    expect(loadRes.settings.geofence.site_name).toBe('Bengaluru Field Office');
    expect(loadRes.settings.geofence.latitude).toBeCloseTo(12.9716);
    expect(loadRes.settings.geofence.longitude).toBeCloseTo(77.5946);
    expect(loadRes.settings.geofence.radius_meters).toBe(800);
    expect(loadRes.settings.geofence.enabled).toBe(true);
  });
});
