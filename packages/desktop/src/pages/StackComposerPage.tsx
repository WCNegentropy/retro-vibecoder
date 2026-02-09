import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTauriGenerate } from '../hooks/useTauriGenerate';
import { useSettings } from '../hooks/useSettings';
import { useStatus } from '../hooks/useStatus';
import type { TechStack, Archetype, Language, Database, CICD, Packaging } from '../types';

/**
 * Stack Composer Page
 *
 * Interactive wizard for composing a custom tech stack:
 * 1. Select archetype (web, backend, cli, etc.)
 * 2. Select language
 * 3. Select framework (filtered by archetype + language)
 * 4. Select optional dimensions (database, CI/CD, packaging)
 * 5. Preview and generate
 */

interface WizardStep {
  id: string;
  title: string;
  description: string;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'archetype', title: 'Archetype', description: 'What type of project are you building?' },
  { id: 'language', title: 'Language', description: 'Choose your primary language' },
  { id: 'framework', title: 'Framework', description: 'Select a framework' },
  { id: 'extras', title: 'Extras', description: 'Configure optional features' },
  { id: 'review', title: 'Review', description: 'Review and generate' },
];

const ARCHETYPES: { id: Archetype; name: string; icon: string; description: string }[] = [
  { id: 'backend', name: 'Backend API', icon: '{}', description: 'REST/GraphQL APIs and services' },
  { id: 'web', name: 'Web App', icon: '[]', description: 'Frontend web applications' },
  { id: 'cli', name: 'CLI Tool', icon: '>', description: 'Command-line applications' },
  { id: 'mobile', name: 'Mobile App', icon: '#', description: 'iOS/Android applications' },
  { id: 'library', name: 'Library', icon: '@', description: 'Reusable packages and libraries' },
  { id: 'desktop', name: 'Desktop App', icon: '~', description: 'Native desktop applications' },
];

const LANGUAGES: { id: Language; name: string; archetypes: Archetype[] }[] = [
  {
    id: 'typescript',
    name: 'TypeScript',
    archetypes: ['backend', 'web', 'cli', 'library', 'desktop'],
  },
  { id: 'python', name: 'Python', archetypes: ['backend', 'cli', 'library'] },
  { id: 'rust', name: 'Rust', archetypes: ['backend', 'cli', 'library', 'desktop'] },
  { id: 'go', name: 'Go', archetypes: ['backend', 'cli', 'library'] },
  { id: 'java', name: 'Java', archetypes: ['backend', 'library', 'mobile'] },
  { id: 'csharp', name: 'C#', archetypes: ['backend', 'library', 'desktop', 'game'] },
  { id: 'kotlin', name: 'Kotlin', archetypes: ['backend', 'mobile', 'library'] },
  { id: 'swift', name: 'Swift', archetypes: ['mobile', 'library'] },
  { id: 'cpp', name: 'C++', archetypes: ['library', 'desktop', 'game'] },
  { id: 'ruby', name: 'Ruby', archetypes: ['backend'] },
  { id: 'php', name: 'PHP', archetypes: ['backend'] },
];

interface FrameworkOption {
  id: string;
  name: string;
  language: Language;
  archetype: Archetype;
}

const FRAMEWORKS: FrameworkOption[] = [
  // TypeScript
  { id: 'express', name: 'Express', language: 'typescript', archetype: 'backend' },
  { id: 'fastify', name: 'Fastify', language: 'typescript', archetype: 'backend' },
  { id: 'nestjs', name: 'NestJS', language: 'typescript', archetype: 'backend' },
  { id: 'react', name: 'React', language: 'typescript', archetype: 'web' },
  { id: 'vue', name: 'Vue', language: 'typescript', archetype: 'web' },
  { id: 'svelte', name: 'Svelte', language: 'typescript', archetype: 'web' },
  { id: 'solid', name: 'Solid', language: 'typescript', archetype: 'web' },
  { id: 'commander', name: 'Commander', language: 'typescript', archetype: 'cli' },
  { id: 'yargs', name: 'Yargs', language: 'typescript', archetype: 'cli' },
  { id: 'tauri', name: 'Tauri', language: 'typescript', archetype: 'desktop' },
  { id: 'electron', name: 'Electron', language: 'typescript', archetype: 'desktop' },
  { id: 'qt', name: 'Qt', language: 'cpp', archetype: 'desktop' },
  { id: 'flutter', name: 'Flutter', language: 'kotlin', archetype: 'desktop' },
  // Python
  { id: 'fastapi', name: 'FastAPI', language: 'python', archetype: 'backend' },
  { id: 'flask', name: 'Flask', language: 'python', archetype: 'backend' },
  { id: 'django', name: 'Django', language: 'python', archetype: 'backend' },
  { id: 'click', name: 'Click', language: 'python', archetype: 'cli' },
  { id: 'argparse', name: 'argparse', language: 'python', archetype: 'cli' },
  // Rust
  { id: 'axum', name: 'Axum', language: 'rust', archetype: 'backend' },
  { id: 'actix', name: 'Actix', language: 'rust', archetype: 'backend' },
  { id: 'clap', name: 'Clap', language: 'rust', archetype: 'cli' },
  // Go
  { id: 'gin', name: 'Gin', language: 'go', archetype: 'backend' },
  { id: 'echo', name: 'Echo', language: 'go', archetype: 'backend' },
  { id: 'cobra', name: 'Cobra', language: 'go', archetype: 'cli' },
  // Java
  { id: 'spring-boot', name: 'Spring Boot', language: 'java', archetype: 'backend' },
  // C#
  { id: 'aspnet-core', name: 'ASP.NET Core', language: 'csharp', archetype: 'backend' },
  // Ruby
  { id: 'rails', name: 'Ruby on Rails', language: 'ruby', archetype: 'backend' },
  // PHP
  { id: 'laravel', name: 'Laravel', language: 'php', archetype: 'backend' },
  // Mobile
  { id: 'react-native', name: 'React Native', language: 'typescript', archetype: 'mobile' },
  { id: 'jetpack-compose', name: 'Jetpack Compose', language: 'kotlin', archetype: 'mobile' },
];

