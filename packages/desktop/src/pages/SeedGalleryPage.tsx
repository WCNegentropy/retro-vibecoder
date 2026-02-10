import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isTauri } from '../hooks/useTauriGenerate';
import type { SeedEntry, Archetype, Language, Runtime, TechStack } from '../types';

/**
 * Seed Gallery Page
 *
 * Browse pre-validated seeds from sweeper runs:
 * - Filter by archetype, language, framework
 * - View stack configurations
 * - Quick generate from any seed
 * - Run sweeper to discover new seeds
 */

// Response type from Tauri backend (uses camelCase from serde)
interface SeedEntryResponse {
  seed: number;
  stack: TechStack | Record<string, string>;
  files: string[];
  validatedAt: string;
  tags: string[];
}

// Convert backend response to frontend type
function convertSeedEntry(entry: SeedEntryResponse): SeedEntry {
  const stack = entry.stack as Record<string, string>;
  return {
    seed: entry.seed,
    stack: {
      archetype: (stack.archetype || 'backend') as Archetype,
      language: (stack.language || 'typescript') as Language,
      runtime: (stack.runtime || 'node') as Runtime,
      framework: stack.framework || '',
      database: (stack.database || 'none') as SeedEntry['stack']['database'],
      orm: stack.orm || 'none',
      transport: stack.transport || 'rest',
      packaging: (stack.packaging || 'none') as SeedEntry['stack']['packaging'],
      cicd: (stack.cicd || 'github-actions') as SeedEntry['stack']['cicd'],
      buildTool: stack.buildTool || stack.build_tool || '',
      styling: stack.styling || 'none',
      testing: stack.testing || '',
    },
    files: entry.files,
    validatedAt: entry.validatedAt,
    tags: entry.tags,
  };
}

const ALL_LANGUAGES: Language[] = [
  'typescript',
  'javascript',
  'python',
  'rust',
  'go',
  'java',
  'kotlin',
  'swift',
  'csharp',
  'cpp',
  'ruby',
  'php',
];

