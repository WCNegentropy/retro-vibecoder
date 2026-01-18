/**
 * TypeScript interfaces for the Registry system
 */

import type { Lifecycle, ManifestMetadata } from './manifest.js';

/**
 * Template entry in the registry
 */
export interface RegistryEntry {
  /** API version of the registry entry */
  apiVersion: string;
  /** Template metadata */
  metadata: RegistryMetadata;
  /** Template specification */
  spec: RegistrySpec;
}

/**
 * Registry-specific metadata
 */
export interface RegistryMetadata extends ManifestMetadata {
  /** Published timestamp */
  publishedAt?: string;
  /** Last updated timestamp */
  updatedAt?: string;
  /** Download count */
  downloads?: number;
}

/**
 * Registry specification
 */
export interface RegistrySpec {
  /** URL to the template source */
  sourceUrl: string;
  /** Lifecycle state */
  lifecycle: Lifecycle;
  /** Owner team/individual */
  owner: string;
  /** Search keywords */
  keywords?: string[];
  /** Minimum UPG version required */
  minUpgVersion?: string;
}

/**
 * Registry index for a template (points to versions)
 */
export interface RegistryIndex {
  /** Template name */
  name: string;
  /** Latest version */
  latest: string;
  /** All available versions */
  versions: string[];
  /** Version metadata map */
  versionMetadata: Record<string, VersionMetadata>;
}

/**
 * Version-specific metadata
 */
export interface VersionMetadata {
  /** Version string */
  version: string;
  /** Published timestamp */
  publishedAt: string;
  /** Whether this version is deprecated */
  deprecated?: boolean;
  /** Deprecation message */
  deprecationMessage?: string;
}

/**
 * Registry catalog (top-level metadata)
 */
export interface RegistryCatalog {
  /** Registry name */
  name: string;
  /** Registry description */
  description: string;
  /** Registry URL */
  url: string;
  /** Last updated timestamp */
  updatedAt: string;
  /** Number of templates */
  templateCount: number;
  /** Owner/maintainer */
  owner: string;
}

/**
 * Search query parameters
 */
export interface RegistrySearchQuery {
  /** Search term */
  query?: string;
  /** Filter by tags */
  tags?: string[];
  /** Filter by lifecycle */
  lifecycle?: Lifecycle[];
  /** Filter by owner */
  owner?: string;
  /** Maximum results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort field */
  sortBy?: 'name' | 'downloads' | 'updatedAt' | 'publishedAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search results
 */
export interface RegistrySearchResult {
  /** Total matching entries */
  total: number;
  /** Returned entries */
  entries: RegistryEntry[];
  /** Query that was executed */
  query: RegistrySearchQuery;
}

/**
 * Registry source configuration
 */
export interface RegistrySource {
  /** Source name */
  name: string;
  /** Git URL */
  url: string;
  /** Branch to use */
  branch?: string;
  /** Whether this source is enabled */
  enabled: boolean;
  /** Priority (lower = higher priority) */
  priority: number;
  /** Last sync timestamp */
  lastSync?: string;
}
