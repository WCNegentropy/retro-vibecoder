import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SeedEntry, Archetype, Language } from '../types';

/**
 * Seed Gallery Page
 *
 * Browse pre-validated seeds from sweeper runs:
 * - Filter by archetype, language, framework
 * - View stack configurations
 * - Quick generate from any seed
 */

// Mock seed entries for development
const MOCK_SEEDS: SeedEntry[] = [
  {
    seed: 82910,
    stack: {
      archetype: 'backend',
      language: 'rust',
      runtime: 'native',
      framework: 'axum',
      database: 'postgres',
      orm: 'diesel',
      transport: 'rest',
      packaging: 'docker',
      cicd: 'github-actions',
      buildTool: 'cargo',
      styling: 'none',
      testing: 'rust-test',
    },
    files: ['Cargo.toml', 'src/main.rs', 'Dockerfile', '.github/workflows/ci.yml'],
    validatedAt: '2026-01-15T10:00:00Z',
    tags: ['rust', 'axum', 'postgres', 'docker'],
  },
  {
    seed: 10455,
    stack: {
      archetype: 'cli',
      language: 'go',
      runtime: 'native',
      framework: 'cobra',
      database: 'none',
      orm: 'none',
      transport: 'rest',
      packaging: 'none',
      cicd: 'github-actions',
      buildTool: 'make',
      styling: 'none',
      testing: 'go-test',
    },
    files: ['go.mod', 'main.go', 'cmd/root.go', 'Makefile'],
    validatedAt: '2026-01-15T10:00:00Z',
    tags: ['go', 'cobra', 'cli'],
  },
  {
    seed: 99123,
    stack: {
      archetype: 'backend',
      language: 'python',
      runtime: 'native',
      framework: 'fastapi',
      database: 'mongodb',
      orm: 'none',
      transport: 'rest',
      packaging: 'docker',
      cicd: 'github-actions',
      buildTool: 'make',
      styling: 'none',
      testing: 'pytest',
    },
    files: ['pyproject.toml', 'app/main.py', 'Dockerfile', 'tests/test_main.py'],
    validatedAt: '2026-01-15T10:00:00Z',
    tags: ['python', 'fastapi', 'mongodb', 'docker'],
  },
  {
    seed: 55782,
    stack: {
      archetype: 'web',
      language: 'typescript',
      runtime: 'browser',
      framework: 'react',
      database: 'none',
      orm: 'none',
      transport: 'rest',
      packaging: 'docker',
      cicd: 'github-actions',
      buildTool: 'vite',
      styling: 'tailwind',
      testing: 'vitest',
    },
    files: ['package.json', 'src/App.tsx', 'vite.config.ts', 'tailwind.config.js'],
    validatedAt: '2026-01-15T10:00:00Z',
    tags: ['typescript', 'react', 'vite', 'tailwind'],
  },
  {
    seed: 44128,
    stack: {
      archetype: 'backend',
      language: 'java',
      runtime: 'jvm',
      framework: 'spring-boot',
      database: 'mysql',
      orm: 'none',
      transport: 'rest',
      packaging: 'docker',
      cicd: 'github-actions',
      buildTool: 'gradle',
      styling: 'none',
      testing: 'junit',
    },
    files: ['build.gradle', 'src/main/java/Application.java', 'Dockerfile'],
    validatedAt: '2026-01-15T10:00:00Z',
    tags: ['java', 'spring-boot', 'mysql', 'gradle'],
  },
  {
    seed: 33411,
    stack: {
      archetype: 'mobile',
      language: 'typescript',
      runtime: 'native',
      framework: 'react-native',
      database: 'none',
      orm: 'none',
      transport: 'rest',
      packaging: 'none',
      cicd: 'github-actions',
      buildTool: 'vite',
      styling: 'none',
      testing: 'jest',
    },
    files: ['package.json', 'app.json', 'App.tsx', 'babel.config.js'],
    validatedAt: '2026-01-15T10:00:00Z',
    tags: ['typescript', 'react-native', 'expo', 'mobile'],
  },
];

function SeedGalleryPage() {
  const navigate = useNavigate();
  const [seeds, setSeeds] = useState<SeedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterArchetype, setFilterArchetype] = useState<Archetype | 'all'>('all');
  const [filterLanguage, setFilterLanguage] = useState<Language | 'all'>('all');
  const [selectedSeed, setSelectedSeed] = useState<SeedEntry | null>(null);

  // Load seeds
  useEffect(() => {
    setTimeout(() => {
      setSeeds(MOCK_SEEDS);
      setIsLoading(false);
    }, 300);
  }, []);

  // Filter seeds
  const filteredSeeds = seeds.filter((entry) => {
    const matchesArchetype = filterArchetype === 'all' || entry.stack.archetype === filterArchetype;
    const matchesLanguage = filterLanguage === 'all' || entry.stack.language === filterLanguage;
    return matchesArchetype && matchesLanguage;
  });

  // Get unique values for filters
  const archetypes = Array.from(new Set(seeds.map((s) => s.stack.archetype)));
  const languages = Array.from(new Set(seeds.map((s) => s.stack.language)));

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

      <div className="gallery-controls">
        <div className="filter-group">
          <label className="form-label">Archetype</label>
          <select
            className="form-select"
            value={filterArchetype}
            onChange={(e) => setFilterArchetype(e.target.value as Archetype | 'all')}
          >
            <option value="all">All Archetypes</option>
            {archetypes.map((arch) => (
              <option key={arch} value={arch}>{arch}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="form-label">Language</label>
          <select
            className="form-select"
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value as Language | 'all')}
          >
            <option value="all">All Languages</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        <div className="result-count">
          {filteredSeeds.length} seed{filteredSeeds.length !== 1 ? 's' : ''} found
        </div>
      </div>

      <div className="gallery-layout">
        <div className="seed-grid">
          {filteredSeeds.map((entry) => (
            <SeedCard
              key={entry.seed}
              entry={entry}
              isSelected={selectedSeed?.seed === entry.seed}
              onSelect={() => setSelectedSeed(entry)}
              onUse={() => handleUseSeed(entry.seed)}
            />
          ))}
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
                {selectedSeed.files.map((file) => (
                  <li key={file} className="file">{file}</li>
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
        {entry.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={(e) => {
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
