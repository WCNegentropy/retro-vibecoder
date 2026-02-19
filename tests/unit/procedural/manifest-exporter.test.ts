/**
 * Manifest Exporter tests
 *
 * Tests for the reverse manifest generation:
 * - Produces valid manifest structure
 * - Infers tags from detected stack
 * - Includes enrichment config when flags provided
 * - Handles empty projects gracefully
 */

import { describe, it, expect } from 'vitest';
import { exportManifest } from '../../../packages/procedural/src/enrichment/engine/manifest-exporter.js';
import { DEFAULT_ENRICHMENT_FLAGS } from '../../../packages/procedural/src/types.js';
import type { ProjectFiles } from '../../../packages/procedural/src/types.js';

describe('exportManifest', () => {
  it('produces a valid manifest structure', () => {
    const files: ProjectFiles = {
      'package.json': JSON.stringify({
        dependencies: { express: '^4.18.0' },
        devDependencies: { typescript: '^5.0.0' },
      }),
      'src/index.ts': 'import express from "express";',
    };

    const manifest = exportManifest(files, { name: 'my-api', version: '1.0.0' });

    expect(manifest.apiVersion).toBe('upg/v1');
    expect(manifest.metadata.name).toBe('my-api');
    expect(manifest.metadata.version).toBe('1.0.0');
    expect(manifest.metadata.description).toContain('backend');
    expect(manifest.metadata.tags).toContain('typescript');
    expect(manifest.metadata.tags).toContain('express');
    expect(manifest.prompts).toHaveLength(1);
    expect(manifest.prompts[0].id).toBe('project_name');
    expect(manifest.actions).toHaveLength(1);
    expect(manifest.actions[0].type).toBe('generate');
  });

  it('uses default name and version when not provided', () => {
    const files: ProjectFiles = { 'README.md': '# Hello' };
    const manifest = exportManifest(files);

    expect(manifest.metadata.name).toBe('exported-project');
    expect(manifest.metadata.version).toBe('1.0.0');
  });

  it('includes enrichment config when flags are provided', () => {
    const files: ProjectFiles = {
      'package.json': JSON.stringify({ dependencies: { express: '^4' } }),
    };
    const flags = DEFAULT_ENRICHMENT_FLAGS['standard'];

    const manifest = exportManifest(files, {
      name: 'test',
      enrichmentFlags: flags,
    });

    expect(manifest.enrichment).toBeDefined();
    expect(manifest.enrichment!.enabled).toBe(true);
    expect(manifest.enrichment!.depth).toBe('standard');
    expect(manifest.enrichment!.cicd).toBeDefined();
  });

  it('omits enrichment block when no flags provided', () => {
    const files: ProjectFiles = { 'README.md': '' };
    const manifest = exportManifest(files);

    expect(manifest.enrichment).toBeUndefined();
  });

  it('generates tags from detected stack', () => {
    const files: ProjectFiles = {
      'Cargo.toml': `[package]\nname = "my-app"\n\n[dependencies]\naxum = "0.6"`,
      'src/main.rs': 'fn main() {}',
    };

    const manifest = exportManifest(files, { name: 'rust-api' });

    expect(manifest.metadata.tags).toContain('rust');
    expect(manifest.metadata.tags).toContain('axum');
    expect(manifest.metadata.tags).toContain('backend');
  });

  it('handles empty project files', () => {
    const files: ProjectFiles = {};
    const manifest = exportManifest(files);

    expect(manifest.apiVersion).toBe('upg/v1');
    expect(manifest.metadata.tags.length).toBeGreaterThan(0);
  });
});
