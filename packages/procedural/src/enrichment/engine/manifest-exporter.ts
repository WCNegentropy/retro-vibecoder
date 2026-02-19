/**
 * Manifest Exporter — Reverse manifest generation
 *
 * Takes a generated/enriched project directory and produces a `upg.yaml`
 * manifest that would reproduce the enriched output when used with
 * `upg generate`.
 *
 * This closes the loop:
 *   seed 42 --enrich → files on disk → upg eject → upg.yaml → upg generate
 */

import type { ProjectFiles, EnrichmentFlags } from '../../types.js';
import { inferStack } from './stack-inferrer.js';

/** Options for manifest export */
export interface ExportManifestOptions {
  /** Project name (defaults to directory name) */
  name?: string;
  /** Project version */
  version?: string;
  /** Enrichment flags that were used (if known) */
  enrichmentFlags?: EnrichmentFlags;
}

/** Exported manifest structure */
export interface ExportedManifest {
  apiVersion: string;
  metadata: {
    name: string;
    version: string;
    description: string;
    tags: string[];
  };
  prompts: Array<{
    id: string;
    type: string;
    message: string;
    default: string;
  }>;
  actions: Array<{
    type: string;
    src: string;
    dest: string;
  }>;
  enrichment?: {
    enabled: boolean;
    depth: string;
    cicd?: boolean;
    release?: boolean;
    fillLogic?: boolean;
    tests?: boolean;
    dockerProd?: boolean;
    linting?: boolean;
    envFiles?: boolean;
    docs?: boolean;
  };
}

/**
 * Export a UPG manifest from a set of project files.
 *
 * Analyzes the project to infer the tech stack, then builds a manifest
 * that can reproduce the project via `upg generate`.
 */
export function exportManifest(
  files: ProjectFiles,
  options: ExportManifestOptions = {}
): ExportedManifest {
  const { stack, confidence: _confidence } = inferStack(files);

  const name = options.name ?? 'exported-project';
  const version = options.version ?? '1.0.0';

  // Build tags from detected stack
  const tags: string[] = [stack.archetype, stack.language];
  if (stack.framework !== 'none') tags.push(stack.framework);
  if (stack.database !== 'none') tags.push(stack.database);

  // Build the manifest
  const manifest: ExportedManifest = {
    apiVersion: 'upg/v1',
    metadata: {
      name,
      version,
      description: `Generated ${stack.archetype} project using ${stack.language}${stack.framework !== 'none' ? ` + ${stack.framework}` : ''}`,
      tags,
    },
    prompts: [
      {
        id: 'project_name',
        type: 'string',
        message: 'Project name',
        default: name,
      },
    ],
    actions: [
      {
        type: 'generate',
        src: 'template/',
        dest: '{{ project_name }}',
      },
    ],
  };

  // Include enrichment block if flags were provided
  if (options.enrichmentFlags) {
    const flags = options.enrichmentFlags;
    manifest.enrichment = {
      enabled: flags.enabled,
      depth: flags.depth,
      cicd: flags.cicd,
      release: flags.release,
      fillLogic: flags.fillLogic,
      tests: flags.tests,
      dockerProd: flags.dockerProd,
      linting: flags.linting,
      envFiles: flags.envFiles,
      docs: flags.docs,
    };
  }

  return manifest;
}
