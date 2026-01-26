import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TemplateEntry } from '../types';

/**
 * Check if running in Tauri environment
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Template Selector Page
 *
 * Manifest Mode: Browse and select curated UPG templates
 * - Load templates from registry
 * - Filter by tags
 * - Preview template details
 * - Generate using RJSF form + Copier sidecar
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

  // Load templates from Tauri backend
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
          // Development fallback - show message that Tauri is required
          setError('Templates are loaded from the filesystem. Run in Tauri to see real templates.');
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
  };

  // Handle using a template - navigate to generation page
  const handleUseTemplate = useCallback(async () => {
    if (!selectedTemplate) return;

    // Navigate to a generation page with the template path
    // For now, we'll store the template in sessionStorage and navigate
    sessionStorage.setItem('selectedTemplate', JSON.stringify(selectedTemplate));
    navigate('/seed', {
      state: { template: selectedTemplate },
    });
  }, [selectedTemplate, navigate]);

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
        <p className="subtitle">Browse curated UPG manifest templates</p>
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
            <div className="details-actions">
              <button type="button" className="btn btn-primary" onClick={handleUseTemplate}>
                Use Template
              </button>
              <button type="button" className="btn btn-outline" onClick={handleViewManifest}>
                {showManifest ? 'Hide Manifest' : 'View Manifest'}
              </button>
            </div>

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
