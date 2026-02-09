import { useState, useEffect } from 'react';
import { isTauri } from './useTauriGenerate';

/**
 * Settings interface — shared between SettingsPage and consumer hooks
 */
export interface Settings {
  // Appearance
  rgbSpeed: number;
  rgbEnabled: boolean;
  theme: 'win95' | 'synthwave' | 'terminal';
  showScanlines: boolean;

  // Generation Defaults
  defaultOutputDir: string;
  defaultArchetype: string;
  defaultLanguage: string;
  autoPreview: boolean;
  verboseOutput: boolean;

  // Validation
  autoValidate: boolean;
  validationTimeout: number;
}

export const DEFAULT_SETTINGS: Settings = {
  rgbSpeed: 3,
  rgbEnabled: true,
  theme: 'win95',
  showScanlines: true,
  defaultOutputDir: './generated-project',
  defaultArchetype: '',
  defaultLanguage: '',
  autoPreview: true,
  verboseOutput: false,
  autoValidate: false,
  validationTimeout: 300,
};

/**
 * Load settings — uses Tauri store in desktop, localStorage in browser
 */
export async function loadSettings(): Promise<Settings> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const all = await invoke<Record<string, unknown>>('get_all_settings');
      if (all && typeof all === 'object') {
        return { ...DEFAULT_SETTINGS, ...(all as Partial<Settings>) };
      }
    } catch {
      // Fall through to defaults
    }
  } else {
    const stored = localStorage.getItem('upg-settings');
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        // Ignore invalid JSON
      }
    }
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save settings — uses Tauri store in desktop, localStorage in browser
 */
export async function saveSettings(settings: Settings): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    for (const [key, value] of Object.entries(settings)) {
      await invoke('set_setting', { key, value });
    }
  } else {
    localStorage.setItem('upg-settings', JSON.stringify(settings));
  }
}

/**
 * Hook to load persisted settings for use across generation pages.
 *
 * Returns the loaded settings and a loading flag.
 * Settings are loaded once on mount from Tauri store or localStorage.
 */
export function useSettings(): { settings: Settings; isLoaded: boolean } {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings()
      .then(loaded => {
        setSettings(loaded);
      })
      .catch(() => {
        // On error, keep DEFAULT_SETTINGS
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  return { settings, isLoaded };
}
