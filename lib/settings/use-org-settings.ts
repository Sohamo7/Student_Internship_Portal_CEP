'use client';

import { useEffect, useState } from 'react';
import { OrgSettings, loadSettings, normalizeSettings } from '@/lib/settings/settings-service';

/** Loads saved NGO settings. `loaded` is false until the first read finishes. */
export function useOrgSettings(): { settings: OrgSettings; loaded: boolean } {
  const [settings, setSettings] = useState<OrgSettings>(() => normalizeSettings(null));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSettings()
      .then((result) => {
        if (!cancelled) setSettings(result.settings);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loaded };
}
