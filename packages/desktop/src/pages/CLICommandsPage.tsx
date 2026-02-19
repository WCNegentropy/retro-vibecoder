import { useState, useCallback } from 'react';
import { isTauri } from '../hooks/useTauriGenerate';
import { Link } from 'react-router-dom';

/**
 * CLI execution result from Tauri backend
 */
interface CLIResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  duration_ms: number;
}

/**
 * CLI Commands Page
 *
 * Exposes all UPG CLI commands and options in a graphical interface:
 * - upg seed <number> - Generate from seed
 * - upg sweep - Batch generate and validate
 * - upg validate <manifest> - Validate manifest
 * - upg generate [template] - Generate from manifest
 * - upg init - Initialize new manifest
 * - upg search <query> - Search registry
 * - upg docs <manifest> - Generate documentation
 * - upg test <manifest> - Test manifest
 */

interface CLICommand {
  id: string;
  name: string;
  description: string;
  usage: string;
  options: CLIOption[];
}

interface CLIOption {
  flag: string;
  shortFlag?: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  choices?: string[];
  default?: string | number | boolean;
}

const CLI_COMMANDS: CLICommand[] = [
  {
    id: 'seed',
    name: 'Seed Generator',
    description: 'Generate a project from a seed number using procedural generation',
    usage: 'upg seed <number> [options]',
    options: [
      {
        flag: '--output',
        shortFlag: '-o',
        description: 'Output directory for generated project',
        type: 'string',
        default: './generated-project',
      },
      {
        flag: '--archetype',
        description: 'Force specific archetype',
        type: 'select',
        choices: ['web', 'backend', 'cli', 'mobile', 'desktop', 'library', 'game'],
      },
      {
        flag: '--language',
        description: 'Force specific language',
        type: 'select',
        choices: [
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
        ],
      },
      {
        flag: '--framework',
        description: 'Force specific framework',
        type: 'string',
      },
      {
        flag: '--verbose',
        shortFlag: '-v',
        description: 'Show detailed output including file previews',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--dry-run',
        description: 'Preview generation without creating files',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--enrich',
        description: 'Enable Pass 2 enrichment on generated project',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--enrich-depth',
        description: 'Enrichment depth preset',
        type: 'select',
        choices: ['minimal', 'standard', 'full'],
        default: 'standard',
      },
      {
        flag: '--no-enrich-cicd',
        description: 'Skip CI/CD workflow enrichment',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--no-enrich-release',
        description: 'Skip release automation workflows',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--no-enrich-logic',
        description: 'Skip application logic fill',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--no-enrich-tests',
        description: 'Skip test generation',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--no-enrich-docker-prod',
        description: 'Skip Docker production optimizations',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--no-enrich-linting',
        description: 'Skip linting/formatting config enrichment',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--no-enrich-env',
        description: 'Skip environment file generation',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--no-enrich-docs',
        description: 'Skip documentation enrichment',
        type: 'boolean',
        default: false,
      },
    ],
  },
  {
    id: 'sweep',
    name: 'Seed Sweeper',
    description: 'Batch generate and validate multiple seeds to discover valid configurations',
    usage: 'upg sweep [options]',
    options: [
      {
        flag: '--count',
        shortFlag: '-c',
        description: 'Number of seeds to generate',
        type: 'number',
        default: 10,
      },
      {
        flag: '--output',
        shortFlag: '-o',
        description: 'Output directory for generated projects',
        type: 'string',
        default: './sweep-output',
      },
      {
        flag: '--validate',
        description: 'Run validation pipeline on generated projects',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--save-registry',
        description: 'Save valid seeds to registry JSON file',
        type: 'string',
      },
      {
        flag: '--dry-run',
        description: 'Preview stacks without generating files',
        type: 'boolean',
        default: true,
      },
      {
        flag: '--only-valid',
        description: 'Keep retrying until N valid projects are found',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--start-seed',
        description: 'Starting seed number',
        type: 'number',
        default: 0,
      },
      {
        flag: '--enrich',
        description: 'Enable Pass 2 enrichment on generated projects',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--enrich-depth',
        description: 'Enrichment depth preset',
        type: 'select',
        choices: ['minimal', 'standard', 'full'],
        default: 'standard',
      },
    ],
  },
  {
    id: 'generate',
    name: 'Manifest Generator',
    description: 'Generate a project from a UPG manifest template',
    usage: 'upg generate [template] [options]',
    options: [
      {
        flag: '--dest',
        description: 'Destination directory',
        type: 'string',
        default: './',
      },
      {
        flag: '--data',
        description: 'JSON data for non-interactive generation',
        type: 'string',
      },
      {
        flag: '--use-defaults',
        description: 'Use default values for all prompts',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--dry-run',
        description: 'Preview without creating files',
        type: 'boolean',
        default: false,
      },
    ],
  },
  {
    id: 'validate',
    name: 'Manifest Validator',
    description: 'Validate a UPG manifest file against the schema',
    usage: 'upg validate <manifest>',
    options: [
      {
        flag: '--strict',
        description: 'Enable strict validation mode',
        type: 'boolean',
        default: false,
      },
      {
        flag: '--json',
        description: 'Output validation results as JSON',
        type: 'boolean',
        default: false,
      },
    ],
  },
  {
    id: 'init',
    name: 'Initialize Manifest',
    description: 'Create a new UPG manifest file (use --template for non-interactive mode)',
    usage: 'upg init [options]',
    options: [
      {
        flag: '--output',
        shortFlag: '-o',
        description: 'Output file path',
        type: 'string',
        default: 'upg.yaml',
      },
      {
        flag: '--template',
        description: 'Use a template as starting point',
        type: 'select',
        choices: ['minimal', 'full', 'python-api', 'react-starter'],
      },
      {
        flag: '--use-defaults',
        description: 'Use default values (non-interactive)',
        type: 'boolean',
        default: true,
      },
    ],
  },
  {
    id: 'search',
    name: 'Registry Search',
    description: 'Search the template registry for templates',
    usage: 'upg search <query> [options]',
    options: [
      {
        flag: '--tags',
        description: 'Filter by tags (comma-separated)',
        type: 'string',
      },
      {
        flag: '--limit',
        description: 'Maximum number of results',
        type: 'number',
        default: 20,
      },
    ],
  },
  {
    id: 'docs',
    name: 'Generate Docs',
    description: 'Generate documentation from a manifest',
    usage: 'upg docs <manifest> [options]',
    options: [
      {
        flag: '--output',
        shortFlag: '-o',
        description: 'Output file path',
        type: 'string',
        default: 'README.md',
      },
      {
        flag: '--format',
        description: 'Output format',
        type: 'select',
        choices: ['markdown', 'html', 'json'],
        default: 'markdown',
      },
    ],
  },
  {
    id: 'test',
    name: 'Test Manifest',
    description: 'Run validation tests on a manifest',
    usage: 'upg test <manifest>',
    options: [
      {
        flag: '--verbose',
        shortFlag: '-v',
        description: 'Verbose test output',
        type: 'boolean',
        default: false,
      },
    ],
  },
];

