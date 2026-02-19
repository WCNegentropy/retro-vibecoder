/**
 * CLI Commands Enrichment Strategy
 *
 * Fills CLI applications with real subcommand implementations:
 * - init, config, list, info subcommands
 * - Proper argument parsing
 * - Output formatting
 * - Error handling patterns
 */

import type {
  EnrichmentStrategy,
  TechStack,
  EnrichmentFlags,
  EnrichmentContext,
} from '../../../types.js';

function generateTypescriptCommands(projectName: string): string {
  return `import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CONFIG_FILE = '.${projectName.replace(/-/g, '')}rc.json';

interface Config {
  version: string;
  outputDir: string;
  verbose: boolean;
}

const DEFAULT_CONFIG: Config = {
  version: '1.0.0',
  outputDir: './output',
  verbose: false,
};

/** Initialize a new project configuration */
export function initCommand(options: { force?: boolean }): void {
  const configPath = join(process.cwd(), CONFIG_FILE);

  if (existsSync(configPath) && !options.force) {
    console.error(\`Configuration file already exists: \${CONFIG_FILE}\`);
    console.error('Use --force to overwrite.');
    process.exit(1);
  }

  writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
  console.log(\`Created \${CONFIG_FILE}\`);
}

/** Show current configuration */
export function configCommand(options: { key?: string; set?: string }): void {
  const config = loadConfig();

  if (options.key && options.set) {
    (config as Record<string, unknown>)[options.key] = options.set;
    saveConfig(config);
    console.log(\`Set \${options.key} = \${options.set}\`);
    return;
  }

  if (options.key) {
    const value = (config as Record<string, unknown>)[options.key];
    if (value === undefined) {
      console.error(\`Unknown config key: \${options.key}\`);
      process.exit(1);
    }
    console.log(String(value));
    return;
  }

  // Show all config
  for (const [key, value] of Object.entries(config)) {
    console.log(\`\${key}: \${JSON.stringify(value)}\`);
  }
}

/** List available resources */
export function listCommand(options: { format?: 'text' | 'json' }): void {
  const items = [
    { name: 'default', description: 'Default configuration', status: 'active' },
    { name: 'development', description: 'Development settings', status: 'active' },
    { name: 'production', description: 'Production settings', status: 'inactive' },
  ];

  if (options.format === 'json') {
    console.log(JSON.stringify(items, null, 2));
    return;
  }

  console.log('Available configurations:\\n');
  for (const item of items) {
    const statusIcon = item.status === 'active' ? '[*]' : '[ ]';
    console.log(\`  \${statusIcon} \${item.name.padEnd(20)} \${item.description}\`);
  }
}

/** Show system information */
export function infoCommand(): void {
  console.log(\`${projectName} Information\\n\`);
  console.log(\`  Version:     \${DEFAULT_CONFIG.version}\`);
  console.log(\`  Node.js:     \${process.version}\`);
  console.log(\`  Platform:    \${process.platform}\`);
  console.log(\`  Architecture: \${process.arch}\`);
  console.log(\`  Working Dir: \${process.cwd()}\`);
}

function loadConfig(): Config {
  const configPath = join(process.cwd(), CONFIG_FILE);
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(config: Config): void {
  const configPath = join(process.cwd(), CONFIG_FILE);
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}
`;
}

function generatePythonCommands(projectName: string): string {
  return `"""CLI subcommand implementations for ${projectName}."""

import json
import sys
from pathlib import Path
from typing import Optional

CONFIG_FILE = ".${projectName.replace(/-/g, '')}rc.json"

DEFAULT_CONFIG = {
    "version": "1.0.0",
    "output_dir": "./output",
    "verbose": False,
}


def init_command(force: bool = False) -> None:
    """Initialize a new project configuration."""
    config_path = Path.cwd() / CONFIG_FILE

    if config_path.exists() and not force:
        print(f"Configuration file already exists: {CONFIG_FILE}", file=sys.stderr)
        print("Use --force to overwrite.", file=sys.stderr)
        sys.exit(1)

    config_path.write_text(json.dumps(DEFAULT_CONFIG, indent=2))
    print(f"Created {CONFIG_FILE}")


def config_command(key: Optional[str] = None, value: Optional[str] = None) -> None:
    """Show or update configuration."""
    config = _load_config()

    if key and value:
        config[key] = value
        _save_config(config)
        print(f"Set {key} = {value}")
        return

    if key:
        if key not in config:
            print(f"Unknown config key: {key}", file=sys.stderr)
            sys.exit(1)
        print(config[key])
        return

    for k, v in config.items():
        print(f"{k}: {json.dumps(v)}")


def list_command(fmt: str = "text") -> None:
    """List available resources."""
    items = [
        {"name": "default", "description": "Default configuration", "status": "active"},
        {"name": "development", "description": "Development settings", "status": "active"},
        {"name": "production", "description": "Production settings", "status": "inactive"},
    ]

    if fmt == "json":
        print(json.dumps(items, indent=2))
        return

    print("Available configurations:\\n")
    for item in items:
        icon = "[*]" if item["status"] == "active" else "[ ]"
        print(f"  {icon} {item['name']:<20} {item['description']}")


def info_command() -> None:
    """Show system information."""
    import platform

    print(f"${projectName} Information\\n")
    print(f"  Version:     {DEFAULT_CONFIG['version']}")
    print(f"  Python:      {platform.python_version()}")
    print(f"  Platform:    {platform.system()}")
    print(f"  Architecture: {platform.machine()}")
    print(f"  Working Dir: {Path.cwd()}")


def _load_config() -> dict:
    config_path = Path.cwd() / CONFIG_FILE
    try:
        return json.loads(config_path.read_text())
    except FileNotFoundError:
        return {**DEFAULT_CONFIG}


def _save_config(config: dict) -> None:
    config_path = Path.cwd() / CONFIG_FILE
    config_path.write_text(json.dumps(config, indent=2))
`;
}

export const CliCommandsEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-cli-commands',
  name: 'CLI Command Logic Fill',
  priority: 20,

  matches: (stack: TechStack, flags: EnrichmentFlags) =>
    flags.fillLogic && stack.archetype === 'cli',

  apply: async (context: EnrichmentContext) => {
    const { files, stack, projectName } = context;

    switch (stack.language) {
      case 'typescript':
      case 'javascript':
        files['src/commands/index.ts'] = generateTypescriptCommands(projectName);
        break;
      case 'python':
        files['src/commands/__init__.py'] = generatePythonCommands(projectName);
        break;
    }
  },
};
