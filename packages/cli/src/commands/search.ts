/**
 * Search command action
 *
 * Searches the registry for projects matching the query.
 * Supports filtering by tags (language, framework, archetype).
 * Fetches from GitHub registry with local fallback.
 */

import pc from 'picocolors';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Registry entry structure
 */
interface RegistryEntry {
  seed: number;
  id: string;
  license: string;
  stack: {
    archetype: string;
    language: string;
    framework: string;
    runtime: string;
    database: string;
    orm: string;
  };
  files: string[];
  validatedAt: string;
  upgVersion: string;
}

/**
 * Registry manifest structure
 */
interface RegistryManifest {
  version: string;
  generatedAt: string;
  totalEntries: number;
  entries: RegistryEntry[];
}

interface SearchOptions {
  tags?: string;
  limit: string;
  local?: boolean;
  remote?: boolean;
}

const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/WCNegentropy/retro-vibecoder/main/registry/manifests/generated.json';

/**
 * Get local registry path
 */
function getLocalRegistryPath(): string {
  // Navigate from packages/cli to project root
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // From dist/commands/ or src/commands/, go up to cli package, then to project root
  return join(__dirname, '..', '..', '..', '..', 'registry', 'manifests', 'generated.json');
}

/**
 * Fetch registry from GitHub
 */
async function fetchRemoteRegistry(): Promise<RegistryManifest | null> {
  try {
    const response = await fetch(GITHUB_RAW_URL);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data as RegistryManifest;
  } catch {
    return null;
  }
}

/**
 * Load registry from local file
 */
async function loadLocalRegistry(): Promise<RegistryManifest | null> {
  try {
    const localPath = getLocalRegistryPath();
    const content = await readFile(localPath, 'utf-8');
    return JSON.parse(content) as RegistryManifest;
  } catch {
    return null;
  }
}

/**
 * Check if an entry matches the search query
 */
/**
 * Common search term aliases that map to stack field values
 */
const SEARCH_ALIASES: Record<string, string[]> = {
  api: ['backend', 'rest', 'graphql'],
  server: ['backend'],
  frontend: ['web'],
  ui: ['web'],
  database: ['postgres', 'mysql', 'sqlite', 'mongodb', 'redis'],
  db: ['postgres', 'mysql', 'sqlite', 'mongodb', 'redis'],
  js: ['javascript'],
  ts: ['typescript'],
  py: ['python'],
  rs: ['rust'],
  node: ['node'],
  react: ['react'],
};

/**
 * Check if an entry matches the search query
 */