function SeedGalleryPage() {
  const navigate = useNavigate();
  const [seeds, setSeeds] = useState<SeedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterArchetype, setFilterArchetype] = useState<Archetype | 'all'>('all');
  const [filterLanguage, setFilterLanguage] = useState<Language | 'all'>('all');
  const [selectedSeed, setSelectedSeed] = useState<SeedEntry | null>(null);
  const [isRunningSweeper, setIsRunningSweeper] = useState(false);
  const [sweeperCount, setSweeperCount] = useState(10);

  // Load seeds from registry
  const fetchSeeds = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');
        const result = await invoke<SeedEntryResponse[]>('get_seeds');
        setSeeds(result.map(convertSeedEntry));
      } else {
        setError('Seed gallery requires Tauri environment. Run the desktop app to see real seeds.');
        setSeeds([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load seeds';
      setError(message);
      setSeeds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeeds();
  }, [fetchSeeds]);

  // Run sweeper to discover new seeds
  const handleRunSweeper = useCallback(async () => {
    if (!isTauri()) {
      setError('Sweeper requires Tauri environment');
      return;
    }

    setIsRunningSweeper(true);
    setError(null);

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke<SeedEntryResponse[]>('run_sweeper', {
        count: sweeperCount,
        startSeed: null,
        validate: false,
      });

      // Re-fetch the full seed list to pick up newly discovered seeds
      await fetchSeeds();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sweeper failed';
      setError(message);
    } finally {
      setIsRunningSweeper(false);
    }
  }, [sweeperCount, fetchSeeds]);

  // Filter seeds
  const filteredSeeds = seeds.filter(entry => {
    const matchesArchetype = filterArchetype === 'all' || entry.stack.archetype === filterArchetype;
    const matchesLanguage = filterLanguage === 'all' || entry.stack.language === filterLanguage;
    return matchesArchetype && matchesLanguage;
  });

  // Get unique values for filters — always show all archetypes
  const ALL_ARCHETYPES: Archetype[] = [
    'backend',
    'web',
    'cli',
    'mobile',
    'library',
    'desktop',
    'game',
  ];
  const languages = ALL_LANGUAGES;

  const handleUseSeed = (seed: number) => {
    navigate(`/seed?seed=${seed}`);
  };

  if (isLoading) {
    return (
      <div className="page seed-gallery-page">
        <div className="loading">Loading seed gallery...</div>
      </div>
    );
  }

  return (
    <div className="page seed-gallery-page">
      <header className="page-header">
        <h1>Seed Gallery</h1>
        <p className="subtitle">Browse pre-validated project seeds discovered by the sweeper</p>
      </header>

      {error && (
        <div
          className="error-banner"
          style={{
            marginBottom: '16px',
            padding: '12px',
            background: 'var(--win95-bg)',
            border: '2px solid var(--bevel-dark)',
          }}
        >
          <strong>Note:</strong> {error}
        </div>
      )}

      {/* Sweeper Controls */}
      <div
        className="sweeper-controls"
        style={{
          marginBottom: '16px',
          padding: '12px',
          background: 'var(--win95-bg)',
          border: '2px inset var(--bevel-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontWeight: 'bold' }}>Discover Seeds:</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          Count:
          <input
            type="number"
            min={1}
            max={100}
            value={sweeperCount}
            onChange={e =>
              setSweeperCount(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 10)))
            }
            className="form-input"
            style={{ width: '60px' }}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleRunSweeper}
          disabled={isRunningSweeper || !isTauri()}
        >
          {isRunningSweeper ? 'Running Sweeper...' : 'Run Sweeper'}
        </button>
        <span style={{ fontSize: '10px', color: 'var(--bevel-dark)' }}>
          {seeds.length} seeds in registry
        </span>
      </div>

      <div className="gallery-controls">
        <div className="filter-group">
          <label className="form-label">Archetype</label>
          <select
            className="form-select"
            value={filterArchetype}
            onChange={e => setFilterArchetype(e.target.value as Archetype | 'all')}
          >
            <option value="all">All Archetypes</option>
            {ALL_ARCHETYPES.map(arch => (
              <option key={arch} value={arch}>
                {arch}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="form-label">Language</label>
          <select
            className="form-select"
            value={filterLanguage}
            onChange={e => setFilterLanguage(e.target.value as Language | 'all')}
          >
            <option value="all">All Languages</option>
            {languages.map(lang => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <div className="result-count">
          {filteredSeeds.length} seed{filteredSeeds.length !== 1 ? 's' : ''} found
        </div>
      </div>

      <div className="gallery-layout">
        <div className="seed-grid">
          {filteredSeeds.length === 0 ? (
            <div
              className="no-results"
              style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}
            >
              {seeds.length === 0 ? (
                <>
                  <p style={{ marginBottom: '12px' }}>No seeds in registry yet.</p>
                  <p style={{ fontSize: '11px', color: 'var(--bevel-dark)' }}>
                    Click "Run Sweeper" above to discover valid seed configurations.
                  </p>
                </>
              ) : (
                <p>No seeds match your filter criteria.</p>
              )}
            </div>
          ) : (
            filteredSeeds.map(entry => (
              <SeedCard
                key={entry.seed}
                entry={entry}
                isSelected={selectedSeed?.seed === entry.seed}
                onSelect={() => setSelectedSeed(entry)}
                onUse={() => handleUseSeed(entry.seed)}
              />
            ))
          )}
        </div>

        {selectedSeed && (
          <aside className="seed-details">
            <h2>Seed #{selectedSeed.seed}</h2>
            <div className="stack-details">
              <h3>Tech Stack</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Archetype</span>
                  <span className="value">{selectedSeed.stack.archetype}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Language</span>
                  <span className="value">{selectedSeed.stack.language}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Framework</span>
                  <span className="value">{selectedSeed.stack.framework}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Runtime</span>
                  <span className="value">{selectedSeed.stack.runtime}</span>
                </div>
                {selectedSeed.stack.database !== 'none' && (
                  <div className="detail-item">
                    <span className="label">Database</span>
                    <span className="value">{selectedSeed.stack.database}</span>
                  </div>
                )}
                {selectedSeed.stack.packaging !== 'none' && (
                  <div className="detail-item">
                    <span className="label">Packaging</span>
                    <span className="value">{selectedSeed.stack.packaging}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="files-list">
              <h3>Generated Files</h3>
              <ul className="file-tree">
                {selectedSeed.files.map(file => (
                  <li key={file} className="file">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
            <div className="seed-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleUseSeed(selectedSeed.seed)}
              >
                Use This Seed
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Seed card component
 */
function SeedCard({
  entry,
  isSelected,
  onSelect,
  onUse,
}: {
  entry: SeedEntry;
  isSelected: boolean;
  onSelect: () => void;
  onUse: () => void;
}) {
  return (
    <div className={`seed-card ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="seed-header">
        <code className="seed-number">#{entry.seed}</code>
        <span className="archetype-badge">{entry.stack.archetype}</span>
      </div>
      <div className="seed-stack">
        <span className="language">{entry.stack.language}</span>
        <span className="separator">+</span>
        <span className="framework">{entry.stack.framework}</span>
      </div>
      <div className="seed-tags">
        {entry.tags.slice(0, 3).map(tag => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={e => {
          e.stopPropagation();
          onUse();
        }}
      >
        Use
      </button>
    </div>
  );
}

export default SeedGalleryPage;
