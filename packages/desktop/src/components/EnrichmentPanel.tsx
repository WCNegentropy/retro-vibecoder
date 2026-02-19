import { useState, useCallback } from 'react';
import type { EnrichmentConfig, EnrichmentDepth } from '../types';

interface EnrichmentPanelProps {
  config: EnrichmentConfig;
  onChange: (config: EnrichmentConfig) => void;
}

const DEPTH_OPTIONS: { id: EnrichmentDepth; name: string; description: string }[] = [
  { id: 'minimal', name: 'Minimal', description: 'CI/CD, linting, env files, docs' },
  { id: 'standard', name: 'Standard', description: 'All minimal + logic fill, tests, Docker' },
  { id: 'full', name: 'Full', description: 'Everything at maximum depth' },
];

const FLAG_OPTIONS: { key: keyof EnrichmentConfig; label: string; minDepth: EnrichmentDepth }[] = [
  { key: 'cicd', label: 'CI/CD Workflows', minDepth: 'minimal' },
  { key: 'linting', label: 'Linting & Formatting', minDepth: 'minimal' },
  { key: 'envFiles', label: 'Environment Files', minDepth: 'minimal' },
  { key: 'docs', label: 'Documentation', minDepth: 'minimal' },
  { key: 'release', label: 'Release Automation', minDepth: 'standard' },
  { key: 'fillLogic', label: 'Logic Fill (routes, models)', minDepth: 'standard' },
  { key: 'tests', label: 'Test Generation', minDepth: 'standard' },
  { key: 'dockerProd', label: 'Docker Production', minDepth: 'standard' },
];

/**
 * EnrichmentPanel — controls for Pass 2 enrichment configuration.
 * Renders as a collapsible section with depth selector and per-flag toggles.
 */
function EnrichmentPanel({ config, onChange }: EnrichmentPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggle = useCallback(() => {
    onChange({ ...config, enabled: !config.enabled });
  }, [config, onChange]);

  const handleDepthChange = useCallback(
    (depth: EnrichmentDepth) => {
      // Reset individual overrides when changing depth
      onChange({
        enabled: config.enabled,
        depth,
      });
    },
    [config.enabled, onChange]
  );

  const handleFlagChange = useCallback(
    (key: keyof EnrichmentConfig, value: boolean) => {
      onChange({ ...config, [key]: value });
    },
    [config, onChange]
  );

  return (
    <div className="win95-window" style={{ marginTop: '1rem' }}>
      <div className="win95-window-title">
        <span className="win95-window-title-icon">+</span>
        Pass 2 Enrichment
      </div>
      <div className="win95-window-content">
        {/* Master toggle */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}
        >
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <input type="checkbox" checked={config.enabled} onChange={handleToggle} />
            <strong>Enable Enrichment</strong>
          </label>
          <span style={{ fontSize: '0.8rem', color: 'var(--bevel-dark)' }}>
            Add CI/CD, tests, logic, docs, and more
          </span>
        </div>

        {config.enabled && (
          <>
            {/* Depth selector */}
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block' }}>
                Depth Preset
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {DEPTH_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`btn ${config.depth === opt.id ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handleDepthChange(opt.id)}
                    title={opt.description}
                    style={{ flex: 1, fontSize: '0.85rem' }}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
              <p className="form-help" style={{ marginTop: '0.25rem' }}>
                {DEPTH_OPTIONS.find(o => o.id === config.depth)?.description}
              </p>
            </div>

            {/* Advanced toggle */}
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--bevel-dark)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                padding: '0.25rem 0',
                textDecoration: 'underline',
              }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '- Hide individual flags' : '+ Show individual flags'}
            </button>

            {/* Individual flag overrides */}
            {showAdvanced && (
              <div
                style={{
                  marginTop: '0.5rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.25rem 1rem',
                }}
              >
                {FLAG_OPTIONS.map(flag => {
                  const value = config[flag.key];
                  const isDefaultOn = isDepthDefault(config.depth, flag.minDepth);
                  const checked = value !== undefined ? !!value : isDefaultOn;

                  return (
                    <label
                      key={flag.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => handleFlagChange(flag.key, e.target.checked)}
                      />
                      {flag.label}
                    </label>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Check if a flag is enabled by default at the given depth */
function isDepthDefault(depth: EnrichmentDepth, minDepth: EnrichmentDepth): boolean {
  const order: EnrichmentDepth[] = ['minimal', 'standard', 'full'];
  return order.indexOf(depth) >= order.indexOf(minDepth);
}

export default EnrichmentPanel;

/** Create a default EnrichmentConfig */
export function createDefaultEnrichmentConfig(): EnrichmentConfig {
  return {
    enabled: false,
    depth: 'standard',
  };
}