const MANIFEST_COMMAND_IDS = new Set(
  CLI_COMMANDS.filter(cmd =>
    ['generate', 'validate', 'init', 'search', 'docs', 'test'].includes(cmd.id)
  ).map(cmd => cmd.id)
);

function CLICommandsPage() {
  const [selectedCommand, setSelectedCommand] = useState<CLICommand>(CLI_COMMANDS[0]);
  const [optionValues, setOptionValues] = useState<Record<string, string | number | boolean>>({});
  const [commandOutput, setCommandOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleOptionChange = useCallback((flag: string, value: string | number | boolean) => {
    setOptionValues(prev => ({ ...prev, [flag]: value }));
  }, []);

  const buildCommand = useCallback(() => {
    const parts = ['upg', selectedCommand.id];

    // Add positional argument placeholder if needed
    if (selectedCommand.usage.includes('<')) {
      if (selectedCommand.id === 'seed') {
        parts.push(String(optionValues['seed'] || '82910'));
      } else if (selectedCommand.usage.includes('<manifest>')) {
        parts.push(String(optionValues['manifest'] || 'upg.yaml'));
      } else if (selectedCommand.usage.includes('<query>')) {
        parts.push(String(optionValues['query'] || 'react'));
      }
    }

    // Add options
    selectedCommand.options.forEach(opt => {
      const value = optionValues[opt.flag] ?? opt.default;
      if (opt.type === 'boolean') {
        if (value) {
          parts.push(opt.flag);
        }
      } else if (value !== undefined && value !== '' && value !== opt.default) {
        parts.push(opt.flag, String(value));
      }
    });

    return parts.join(' ');
  }, [selectedCommand, optionValues]);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    const command = buildCommand();
    setCommandOutput(prev => [...prev, `$ ${command}`, '']);

    try {
      if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');

        // Build the args array for the CLI
        const args: string[] = [selectedCommand.id];

        // Add positional arguments
        if (selectedCommand.id === 'seed') {
          args.push(String(optionValues['seed'] || '82910'));
        } else if (
          selectedCommand.usage.includes('<manifest>') ||
          selectedCommand.usage.includes('[template]')
        ) {
          const manifestPath = String(optionValues['manifest'] || 'upg.yaml');
          if (manifestPath) args.push(manifestPath);
        } else if (selectedCommand.usage.includes('<query>')) {
          const query = String(optionValues['query'] || '');
          if (query) args.push(query);
        }

        // Add options
        selectedCommand.options.forEach(opt => {
          const value = optionValues[opt.flag] ?? opt.default;
          if (opt.type === 'boolean') {
            if (value) {
              args.push(opt.flag);
            }
          } else if (value !== undefined && value !== '' && value !== opt.default) {
            args.push(opt.flag, String(value));
          }
        });

        setCommandOutput(prev => [...prev, `Executing: upg ${args.join(' ')}`, '']);

        const result = await invoke<CLIResult>('execute_upg_cli', {
          args,
          workingDir: null,
        });

        // Display output
        if (result.stdout) {
          setCommandOutput(prev => [...prev, ...result.stdout.split('\n')]);
        }
        if (result.stderr) {
          setCommandOutput(prev => [...prev, '--- stderr ---', ...result.stderr.split('\n')]);
        }

        setCommandOutput(prev => [
          ...prev,
          '',
          `Exit code: ${result.exit_code ?? 'N/A'}`,
          `Duration: ${result.duration_ms}ms`,
          result.success ? 'Command completed successfully.' : 'Command failed.',
          '',
        ]);
      } else {
        // Not in Tauri - provide helpful message
        setCommandOutput(prev => [
          ...prev,
          'CLI execution requires the Tauri desktop environment.',
          'To run this command manually, copy it and execute in your terminal:',
          '',
          `  ${command}`,
          '',
          'Or run the desktop app with: pnpm tauri:dev',
          '',
        ]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Command execution failed';
      setCommandOutput(prev => [...prev, `Error: ${message}`, '']);
    } finally {
      setIsRunning(false);
    }
  }, [buildCommand, selectedCommand, optionValues]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(buildCommand());
  }, [buildCommand]);

  const handleClear = useCallback(() => {
    setCommandOutput([]);
  }, []);

  return (
    <div className="page cli-commands-page">
      <header className="page-header">
        <h1>CLI Commands</h1>
        <p className="subtitle">Execute UPG commands with a graphical interface</p>
      </header>

      <div className="grid-2">
        {/* Command Selection Panel */}
        <section className="win95-window">
          <div className="win95-window-title">
            <span className="win95-window-title-icon">&gt;</span>
            Select Command
          </div>
          <div className="win95-window-content">
            <div className="command-list">
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: 'var(--bevel-dark)',
                  padding: '4px 8px',
                  borderBottom: '1px solid var(--bevel-dark)',
                  marginBottom: '4px',
                }}
              >
                Procedural Commands
              </div>
              {CLI_COMMANDS.filter(cmd => !MANIFEST_COMMAND_IDS.has(cmd.id)).map(cmd => (
                <button
                  key={cmd.id}
                  type="button"
                  className={`command-item btn ${selectedCommand.id === cmd.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCommand(cmd);
                    setOptionValues({});
                  }}
                  style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
                >
                  <code style={{ marginRight: '8px' }}>upg {cmd.id}</code>
                  <span style={{ fontSize: '10px', color: 'var(--bevel-dark)' }}>{cmd.name}</span>
                </button>
              ))}
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: 'var(--bevel-dark)',
                  padding: '4px 8px',
                  borderBottom: '1px solid var(--bevel-dark)',
                  marginBottom: '4px',
                  marginTop: '8px',
                }}
              >
                Template / Manifest Commands
              </div>
              {CLI_COMMANDS.filter(cmd => MANIFEST_COMMAND_IDS.has(cmd.id)).map(cmd => (
                <button
                  key={cmd.id}
                  type="button"
                  className={`command-item btn ${selectedCommand.id === cmd.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCommand(cmd);
                    setOptionValues({});
                  }}
                  style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
                >
                  <code style={{ marginRight: '8px' }}>upg {cmd.id}</code>
                  <span style={{ fontSize: '10px', color: 'var(--bevel-dark)' }}>{cmd.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Options Panel */}
        <section className="win95-window">
          <div className="win95-window-title">
            <span className="win95-window-title-icon">*</span>
            {selectedCommand.name} Options
          </div>
          <div className="win95-window-content">
            <p style={{ marginBottom: '12px', fontSize: '11px' }}>{selectedCommand.description}</p>

            {MANIFEST_COMMAND_IDS.has(selectedCommand.id) && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '8px',
                  background: '#ffffcc',
                  border: '1px solid #cccc00',
                  fontSize: '11px',
                }}
              >
                ⚠ This command requires a manifest file (upg.yaml). For a guided experience, use the{' '}
                <Link to="/templates" style={{ color: 'var(--synth-blue)' }}>
                  Template Selector
                </Link>
                .
              </div>
            )}

            <code
              style={{
                display: 'block',
                marginBottom: '16px',
                padding: '8px',
                background: 'var(--win95-bg)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {selectedCommand.usage}
            </code>

            {/* Positional arguments */}
            {selectedCommand.id === 'seed' && (
              <div className="form-group">
                <label className="form-label" htmlFor="seed-input">
                  Seed Number
                </label>
                <input
                  id="seed-input"
                  type="number"
                  className="form-input"
                  value={String(optionValues['seed'] || '')}
                  onChange={e => handleOptionChange('seed', parseInt(e.target.value, 10) || 0)}
                  placeholder="82910"
                />
              </div>
            )}

            {(selectedCommand.usage.includes('<manifest>') ||
              selectedCommand.usage.includes('[template]')) && (
              <div className="form-group">
                <label className="form-label" htmlFor="manifest-input">
                  Manifest/Template Path
                </label>
                <input
                  id="manifest-input"
                  type="text"
                  className="form-input"
                  value={String(optionValues['manifest'] || '')}
                  onChange={e => handleOptionChange('manifest', e.target.value)}
                  placeholder="upg.yaml"
                />
              </div>
            )}

            {selectedCommand.usage.includes('<query>') && (
              <div className="form-group">
                <label className="form-label" htmlFor="query-input">
                  Search Query
                </label>
                <input
                  id="query-input"
                  type="text"
                  className="form-input"
                  value={String(optionValues['query'] || '')}
                  onChange={e => handleOptionChange('query', e.target.value)}
                  placeholder="react typescript"
                />
              </div>
            )}

            {/* Command options */}
            {selectedCommand.options.map(opt => (
              <div key={opt.flag} className="form-group">
                <label className="form-label" htmlFor={`opt-${opt.flag}`}>
                  {opt.flag} {opt.shortFlag && `(${opt.shortFlag})`}
                </label>
                {opt.type === 'boolean' ? (
                  <label className="form-checkbox">
                    <input
                      id={`opt-${opt.flag}`}
                      type="checkbox"
                      checked={Boolean(optionValues[opt.flag])}
                      onChange={e => handleOptionChange(opt.flag, e.target.checked)}
                    />
                    {opt.description}
                  </label>
                ) : opt.type === 'select' ? (
                  <>
                    <select
                      id={`opt-${opt.flag}`}
                      className="form-select"
                      value={String(optionValues[opt.flag] || '')}
                      onChange={e => handleOptionChange(opt.flag, e.target.value)}
                    >
                      <option value="">-- Select --</option>
                      {opt.choices?.map(choice => (
                        <option key={choice} value={choice}>
                          {choice}
                        </option>
                      ))}
                    </select>
                    <p className="form-help">{opt.description}</p>
                  </>
                ) : opt.type === 'number' ? (
                  <>
                    <input
                      id={`opt-${opt.flag}`}
                      type="number"
                      className="form-input"
                      value={String(optionValues[opt.flag] || opt.default || '')}
                      onChange={e =>
                        handleOptionChange(opt.flag, parseInt(e.target.value, 10) || 0)
                      }
                    />
                    <p className="form-help">{opt.description}</p>
                  </>
                ) : (
                  <>
                    <input
                      id={`opt-${opt.flag}`}
                      type="text"
                      className="form-input"
                      value={String(optionValues[opt.flag] || '')}
                      onChange={e => handleOptionChange(opt.flag, e.target.value)}
                      placeholder={String(opt.default || '')}
                    />
                    <p className="form-help">{opt.description}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Command Preview and Output */}
      <section className="cli-panel">
        <div className="cli-panel-header">
          <h3>Command Terminal</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-sm" onClick={handleCopy}>
              Copy
            </button>
            <button type="button" className="btn btn-sm" onClick={handleClear}>
              Clear
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? 'Running...' : 'Run'}
            </button>
          </div>
        </div>
        <div className="cli-panel-body">
          <div className="cli-command">
            <span className="cli-prompt">$</span>
            <span className="cli-text">{buildCommand()}</span>
          </div>
          {commandOutput.map((line, i) => (
            <div key={i} className={line.startsWith('$') ? 'cli-command' : 'cli-output'}>
              {line.startsWith('$') ? (
                <>
                  <span className="cli-prompt">$</span>
                  <span className="cli-text">{line.slice(2)}</span>
                </>
              ) : (
                line
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default CLICommandsPage;
