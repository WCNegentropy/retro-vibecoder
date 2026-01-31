#!/usr/bin/env npx tsx
/**
 * Registry Seed Script
 *
 * Populates the registry with procedurally generated project manifests.
 * This script generates real projects using the Universal Matrix and
 * stores validated entries in the registry.
 *
 * Usage:
 *   npx tsx scripts/seed-registry.ts [--count N] [--start-seed N]
 *
 * The registry is used by:
 * - `upg search` to find templates
 * - Desktop app's seed gallery
 * - Documentation examples
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, '..', 'registry', 'manifests', 'generated.json');

// Parse command line arguments
function parseArgs(): { count: number; startSeed: number } {
  const args = process.argv.slice(2);
  let count = 50;
  let startSeed = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      count = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--start-seed' && args[i + 1]) {
      startSeed = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return { count, startSeed };
}

/**
 * Registry entry structure matching the existing schema
 */
interface RegistryEntry {
  seed: number;
  id: string;
  license: 'MIT';
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

interface RegistryManifest {
  version: string;
  generatedAt: string;
  totalEntries: number;
  entries: RegistryEntry[];
}

async function main() {
  const { count, startSeed } = parseArgs();

  console.log(`\n🌱 Seeding registry with ${count} projects starting from seed ${startSeed}...\n`);

  // Dynamic import of procedural package - use relative path for workspace resolution
  const { ProjectAssembler, AllStrategies } = await import('../packages/procedural/dist/index.js');

  // Load existing registry or create new
  let existingManifest: RegistryManifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalEntries: 0,
    entries: [],
  };

  try {
    const existing = await readFile(REGISTRY_PATH, 'utf-8');
    existingManifest = JSON.parse(existing);
    console.log(`📂 Loaded existing registry with ${existingManifest.entries.length} entries`);
  } catch {
    console.log('📂 Creating new registry');
  }

  const existingSeeds = new Set(existingManifest.entries.map(e => e.seed));
  const newEntries: RegistryEntry[] = [];
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < count; i++) {
    const seed = startSeed + i;

    // Skip if already in registry
    if (existingSeeds.has(seed)) {
      skipCount++;
      continue;
    }

    try {
      const assembler = new ProjectAssembler(seed, {});
      assembler.registerStrategies(AllStrategies);

      const project = await assembler.generate();

      const entry: RegistryEntry = {
        seed,
        id: project.id,
        license: 'MIT',
        stack: {
          archetype: project.stack.archetype,
          language: project.stack.language,
          framework: project.stack.framework,
          runtime: project.stack.runtime,
          database: project.stack.database,
          orm: project.stack.orm,
        },
        files: Object.keys(project.files),
        validatedAt: new Date().toISOString(),
        upgVersion: '1.0.0',
      };

      newEntries.push(entry);
      successCount++;

      // Progress indicator
      if ((i + 1) % 10 === 0 || i === count - 1) {
        process.stdout.write(
          `\r  Progress: ${i + 1}/${count} (${successCount} new, ${skipCount} skipped, ${failCount} failed)`
        );
      }
    } catch (error) {
      failCount++;
      console.error(
        `\n  ⚠ Seed ${seed} failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  console.log('\n');

  if (newEntries.length === 0) {
    console.log('✓ No new entries to add. Registry is up to date.\n');
    return;
  }

  // Merge and sort entries
  const allEntries = [...existingManifest.entries, ...newEntries];
  allEntries.sort((a, b) => a.seed - b.seed);

  // Create updated manifest
  const updatedManifest: RegistryManifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalEntries: allEntries.length,
    entries: allEntries,
  };

  // Ensure directory exists
  await mkdir(dirname(REGISTRY_PATH), { recursive: true });

  // Write manifest
  await writeFile(REGISTRY_PATH, JSON.stringify(updatedManifest, null, 2), 'utf-8');

  console.log(`✓ Registry updated successfully!`);
  console.log(`  Total entries: ${allEntries.length}`);
  console.log(`  New entries added: ${newEntries.length}`);
  console.log(`  Skipped (already exists): ${skipCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`\n  Written to: ${REGISTRY_PATH}\n`);

  // Print some statistics about the generated entries
  const archetypes = new Map<string, number>();
  const languages = new Map<string, number>();
  const frameworks = new Map<string, number>();

  for (const entry of newEntries) {
    archetypes.set(entry.stack.archetype, (archetypes.get(entry.stack.archetype) || 0) + 1);
    languages.set(entry.stack.language, (languages.get(entry.stack.language) || 0) + 1);
    frameworks.set(entry.stack.framework, (frameworks.get(entry.stack.framework) || 0) + 1);
  }

  console.log('📊 Distribution of new entries:');
  console.log('  Archetypes:', Object.fromEntries(archetypes));
  console.log('  Languages:', Object.fromEntries(languages));
  console.log('  Frameworks:', Object.fromEntries(frameworks));
  console.log('');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