function entryMatchesQuery(entry: RegistryEntry, query: string): boolean {
  const searchTerms = query.toLowerCase().split(/\s+/);

  // Fields to search
  const searchableText = [
    entry.id,
    entry.stack.archetype,
    entry.stack.language,
    entry.stack.framework,
    entry.stack.runtime,
    entry.stack.database,
    entry.stack.orm,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // All search terms must match (directly or via alias)
  return searchTerms.every(term => {
    if (searchableText.includes(term)) return true;
    // Check aliases
    const aliases = SEARCH_ALIASES[term];
    if (aliases) {
      return aliases.some(alias => searchableText.includes(alias));
    }
    return false;
  });
}

/**
 * Check if an entry matches the tags filter
 */
function entryMatchesTags(entry: RegistryEntry, tags: string[]): boolean {
  const entryTags = [
    entry.stack.archetype,
    entry.stack.language,
    entry.stack.framework,
    entry.stack.runtime,
    entry.stack.database,
    entry.stack.orm,
  ]
    .filter(Boolean)
    .map(t => t.toLowerCase());

  // All specified tags must be present
  return tags.every(tag => entryTags.includes(tag.toLowerCase()));
}

/**
 * Format an entry for display
 */
function formatEntry(entry: RegistryEntry): string {
  const id = pc.bold(pc.cyan(entry.id));
  const seed = pc.dim(`(seed: ${entry.seed})`);
  const stack = [
    pc.yellow(entry.stack.archetype),
    pc.green(entry.stack.language),
    entry.stack.framework !== 'none' ? pc.magenta(entry.stack.framework) : null,
    entry.stack.database !== 'none' ? pc.blue(entry.stack.database) : null,
  ]
    .filter(Boolean)
    .join(' + ');

  return `  ${id} ${seed}\n    ${stack}`;
}

/**
 * Execute the search command
 */
export async function searchAction(query: string, options: SearchOptions): Promise<void> {
  const limit = parseInt(options.limit, 10) || 10;
  const tagFilter = options.tags ? options.tags.split(',').map(t => t.trim()) : [];

  // Determine source
  let registry: RegistryManifest | null = null;
  let source = 'remote';

  if (options.local) {
    // Force local only
    registry = await loadLocalRegistry();
    source = 'local';
  } else if (options.remote) {
    // Force remote only
    registry = await fetchRemoteRegistry();
    source = 'remote';
  } else {
    // Try remote first, fallback to local
    registry = await fetchRemoteRegistry();
    if (!registry) {
      registry = await loadLocalRegistry();
      source = 'local (remote unavailable)';
    }
  }

  if (!registry || registry.entries.length === 0) {
    console.error(pc.red('Error: Could not load registry.'));
    console.error(pc.dim('The registry may be empty or unavailable.'));
    console.error('');
    console.error('To populate the local registry, run:');
    console.error(pc.cyan('  npx tsx scripts/seed-registry.ts --count 50'));
    console.error('');
    console.error('Or use `upg sweep` to generate and save entries:');
    console.error(
      pc.cyan('  upg sweep --count 50 --save-registry ./registry/manifests/generated.json')
    );
    process.exit(1);
  }

  // Filter entries
  let results = registry.entries;

  // Apply query filter
  if (query && query !== '*') {
    results = results.filter(entry => entryMatchesQuery(entry, query));
  }

  // Apply tag filter
  if (tagFilter.length > 0) {
    results = results.filter(entry => entryMatchesTags(entry, tagFilter));
  }

  // Apply limit
  const totalMatches = results.length;
  results = results.slice(0, limit);

  // Display results
  console.log('');
  console.log(pc.bold(`Search results for "${query}"`) + pc.dim(` (source: ${source})`));
  console.log('');

  if (results.length === 0) {
    console.log(pc.yellow('No matching projects found.'));
    console.log('');

    // Check if relaxing query (tags-only) would produce matches
    if (query && query !== '*' && tagFilter.length > 0) {
      const tagOnlyResults = registry.entries.filter(entry => entryMatchesTags(entry, tagFilter));
      if (tagOnlyResults.length > 0) {
        console.log(
          pc.yellow(`Did you mean: ${pc.cyan(`upg search "*" --tags "${tagFilter.join(',')}"`)}`)
        );
        console.log(
          pc.dim(`  (${tagOnlyResults.length} entries match the tags without the query filter)`)
        );
        console.log('');
      }
    }

    console.log('Tips:');
    console.log('  - Try a broader search term');
    console.log('  - Search by archetype: backend, web, cli, mobile, desktop');
    console.log('  - Search by language: typescript, python, go, rust');
    console.log('  - Search by framework: express, fastapi, gin, axum');
    console.log('');
    console.log(pc.dim(`Registry contains ${registry.entries.length} entries`));
  } else {
    for (const entry of results) {
      console.log(formatEntry(entry));
      console.log('');
    }

    if (totalMatches > results.length) {
      console.log(
        pc.dim(`Showing ${results.length} of ${totalMatches} matches. Use --limit to see more.`)
      );
      console.log('');
    }

    console.log(pc.dim('─'.repeat(50)));
    console.log('');
    console.log('To generate a project from a seed, use:');
    console.log(pc.cyan(`  upg seed <seed-number> --output ./my-project`));
    console.log('');
    console.log('Example:');
    console.log(
      pc.cyan(`  upg seed ${results[0].seed} --output ./my-${results[0].stack.framework}-app`)
    );
  }
}
