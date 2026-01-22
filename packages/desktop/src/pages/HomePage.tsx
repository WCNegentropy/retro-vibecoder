import { Link } from 'react-router-dom';

/**
 * Home page - entry point for the UPG Desktop application
 *
 * Provides quick access to both generation modes:
 * - Procedural Mode: Seed generator, Stack composer
 * - Manifest Mode: Template selector
 */
function HomePage() {
  return (
    <div className="page home-page">
      <header className="page-header">
        <h1>Universal Project Generator</h1>
        <p className="subtitle">Transform integers into software</p>
      </header>

      <section className="mode-selector">
        <div className="mode-card procedural">
          <h2>Procedural Mode</h2>
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
              <li>Pre-validated seed gallery</li>
            </ul>
          </div>
        </div>

        <div className="mode-card manifest">
          <h2>Manifest Mode</h2>
          <p>Generate projects from curated UPG manifest templates</p>
          <div className="mode-actions">
            <Link to="/templates" className="btn btn-primary">
              Browse Templates
            </Link>
          </div>
          <div className="mode-features">
            <ul>
              <li>Hand-crafted, opinionated templates</li>
              <li>Dynamic forms from YAML manifests</li>
              <li>Smart Update support</li>
              <li>Copier-powered generation</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="quick-start">
        <h2>Quick Start</h2>
        <div className="quick-actions">
          <div className="quick-action">
            <span className="action-label">Try a seed:</span>
            <code>82910</code>
            <span className="action-result">Rust + Axum + PostgreSQL</span>
          </div>
          <div className="quick-action">
            <span className="action-label">Try a seed:</span>
            <code>10455</code>
            <span className="action-result">Go + Cobra CLI</span>
          </div>
          <div className="quick-action">
            <span className="action-label">Try a seed:</span>
            <code>99123</code>
            <span className="action-result">Python + FastAPI + MongoDB</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
