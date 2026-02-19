import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EnrichmentPanel, { createDefaultEnrichmentConfig } from '../components/EnrichmentPanel';
import { isTauri } from '../hooks/useTauriGenerate';
import { useSettings } from '../hooks/useSettings';
import { useStatus } from '../hooks/useStatus';
import type { TemplateEntry, EnrichmentConfig } from '../types';

/** Result from template generation */
interface TemplateGenerationResult {
  success: boolean;
  message: string;
  files_generated: string[];
  output_path: string;
  duration_ms: number;
}

/**
 * Template Selector Page
 *
 * Browse and generate projects from UPG manifest templates.
 * Templates are loaded from the templates/ directory via the Tauri backend.
 * Generation uses the CLI's Nunjucks-based template engine.
 */

function TemplateSelectorPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateEntry | null>(null);
  const [manifestContent, setManifestContent] = useState<string | null>(null);
  const [showManifest, setShowManifest] = useState(false);
  const [outputPath, setOutputPath] = useState('./generated-project');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<TemplateGenerationResult | null>(null);
  const [enrichment, setEnrichment] = useState<EnrichmentConfig>(createDefaultEnrichmentConfig);

  const { settings, isLoaded: settingsLoaded } = useSettings();
  const { setStatus } = useStatus();

  // Apply persisted settings as defaults once loaded
  useEffect(() => {
    if (settingsLoaded && settings.defaultOutputDir) {
      setOutputPath(settings.defaultOutputDir);
    }
  }, [settingsLoaded, settings.defaultOutputDir]);

  // Load templates from Tauri backend on mount
  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true);
      setError(null);

      try {
        if (isTauri()) {
          const { invoke } = await import('@tauri-apps/api/core');
          const result = await invoke<TemplateEntry[]>('get_templates');
          setTemplates(result);
        } else {
          setError(
            'Template loading requires the Tauri desktop environment. Please run the desktop app.'
          );
          setTemplates([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load templates';
        setError(message);
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplates();
  }, []);

  // Get all unique tags
  const allTags = Array.from(new Set(templates.flatMap(t => t.tags)));

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      searchQuery === '' ||
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags =
      selectedTags.length === 0 || selectedTags.every(tag => template.tags.includes(tag));

    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const handleSelectTemplate = (template: TemplateEntry) => {
    setSelectedTemplate(template);
    setShowManifest(false);
    setManifestContent(null);
    setGenerationResult(null);
  };

  // Handle generating a project from the selected template
  const handleGenerateFromTemplate = useCallback(async () => {
    if (!selectedTemplate || !isTauri()) return;

    setIsGenerating(true);
    setGenerationResult(null);
    setError(null);
    setStatus(`Generating from template "${selectedTemplate.title}"...`, 0);

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<TemplateGenerationResult>('generate_from_template', {
        templatePath: selectedTemplate.path,
        outputPath,
        data: null,
        useDefaults: true,
        force: false,
        enrichmentConfig: enrichment.enabled ? enrichment : null,
      });
      setGenerationResult(result);
      if (result.success) {
        setStatus(`✓ Generated ${result.files_generated.length} files in ${result.duration_ms}ms`);
      } else {
        setStatus('Template generation failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Template generation failed';
      setError(message);
      setStatus(`Error: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplate, outputPath, enrichment, setStatus]);

  // Handle viewing manifest content
  const handleViewManifest = useCallback(async () => {
    if (!selectedTemplate) return;

    if (showManifest && manifestContent) {
      setShowManifest(false);
      return;
    }

    try {
      if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');
        const manifestPath = `${selectedTemplate.path}/upg.yaml`;
        const content = await invoke<string>('read_manifest', { path: manifestPath });
        setManifestContent(content);
        setShowManifest(true);
      } else {
        setManifestContent('# Manifest viewing requires Tauri environment');
        setShowManifest(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to read manifest';
      setManifestContent(`# Error reading manifest:\n# ${message}`);
      setShowManifest(true);
    }
  }, [selectedTemplate, showManifest, manifestContent]);

  if (isLoading) {
    return (
      <div className="page template-selector-page">
        <div className="loading">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="page template-selector-page">
      <header className="page-header">
        <h1>Template Selector</h1>
        <p className="subtitle">Generate projects from UPG manifest templates using Nunjucks</p>
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

      {/* Guidance when no templates found */}
      {templates.length === 0 && !error && (
        <div
          className="win95-window"
          style={{
            marginBottom: '24px',
            background: 'var(--win95-bg)',
          }}
        >
          <div className="win95-window-title">
            <span className="win95-window-title-icon">!</span>
            No Templates Found
          </div>
          <div className="win95-window-content" style={{ padding: '16px' }}>
            <p style={{ marginBottom: '12px' }}>
              No UPG manifest templates were found in the templates/ directory.
            </p>
            <p style={{ marginBottom: '16px' }}>
              Add templates with <code>upg.yaml</code> manifests and a <code>template/</code>{' '}
              subdirectory containing <code>.jinja</code> files, or use{' '}
              <strong>Procedural Mode</strong> to generate from seeds.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-primary" onClick={() => navigate('/seed')}>
                Go to Seed Generator
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/compose')}
              >
                Go to Stack Composer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="template-layout">
        <aside className="filter-sidebar">
          <div className="search-box">
            <input
              type="text"
              className="form-input"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="tag-filters">
            <h3>Filter by Tags</h3>
            <div className="tag-list">
              {allTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-button ${selectedTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="template-grid-container">
          {filteredTemplates.length === 0 ? (
            <div className="no-results">
              {templates.length === 0
                ? 'No templates found. Add templates to the templates/ directory.'
                : 'No templates match your criteria'}
            </div>
          ) : (
            <div className="template-grid">
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.name}
                  template={template}
                  isSelected={selectedTemplate?.name === template.name}
                  onSelect={() => handleSelectTemplate(template)}
                />
              ))}
            </div>
          )}
        </main>

        {selectedTemplate && (
          <aside className="template-details">
            <div className="details-header">
              <h2>{selectedTemplate.title}</h2>
              <span className={`lifecycle-badge ${selectedTemplate.lifecycle}`}>
                {selectedTemplate.lifecycle}
              </span>
            </div>
            <p className="details-description">{selectedTemplate.description}</p>
            <div className="details-meta">
              <div className="meta-item">
                <span className="label">Version:</span>
                <span className="value">{selectedTemplate.version}</span>
              </div>
              <div className="meta-item">
                <span className="label">Author:</span>
                <span className="value">{selectedTemplate.author || 'Unknown'}</span>
              </div>
              <div className="meta-item">
                <span className="label">Path:</span>
                <span className="value" style={{ fontSize: '10px', wordBreak: 'break-all' }}>
                  {selectedTemplate.path}
                </span>
              </div>
            </div>
            <div className="details-tags">
              {selectedTemplate.tags.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>

            {/* Output path for generation */}
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label" htmlFor="template-output">
                Output Directory
              </label>
              <input
                id="template-output"
                type="text"
                className="form-input"
                value={outputPath}
                onChange={e => setOutputPath(e.target.value)}
                placeholder="./my-project"
              />
            </div>

            <EnrichmentPanel config={enrichment} onChange={setEnrichment} />

            <div className="details-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerateFromTemplate}
                disabled={isGenerating || !isTauri()}
              >
                {isGenerating ? 'Generating...' : 'Generate Project'}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleViewManifest}>
                {showManifest ? 'Hide Manifest' : 'View Manifest'}
              </button>
            </div>

            {/* Generation result */}
            {generationResult && (
              <div
                className={`generation-result ${generationResult.success ? 'success' : 'error'}`}
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  border: `2px solid ${generationResult.success ? 'var(--color-success, #4caf50)' : 'var(--color-error, #f44336)'}`,
                  background: generationResult.success
                    ? 'rgba(76, 175, 80, 0.1)'
                    : 'rgba(244, 67, 54, 0.1)',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {generationResult.success ? 'Generation Complete!' : 'Generation Failed'}
                </div>
                <div style={{ fontSize: '11px' }}>{generationResult.message}</div>
                {generationResult.success && (
                  <>
                    <div style={{ marginTop: '4px', fontSize: '10px' }}>
                      <strong>Output:</strong>{' '}
                      <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px' }}>
                        {generationResult.output_path}
                      </code>
                    </div>
                    <div style={{ fontSize: '10px' }}>
                      <strong>Files:</strong> {generationResult.files_generated.length} generated in{' '}
                      {generationResult.duration_ms}ms
                    </div>
                  </>
                )}
              </div>
            )}

            {showManifest && manifestContent && (
              <div className="manifest-viewer" style={{ marginTop: '16px' }}>
                <h3>Manifest (upg.yaml)</h3>
                <pre
                  style={{
                    background: '#000',
                    color: '#0f0',
                    padding: '12px',
                    fontSize: '10px',
                    overflow: 'auto',
                    maxHeight: '300px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {manifestContent}
                </pre>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Template card component
 */
function TemplateCard({
  template,
  isSelected,
  onSelect,
}: {
  template: TemplateEntry;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`template-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="card-header">
        <span className="template-icon">{template.icon}</span>
        <span className={`lifecycle-badge ${template.lifecycle}`}>{template.lifecycle}</span>
      </div>
      <h3 className="template-title">{template.title}</h3>
      <p className="template-description">{template.description}</p>
      <div className="template-tags">
        {template.tags.slice(0, 3).map(tag => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
        {template.tags.length > 3 && <span className="tag-more">+{template.tags.length - 3}</span>}
      </div>
    </button>
  );
}

export default TemplateSelectorPage;
