import { useState, useCallback } from 'react';
import Preview from '../components/Preview';
import { useTauriGenerate } from '../hooks/useTauriGenerate';
import type { TechStack } from '../types';

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
  const [seed, setSeed] = useState<string>('82910');
  const [outputPath, setOutputPath] = useState<string>('./generated-project');
  const [previewStack, setPreviewStack] = useState<TechStack | null>(null);
  const [previewFiles, setPreviewFiles] = useState<Record<string, string>>({});

  const { generate, preview, isLoading, error } = useTauriGenerate();

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
    const result = await preview({
      mode: 'procedural',
      seed: parseInt(seed, 10),
      output_path: outputPath,
    });
    if (result) {
      setPreviewStack(result.stack || null);
      setPreviewFiles(result.files || {});
    }
  }, [seed, outputPath, preview]);

  const handleGenerate = useCallback(async () => {
    if (!seed) return;
    await generate({
      mode: 'procedural',
      seed: parseInt(seed, 10),
      output_path: outputPath,
    });
  }, [seed, outputPath, generate]);

  return (
    <div className="page seed-generator-page">
      <header className="page-header">
        <h1>Seed Generator</h1>
        <p className="subtitle">Enter a seed number to generate a deterministic project</p>
      </header>

      <div className="grid-2">
        <section className="generator-form card">
          <h2 className="card-title">Configuration</h2>

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
        </section>

        <section className="preview-section">
          {previewStack && (
            <div className="card stack-preview">
              <h2 className="card-title">Stack Preview</h2>
              <StackDisplay stack={previewStack} />
            </div>
          )}

          {Object.keys(previewFiles).length > 0 && (
            <div className="card files-preview">
              <h2 className="card-title">Generated Files</h2>
              <Preview files={previewFiles} />
            </div>
          )}

          {!previewStack && (
            <div className="card empty-preview">
              <p>Enter a seed and click "Preview Stack" to see what will be generated.</p>
            </div>
          )}
        </section>
      </div>

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