const DATABASES: { id: Database; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'postgres', name: 'PostgreSQL' },
  { id: 'mysql', name: 'MySQL' },
  { id: 'sqlite', name: 'SQLite' },
  { id: 'mongodb', name: 'MongoDB' },
  { id: 'redis', name: 'Redis' },
];

const CICD_OPTIONS: { id: CICD; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'github-actions', name: 'GitHub Actions' },
  { id: 'gitlab-ci', name: 'GitLab CI' },
  { id: 'circleci', name: 'CircleCI' },
];

const PACKAGING_OPTIONS: { id: Packaging; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'docker', name: 'Docker' },
  { id: 'podman', name: 'Podman' },
];

function StackComposerPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [framework, setFramework] = useState<string | null>(null);
  const [database, setDatabase] = useState<Database>('none');
  const [cicd, setCicd] = useState<CICD>('github-actions');
  const [packaging, setPackaging] = useState<Packaging>('docker');
  const [outputPath, setOutputPath] = useState('./my-project');
  const [generatedSeed] = useState<number>(() => Math.floor(Math.random() * 100000));

  const { generate, preview, isLoading, error } = useTauriGenerate();
  const { settings, isLoaded: settingsLoaded } = useSettings();
  const { setStatus } = useStatus();

  // Apply persisted settings as defaults once loaded
  useEffect(() => {
    if (settingsLoaded) {
      if (settings.defaultOutputDir) {
        setOutputPath(settings.defaultOutputDir);
      }
      if (settings.defaultArchetype) {
        setArchetype(settings.defaultArchetype as Archetype);
      }
      if (settings.defaultLanguage) {
        setLanguage(settings.defaultLanguage as Language);
      }
    }
  }, [
    settingsLoaded,
    settings.defaultOutputDir,
    settings.defaultArchetype,
    settings.defaultLanguage,
  ]);

  // Filter languages based on selected archetype
  const availableLanguages = useMemo(() => {
    if (!archetype) return [];
    return LANGUAGES.filter(lang => lang.archetypes.includes(archetype));
  }, [archetype]);

  // Filter frameworks based on archetype + language
  const availableFrameworks = useMemo(() => {
    if (!archetype || !language) return [];
    return FRAMEWORKS.filter(fw => fw.archetype === archetype && fw.language === language);
  }, [archetype, language]);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0:
        return archetype !== null;
      case 1:
        return language !== null;
      case 2:
        return framework !== null;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, archetype, language, framework]);

  const handleNext = () => {
    if (canProceed() && currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    if (!archetype || !language || !framework) return;

    const stack: Partial<TechStack> = {
      archetype,
      language,
      framework,
      database,
      cicd,
      packaging,
    };

    setStatus(`Generating ${archetype} project...`, 0);
    const result = await generate({
      mode: 'procedural',
      seed: generatedSeed,
      stack,
      output_path: outputPath,
    });
    if (result?.success) {
      setStatus(`✓ Generated ${result.files_generated.length} files in ${result.duration_ms}ms`);
    } else {
      setStatus('Generation failed');
    }
  };

  const handlePreview = async () => {
    if (!archetype || !language || !framework) return;

    const stack: Partial<TechStack> = {
      archetype,
      language,
      framework,
      database,
      cicd,
      packaging,
    };

    setStatus('Previewing stack...', 0);
    const result = await preview({
      mode: 'procedural',
      seed: generatedSeed,
      stack,
      output_path: outputPath,
    });
    if (result) {
      const fileCount = Object.keys(result.files || {}).length;
      setStatus(`✓ Preview: ${fileCount} files`);
    } else {
      setStatus('Preview failed');
    }
  };

  return (
    <div className="page stack-composer-page">
      <header className="page-header">
        <h1>Stack Composer</h1>
        <p className="subtitle">Build your ideal tech stack step by step</p>
      </header>

      <div className="wizard">
        <div className="wizard-steps">
          {WIZARD_STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={`wizard-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              onClick={() => index < currentStep && setCurrentStep(index)}
              disabled={index > currentStep}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-title">{step.title}</span>
            </button>
          ))}
        </div>

        <div className="wizard-content">
          <div className="wizard-content-header">
            <h2>{WIZARD_STEPS[currentStep].title}</h2>
            <p>{WIZARD_STEPS[currentStep].description}</p>
          </div>

          {currentStep === 0 && (
            <div className="option-grid">
              {ARCHETYPES.map(arch => (
                <button
                  key={arch.id}
                  type="button"
                  className={`option-card ${archetype === arch.id ? 'selected' : ''}`}
                  onClick={() => {
                    setArchetype(arch.id);
                    setLanguage(null);
                    setFramework(null);
                  }}
                >
                  <span className="option-icon">{arch.icon}</span>
                  <span className="option-name">{arch.name}</span>
                  <span className="option-description">{arch.description}</span>
                </button>
              ))}
            </div>
          )}

          {currentStep === 1 && (
            <div className="option-grid">
              {availableLanguages.map(lang => (
                <button
                  key={lang.id}
                  type="button"
                  className={`option-card ${language === lang.id ? 'selected' : ''}`}
                  onClick={() => {
                    setLanguage(lang.id);
                    setFramework(null);
                  }}
                >
                  <span className="option-name">{lang.name}</span>
                </button>
              ))}
            </div>
          )}

          {currentStep === 2 && (
            <div className="option-grid">
              {availableFrameworks.map(fw => (
                <button
                  key={fw.id}
                  type="button"
                  className={`option-card ${framework === fw.id ? 'selected' : ''}`}
                  onClick={() => setFramework(fw.id)}
                >
                  <span className="option-name">{fw.name}</span>
                </button>
              ))}
              {availableFrameworks.length === 0 && (
                <p className="no-options">No frameworks available for this combination</p>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="extras-form">
              <div className="form-group">
                <label className="form-label">Database</label>
                <select
                  className="form-select"
                  value={database}
                  onChange={e => setDatabase(e.target.value as Database)}
                >
                  {DATABASES.map(db => (
                    <option key={db.id} value={db.id}>
                      {db.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">CI/CD</label>
                <select
                  className="form-select"
                  value={cicd}
                  onChange={e => setCicd(e.target.value as CICD)}
                >
                  {CICD_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Containerization</label>
                <select
                  className="form-select"
                  value={packaging}
                  onChange={e => setPackaging(e.target.value as Packaging)}
                >
                  {PACKAGING_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="review-section">
              <div className="stack-summary card">
                <h3>Your Stack</h3>
                <div className="summary-items">
                  <div className="summary-item">
                    <span className="label">Archetype:</span>
                    <span className="value">{archetype}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Language:</span>
                    <span className="value">{language}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Framework:</span>
                    <span className="value">{framework}</span>
                  </div>
                  {database !== 'none' && (
                    <div className="summary-item">
                      <span className="label">Database:</span>
                      <span className="value">{database}</span>
                    </div>
                  )}
                  {cicd !== 'none' && (
                    <div className="summary-item">
                      <span className="label">CI/CD:</span>
                      <span className="value">{cicd}</span>
                    </div>
                  )}
                  {packaging !== 'none' && (
                    <div className="summary-item">
                      <span className="label">Containerization:</span>
                      <span className="value">{packaging}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Output Directory</label>
                <input
                  type="text"
                  className="form-input"
                  value={outputPath}
                  onChange={e => setOutputPath(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="wizard-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </button>
          {currentStep < WIZARD_STEPS.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePreview}
                disabled={isLoading}
              >
                Preview Stack
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate Project'}
              </button>
            </>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      {/* CLI Equivalent */}
      <section className="cli-panel">
        <div className="cli-panel-header">
          <h3>CLI Equivalent</h3>
        </div>
        <div className="cli-panel-body">
          <div className="cli-command">
            <span className="cli-prompt">$</span>
            <span className="cli-text">
              upg seed {generatedSeed} --archetype {archetype || 'backend'} --language{' '}
              {language || 'typescript'} --framework {framework || 'express'}
              {database !== 'none' ? ` --database ${database}` : ''}
              {cicd !== 'none' ? ` --cicd ${cicd}` : ''}
              {packaging !== 'none' ? ` --packaging ${packaging}` : ''} --output {outputPath}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default StackComposerPage;
