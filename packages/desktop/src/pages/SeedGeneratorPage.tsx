import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Preview from '../components/Preview';
import { useTauriGenerate } from '../hooks/useTauriGenerate';
import { useSettings } from '../hooks/useSettings';
import { useStatus } from '../hooks/useStatus';
import type { TechStack, GenerationResult } from '../types';

/**
 * Seed Generator Page
 *
 * Allows users to:
 * 1. Enter a seed number to generate a deterministic project
 * 2. Generate a random seed
 * 3. Preview the resulting tech stack
 * 4. Generate the project to a selected output directory
 */
function SeedGeneratorPage() {
  const [searchParams] = useSearchParams();
  const [seed, setSeed] = useState<string>('82910');
  const [outputPath, setOutputPath] = useState<string>('./generated-project');
  const [previewStack, setPreviewStack] = useState<TechStack | null>(null);
  const [previewFiles, setPreviewFiles] = useState<Record<string, string>>({});
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  const { generate, preview, isLoading, error } = useTauriGenerate();
  const { settings, isLoaded: settingsLoaded } = useSettings();
  const { setStatus } = useStatus();

  // Apply persisted settings as defaults once loaded
  useEffect(() => {
    if (settingsLoaded) {
      if (settings.defaultOutputDir) {
        setOutputPath(settings.defaultOutputDir);
      }
    }
  }, [settingsLoaded, settings.defaultOutputDir]);

  // Handle seed from URL query param
  useEffect(() => {
    const seedParam = searchParams.get('seed');
    if (seedParam) {
      setSeed(seedParam);
    }
  }, [searchParams]);

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setSeed(value);
  };

  const handleRandomSeed = useCallback(() => {
    const randomSeed = Math.floor(Math.random() * 100000);
    setSeed(randomSeed.toString());
  }, []);

  const handlePreview = useCallback(async () => {
    if (!seed) return;
    setStatus(`Previewing seed ${seed}...`, 0);
    const result = await preview({
      mode: 'procedural',
      seed: parseInt(seed, 10),
      output_path: outputPath,
    });
    if (result) {
      setPreviewStack(result.stack || null);
      setPreviewFiles(result.files || {});
      const fileCount = Object.keys(result.files || {}).length;
      setStatus(`✓ Preview: ${fileCount} files from seed ${seed}`);
    } else {
      setStatus('Preview failed');
    }
  }, [seed, outputPath, preview, setStatus]);

  const handleGenerate = useCallback(async () => {
    if (!seed) return;
    setGenerationResult(null);
    setStatus(`Generating from seed ${seed}...`, 0);
    const result = await generate({
      mode: 'procedural',
      seed: parseInt(seed, 10),
      output_path: outputPath,
    });
    if (result) {
      setGenerationResult(result);
      if (result.success) {
        setStatus(`✓ Generated ${result.files_generated.length} files in ${result.duration_ms}ms`);
      } else {
        setStatus('Generation failed');
      }
    } else {
      setStatus('Generation failed');
    }
  }, [seed, outputPath, generate, setStatus]);

  return (
    <div className="page seed-generator-page">
      <header className="page-header">
        <h1>Seed Generator</h1>
        <p className="subtitle">Enter a seed number to generate a deterministic project</p>
      </header>

      <div className="grid-2">
        {/* Configuration Panel */}
        <section className="win95-window">
          <div className="win95-window-title">
            <span className="win95-window-title-icon">#</span>
            Configuration
          </div>
          <div className="win95-window-content">
            <div className="form-group">
              <label className="form-label" htmlFor="seed">
                Seed Number
              </label>
              <div className="input-with-action">
                <input
                  id="seed"
                  type="text"
                  className="form-input"
                  value={seed}
                  onChange={handleSeedChange}
                  placeholder="Enter a seed number (e.g., 82910)"
                />
                <button type="button" className="btn btn-outline" onClick={handleRandomSeed}>
                  Random
                </button>
              </div>
              <p className="form-help">
                The same seed always produces the same project configuration.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="output">
                Output Directory
              </label>
              <input
                id="output"
                type="text"
                className="form-input"
                value={outputPath}
                onChange={e => setOutputPath(e.target.value)}
                placeholder="./my-project"
              />
              <p className="form-help">Directory where the project will be generated.</p>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePreview}
                disabled={isLoading || !seed}
              >
                Preview Stack
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={isLoading || !seed}
              >
                {isLoading ? 'Generating...' : 'Generate Project'}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {generationResult && (
              <div
                className={`generation-result ${generationResult.success ? 'success' : 'error'}`}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  border: `2px solid ${generationResult.success ? 'var(--color-success, #4caf50)' : 'var(--color-error, #f44336)'}`,
                  background: generationResult.success
                    ? 'rgba(76, 175, 80, 0.1)'
                    : 'rgba(244, 67, 54, 0.1)',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {generationResult.success ? '✓ Generation Complete!' : '✗ Generation Failed'}
                </div>
                <div style={{ fontSize: '0.9rem' }}>{generationResult.message}</div>
                {generationResult.success && (
                  <>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      <strong>Output:</strong>{' '}
                      <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px' }}>
                        {generationResult.output_path}
                      </code>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong>Files:</strong> {generationResult.files_generated.length} generated
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong>Duration:</strong> {generationResult.duration_ms}ms
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Preview Section */}
        <section className="preview-section">
          {previewStack && (
            <div className="win95-window">
              <div className="win95-window-title">
                <span className="win95-window-title-icon">*</span>
                Stack Preview
              </div>
              <div className="win95-window-content">
                <StackDisplay stack={previewStack} />
              </div>
            </div>
          )}

          {Object.keys(previewFiles).length > 0 && <Preview files={previewFiles} />}

          {!previewStack && (
            <div className="win95-window">
              <div className="win95-window-title">
                <span className="win95-window-title-icon">?</span>
                Preview
              </div>
              <div className="win95-window-content">
                <p style={{ textAlign: 'center', color: 'var(--bevel-dark)', fontStyle: 'italic' }}>
                  Enter a seed and click "Preview Stack" to see what will be generated.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Example Seeds */}
      <section className="seed-examples">
        <h2>Example Seeds</h2>
        <div className="examples-grid">
          <SeedExample
            seed={82910}
            description="Rust + Axum + PostgreSQL + Docker"
            onClick={() => setSeed('82910')}
          />
          <SeedExample
            seed={10455}
            description="Go + Cobra CLI tool"
            onClick={() => setSeed('10455')}
          />
          <SeedExample
            seed={99123}
            description="Python + FastAPI + MongoDB"
            onClick={() => setSeed('99123')}
          />
          <SeedExample
            seed={33411}
            description="React Native (Expo) mobile app"
            onClick={() => setSeed('33411')}
          />
          <SeedExample
            seed={55782}
            description="React + Vite + TypeScript"
            onClick={() => setSeed('55782')}
          />
          <SeedExample
            seed={44128}
            description="Java Spring Boot + MySQL"
            onClick={() => setSeed('44128')}
          />
        </div>
      </section>

      {/* CLI Equivalent */}
      <section className="cli-panel">
        <div className="cli-panel-header">
          <h3>CLI Equivalent</h3>
        </div>
        <div className="cli-panel-body">
          <div className="cli-command">
            <span className="cli-prompt">$</span>
            <span className="cli-text">
              upg seed {seed || '82910'} --output {outputPath}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Display a tech stack configuration
 */
function StackDisplay({ stack }: { stack: TechStack }) {
  return (
    <div className="stack-display">
      <div className="stack-item">
        <span className="stack-label">Archetype</span>
        <span className="stack-value">{stack.archetype}</span>
      </div>
      <div className="stack-item">
        <span className="stack-label">Language</span>
        <span className="stack-value">{stack.language}</span>
      </div>
      <div className="stack-item">
        <span className="stack-label">Framework</span>
        <span className="stack-value">{stack.framework}</span>
      </div>
      <div className="stack-item">
        <span className="stack-label">Runtime</span>
        <span className="stack-value">{stack.runtime}</span>
      </div>
      {stack.database !== 'none' && (
        <div className="stack-item">
          <span className="stack-label">Database</span>
          <span className="stack-value">{stack.database}</span>
        </div>
      )}
      {stack.packaging !== 'none' && (
        <div className="stack-item">
          <span className="stack-label">Packaging</span>
          <span className="stack-value">{stack.packaging}</span>
        </div>
      )}
      {stack.cicd !== 'none' && (
        <div className="stack-item">
          <span className="stack-label">CI/CD</span>
          <span className="stack-value">{stack.cicd}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Seed example card
 */
function SeedExample({
  seed,
  description,
  onClick,
}: {
  seed: number;
  description: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="seed-example" onClick={onClick}>
      <code className="seed-number">{seed}</code>
      <span className="seed-description">{description}</span>
    </button>
  );
}

export default SeedGeneratorPage;
