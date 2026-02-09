import { useState, useEffect, useCallback } from 'react';
import { isTauri } from '../hooks/useTauriGenerate';

/**
 * Settings Page
 *
 * Application settings and customization options:
 * - RGB border animation speed and style
 * - Theme preferences
 * - Generation defaults
 * - Output directory preferences
 *
 * Settings are persisted via Tauri's store plugin (electron-store equivalent).
 * Falls back to localStorage when running outside Tauri (dev browser mode).
 */

interface Settings {
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

const DEFAULT_SETTINGS: Settings = {
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
async function loadSettings(): Promise<Settings> {
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
async function saveSettings(settings: Settings): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    for (const [key, value] of Object.entries(settings)) {
      await invoke('set_setting', { key, value });
    }
  } else {
    localStorage.setItem('upg-settings', JSON.stringify(settings));
  }
}

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  // Apply RGB speed to CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--rgb-speed', `${settings.rgbSpeed}s`);
    if (!settings.rgbEnabled) {
      document.documentElement.style.setProperty('--rgb-speed', '0s');
    }

    // Toggle RGB disabled class
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      if (settings.rgbEnabled) {
        appContainer.classList.remove('rgb-disabled');
      } else {
        appContainer.classList.add('rgb-disabled');
      }
    }
  }, [settings.rgbSpeed, settings.rgbEnabled]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    // Remove existing theme classes
    root.classList.remove('theme-win95', 'theme-synthwave', 'theme-terminal');
    // Add the selected theme class (win95 is the default, no class needed)
    if (settings.theme !== 'win95') {
      root.classList.add(`theme-${settings.theme}`);
    }
  }, [settings.theme]);

  // Apply scanlines effect
  useEffect(() => {
    const root = document.documentElement;
    if (settings.showScanlines) {
      root.classList.add('scanlines-enabled');
    } else {
      root.classList.remove('scanlines-enabled');
    }
  }, [settings.showScanlines]);

  const handleChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = useCallback(async () => {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  const handleReset = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await saveSettings(DEFAULT_SETTINGS);
    setSaved(false);
  }, []);

  return (
    <div className="page settings-page">
      <header className="page-header">
        <h1>Settings</h1>
        <p className="subtitle">Customize UPG Desktop appearance and behavior</p>
      </header>

      <div className="grid-2">
        {/* Appearance Settings */}
        <section className="win95-window">
          <div className="win95-window-title">
            <span className="win95-window-title-icon">*</span>
            Appearance
          </div>
          <div className="win95-window-content">
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={settings.rgbEnabled}
                  onChange={e => handleChange('rgbEnabled', e.target.checked)}
                />
                Enable RGB Rainbow Border
              </label>
              <p className="form-help">Animated rainbow border around the application window</p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="rgb-speed">
                RGB Animation Speed: {settings.rgbSpeed}s
              </label>
              <input
                id="rgb-speed"
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={settings.rgbSpeed}
                onChange={e => handleChange('rgbSpeed', parseFloat(e.target.value))}
                style={{ width: '100%' }}
                disabled={!settings.rgbEnabled}
              />
              <p className="form-help">Lower = faster animation (1s-10s cycle)</p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="theme">
                Theme
              </label>
              <select
                id="theme"
                className="form-select"
                value={settings.theme}
                onChange={e => handleChange('theme', e.target.value as Settings['theme'])}
              >
                <option value="win95">Windows 95 Classic</option>
                <option value="synthwave">Synthwave Night</option>
                <option value="terminal">Terminal Green</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={settings.showScanlines}
                  onChange={e => handleChange('showScanlines', e.target.checked)}
                />
                Show CRT Scanline Effect
              </label>
              <p className="form-help">Subtle scanline overlay for retro aesthetic</p>
            </div>
          </div>
        </section>

        {/* Generation Defaults */}
        <section className="win95-window">
          <div className="win95-window-title">
            <span className="win95-window-title-icon">#</span>
            Generation Defaults
          </div>
          <div className="win95-window-content">
            <div className="form-group">
              <label className="form-label" htmlFor="default-output">
                Default Output Directory
              </label>
              <input
                id="default-output"
                type="text"
                className="form-input"
                value={settings.defaultOutputDir}
                onChange={e => handleChange('defaultOutputDir', e.target.value)}
                placeholder="./generated-project"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="default-archetype">
                Preferred Archetype
              </label>
              <select
                id="default-archetype"
                className="form-select"
                value={settings.defaultArchetype}
                onChange={e => handleChange('defaultArchetype', e.target.value)}
              >
                <option value="">No preference</option>
                <option value="backend">Backend API</option>
                <option value="web">Web App</option>
                <option value="cli">CLI Tool</option>
                <option value="mobile">Mobile App</option>
                <option value="library">Library</option>
                <option value="desktop">Desktop App</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="default-language">
                Preferred Language
              </label>
              <select
                id="default-language"
                className="form-select"
                value={settings.defaultLanguage}
                onChange={e => handleChange('defaultLanguage', e.target.value)}
              >
                <option value="">No preference</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={settings.autoPreview}
                  onChange={e => handleChange('autoPreview', e.target.checked)}
                />
                Auto-preview on seed change
              </label>
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={settings.verboseOutput}
                  onChange={e => handleChange('verboseOutput', e.target.checked)}
                />
                Verbose generation output
              </label>
            </div>
          </div>
        </section>

        {/* Validation */}
        <section className="win95-window">
          <div className="win95-window-title">
            <span className="win95-window-title-icon">!</span>
            Validation
          </div>
          <div className="win95-window-content">
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={settings.autoValidate}
                  onChange={e => handleChange('autoValidate', e.target.checked)}
                />
                Auto-validate generated projects
              </label>
              <p className="form-help">
                Run build/test validation after generation (requires Docker)
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="validation-timeout">
                Validation Timeout (seconds)
              </label>
              <input
                id="validation-timeout"
                type="number"
                className="form-input"
                value={settings.validationTimeout}
                onChange={e =>
                  handleChange('validationTimeout', parseInt(e.target.value, 10) || 300)
                }
                min={60}
                max={600}
              />
              <p className="form-help">Maximum time for validation pipeline (60-600s)</p>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="form-actions" style={{ marginTop: '16px' }}>
        <button type="button" className="btn" onClick={handleReset}>
          Reset to Defaults
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* About Section */}
      <section className="win95-window" style={{ marginTop: '24px' }}>
        <div className="win95-window-title">
          <span className="win95-window-title-icon">?</span>
          About UPG Desktop
        </div>
        <div className="win95-window-content">
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-retro)', fontSize: '18px', marginBottom: '12px' }}>
              Universal Project Generator
            </h2>
            <p style={{ marginBottom: '8px' }}>Version 0.1.0</p>
            <p style={{ fontSize: '10px', color: 'var(--bevel-dark)', marginBottom: '16px' }}>
              Transform integers into software
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <span className="stack-badge">Tauri v2</span>
              <span className="stack-badge">React 18</span>
              <span className="stack-badge">TypeScript</span>
              <span className="stack-badge">Rust</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
