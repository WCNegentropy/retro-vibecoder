import { useState, useEffect } from 'react';
import type { TemplateEntry } from '../types';

/**
 * Template Selector Page
 *
 * Manifest Mode: Browse and select curated UPG templates
 * - Load templates from registry
 * - Filter by tags
 * - Preview template details
 * - Generate using RJSF form + Copier sidecar
 */

// Mock templates for development
const MOCK_TEMPLATES: TemplateEntry[] = [
  {
    name: 'react-starter',
    version: '1.0.0',
    title: 'React Starter',
    description: 'Modern React app with Vite, TypeScript, and Tailwind CSS',
    tags: ['react', 'typescript', 'vite', 'tailwind'],
    icon: '[]',
    author: 'UPG Team',
    lifecycle: 'production',
    path: './templates/react-starter',
  },
  {
    name: 'python-api',
    version: '1.0.0',
    title: 'Python FastAPI',
    description: 'FastAPI backend with PostgreSQL and SQLAlchemy',
    tags: ['python', 'fastapi', 'postgresql', 'backend'],
    icon: '{}',
    author: 'UPG Team',
    lifecycle: 'production',
    path: './templates/python-api',
  },
  {
    name: 'rust-axum',
    version: '0.1.0',
    title: 'Rust Axum API',
    description: 'High-performance Rust backend with Axum framework',
    tags: ['rust', 'axum', 'backend', 'performance'],
    icon: '{}',
    author: 'Community',
    lifecycle: 'experimental',
    path: './templates/rust-axum',
  },
  {
    name: 'go-cli',
    version: '1.0.0',
    title: 'Go CLI Tool',
    description: 'Command-line application with Cobra and Viper',
    tags: ['go', 'cobra', 'cli'],
    icon: '>',
    author: 'UPG Team',
    lifecycle: 'production',
    path: './templates/go-cli',
  },
];

function TemplateSelectorPage() {
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateEntry | null>(null);

  // Load templates (mock for now)
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setTemplates(MOCK_TEMPLATES);
      setIsLoading(false);
    }, 300);
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
  };

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
            <div className="no-results">No templates match your criteria</div>
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
                <span className="value">{selectedTemplate.author}</span>
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
              <button type="button" className="btn btn-primary">
                Use Template
              </button>
              <button type="button" className="btn btn-outline">
                View Manifest
              </button>
            </div>
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
