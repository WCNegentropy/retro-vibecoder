import { useState, useEffect } from 'react';

/**
 * Settings Page
 *
 * Application settings and customization options:
 * - RGB border animation speed and style
 * - Theme preferences
 * - Generation defaults
 * - Output directory preferences
 */

interface Settings {
  // Appearance
  rgbSpeed: number;
  rgbEnabled: boolean;
  theme: 'win95' | 'synthwave' | 'terminal' | 'custom';
  showScanlines: boolean;

  // Generation Defaults
  defaultOutputDir: string;
  defaultArchetype: string;
  defaultLanguage: string;
  autoPreview: boolean;
  verboseOutput: boolean;

  // CLI Integration
  cliPath: string;
  nodeRuntime: 'node' | 'bun' | 'deno';

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
  cliPath: 'upg',
  nodeRuntime: 'node',
  autoValidate: false,
  validationTimeout: 300,
};

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('upg-settings');
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  // Apply RGB speed to CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--rgb-speed', `${settings.rgbSpeed}s`);
    if (!settings.rgbEnabled) {
      document.documentElement.style.setProperty('--rgb-speed', '0s');
    }
  }, [settings.rgbSpeed, settings.rgbEnabled]);

  const handleChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('upg-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('upg-settings');
    setSaved(false);
  };

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
                <option value="custom">Custom (coming soon)</option>
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

        {/* CLI Integration */}
        <section className="win95-window">
          <div className="win95-window-title">
            <span className="win95-window-title-icon">&gt;</span>
            CLI Integration
          </div>
          <div className="win95-window-content">
            <div className="form-group">
              <label className="form-label" htmlFor="cli-path">
                CLI Path
              </label>
              <input
                id="cli-path"
                type="text"
                className="form-input"
                value={settings.cliPath}
                onChange={e => handleChange('cliPath', e.target.value)}
                placeholder="upg"
              />
              <p className="form-help">Path to the UPG CLI executable</p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="node-runtime">
                Node.js Runtime
              </label>
              <select
                id="node-runtime"
                className="form-select"
                value={settings.nodeRuntime}
                onChange={e => handleChange('nodeRuntime', e.target.value as Settings['nodeRuntime'])}
              >
                <option value="node">Node.js</option>
                <option value="bun">Bun</option>
                <option value="deno">Deno</option>
              </select>
              <p className="form-help">Runtime used for procedural generation engine</p>
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
                onChange={e => handleChange('validationTimeout', parseInt(e.target.value, 10) || 300)}
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
            <p style={{ marginBottom: '8px' }}>Version 0.1.0 (Phase 2: Generic Engine)</p>
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
