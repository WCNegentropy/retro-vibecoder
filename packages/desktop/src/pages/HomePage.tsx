import { Link, useNavigate } from 'react-router-dom';

/**
 * Home page - entry point for the UPG Desktop application
 *
 * v2 supports procedural mode only (seed → stack → files).
 * - Procedural Mode: Seed generator, Stack composer
 *
 * Features Windows 95 retro styling with RGB accents
 */
function HomePage() {
  const navigate = useNavigate();

  const handleQuickSeed = (seed: number) => {
    navigate(`/seed?seed=${seed}`);
  };

  return (
    <div className="page home-page">
      <header className="page-header">
        <h1>Retro-Vibecoder UPG</h1>
        <p className="subtitle">Transform integers into software</p>
      </header>

      <section className="mode-selector">
        {/* Procedural Mode Card */}
        <div className="mode-card">
          <div className="mode-card-header">
            <span className="icon">#</span>
            Procedural Generation
          </div>
          <div className="mode-card-body">
            <p>Generate projects from seed numbers or compose custom tech stacks</p>
            <div className="mode-actions">
              <Link to="/seed" className="btn btn-primary">
                Seed Generator
              </Link>
              <Link to="/compose" className="btn btn-secondary">
                Stack Composer
              </Link>
              <Link to="/gallery" className="btn btn-outline">
                Browse Seeds
              </Link>
            </div>
            <div className="mode-features">
              <ul>
                <li>Deterministic generation from seed numbers</li>
                <li>Interactive stack composition wizard</li>
                <li>Constraint-validated combinations</li>
                <li>40+ technology strategies (Tier 1-7)</li>
                <li>Pre-validated seed gallery</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Template Mode Card */}
        <div className="mode-card">
          <div className="mode-card-header">
            <span className="icon">T</span>
            Template Generation
          </div>
          <div className="mode-card-body">
            <p>Generate projects from UPG manifest templates using Nunjucks</p>
            <div className="mode-actions">
              <Link to="/templates" className="btn btn-primary">
                Browse Templates
              </Link>
            </div>
            <div className="mode-features">
              <ul>
                <li>Declarative YAML manifests</li>
                <li>Nunjucks template engine</li>
                <li>Custom variables and prompts</li>
                <li>Tag-based filtering</li>
                <li>Manifest preview and validation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="quick-start">
        <div className="quick-start-header">Quick Start - Try a Seed</div>
        <div className="quick-start-body">
          <div className="quick-actions">
            <button type="button" className="quick-action" onClick={() => handleQuickSeed(82910)}>
              <code>82910</code>
              <span className="action-result">Rust + Axum + PostgreSQL + Docker</span>
              <span className="btn btn-sm btn-outline action-btn">Use</span>
            </button>
            <button type="button" className="quick-action" onClick={() => handleQuickSeed(10455)}>
              <code>10455</code>
              <span className="action-result">Go + Cobra CLI tool</span>
              <span className="btn btn-sm btn-outline action-btn">Use</span>
            </button>
            <button type="button" className="quick-action" onClick={() => handleQuickSeed(99123)}>
              <code>99123</code>
              <span className="action-result">Python + FastAPI + MongoDB</span>
              <span className="btn btn-sm btn-outline action-btn">Use</span>
            </button>
            <button type="button" className="quick-action" onClick={() => handleQuickSeed(55782)}>
              <code>55782</code>
              <span className="action-result">React + Vite + TypeScript + Tailwind</span>
              <span className="btn btn-sm btn-outline action-btn">Use</span>
            </button>
          </div>
        </div>
      </section>

      {/* CLI Commands Banner */}
      <section className="win95-window" style={{ marginTop: '16px' }}>
        <div className="win95-window-title">
          <span className="win95-window-title-icon">&gt;</span>
          Command Line Interface
        </div>
        <div className="win95-window-content">
          <p style={{ marginBottom: '12px', fontSize: '11px' }}>
            All features are also available via the CLI. Access full command options in the GUI:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <code
              style={{
                background: 'var(--win95-black)',
                color: 'var(--synth-cyan)',
                padding: '4px 8px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              upg seed 82910
            </code>
            <code
              style={{
                background: 'var(--win95-black)',
                color: 'var(--synth-cyan)',
                padding: '4px 8px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              upg sweep --count 100
            </code>
            <code
              style={{
                background: 'var(--win95-black)',
                color: 'var(--synth-cyan)',
                padding: '4px 8px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              upg generate react-starter
            </code>
          </div>
          <div style={{ marginTop: '12px' }}>
            <Link to="/cli" className="btn btn-outline">
              Open CLI Commands Panel
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
