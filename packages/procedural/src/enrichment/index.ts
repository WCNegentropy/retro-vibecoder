/**
 * Enrichment Module (Pass 2)
 *
 * Barrel export for the enrichment engine, introspector, and all strategies.
 */

import type { EnrichmentStrategy } from '../types.js';

// Re-export enrichment types from types.ts for convenience
export {
  DEFAULT_ENRICHMENT_FLAGS,
  type EnrichmentDepth,
  type EnrichmentFlags,
  type EnrichmentContext,
  type EnrichmentStrategy,
  type EnrichedProject,
  type EnrichmentMetadata,
  type FileIntrospector,
  type ParsedManifest,
} from '../types.js';

// Engine
export { ProjectEnricher, type EnricherOptions } from './engine/enricher.js';
export { ProjectIntrospector } from './engine/introspector.js';

// CI/CD Strategies
export { GitHubActionsEnrichStrategy } from './strategies/cicd/github-actions-enrich.js';
export { GitLabCIEnrichStrategy } from './strategies/cicd/gitlab-ci-enrich.js';
export { ReleaseWorkflowStrategy } from './strategies/cicd/release.js';

// Quality Strategies
export { LintingEnrichStrategy } from './strategies/quality/linting.js';
export { EnvFilesEnrichStrategy } from './strategies/quality/env-files.js';

// Docs Strategies
export { ReadmeEnrichStrategy } from './strategies/docs/readme-enrich.js';

// Logic Fill Strategies (Phase 2)
export { ApiRoutesEnrichStrategy } from './strategies/logic/api-routes.js';
export { CliCommandsEnrichStrategy } from './strategies/logic/cli-commands.js';
export { ModelsEnrichStrategy } from './strategies/logic/models.js';
export { MiddlewareEnrichStrategy } from './strategies/logic/middleware.js';
export { WebComponentsEnrichStrategy } from './strategies/logic/web-components.js';

// Testing Strategies (Phase 2)
export { UnitTestEnrichStrategy } from './strategies/testing/unit-tests.js';
export { IntegrationTestEnrichStrategy } from './strategies/testing/integration-tests.js';
export { TestConfigEnrichStrategy } from './strategies/testing/test-config.js';

// DevOps Strategies (Phase 2)
export { DockerProdEnrichStrategy } from './strategies/devops/docker-prod.js';
export { DockerComposeEnrichStrategy } from './strategies/devops/docker-compose-enrich.js';

// Imports for AllEnrichmentStrategies
import { GitHubActionsEnrichStrategy } from './strategies/cicd/github-actions-enrich.js';
import { GitLabCIEnrichStrategy } from './strategies/cicd/gitlab-ci-enrich.js';
import { ReleaseWorkflowStrategy } from './strategies/cicd/release.js';
import { LintingEnrichStrategy } from './strategies/quality/linting.js';
import { EnvFilesEnrichStrategy } from './strategies/quality/env-files.js';
import { ReadmeEnrichStrategy } from './strategies/docs/readme-enrich.js';
import { ApiRoutesEnrichStrategy } from './strategies/logic/api-routes.js';
import { CliCommandsEnrichStrategy } from './strategies/logic/cli-commands.js';
import { ModelsEnrichStrategy } from './strategies/logic/models.js';
import { MiddlewareEnrichStrategy } from './strategies/logic/middleware.js';
import { WebComponentsEnrichStrategy } from './strategies/logic/web-components.js';
import { UnitTestEnrichStrategy } from './strategies/testing/unit-tests.js';
import { IntegrationTestEnrichStrategy } from './strategies/testing/integration-tests.js';
import { TestConfigEnrichStrategy } from './strategies/testing/test-config.js';
import { DockerProdEnrichStrategy } from './strategies/devops/docker-prod.js';
import { DockerComposeEnrichStrategy } from './strategies/devops/docker-compose-enrich.js';

/**
 * All built-in enrichment strategies, sorted by priority.
 */
export const AllEnrichmentStrategies: EnrichmentStrategy[] = [
  // Phase 1: CI/CD, Quality, Docs (priority 5-90)
  LintingEnrichStrategy,
  EnvFilesEnrichStrategy,
  GitHubActionsEnrichStrategy,
  GitLabCIEnrichStrategy,
  ReleaseWorkflowStrategy,

  // Phase 2: Logic Fill (priority 20-25)
  ModelsEnrichStrategy,
  ApiRoutesEnrichStrategy,
  CliCommandsEnrichStrategy,
  MiddlewareEnrichStrategy,
  WebComponentsEnrichStrategy,

  // Phase 2: Testing (priority 30-35)
  TestConfigEnrichStrategy,
  UnitTestEnrichStrategy,
  IntegrationTestEnrichStrategy,

  // Phase 2: DevOps (priority 40-45)
  DockerProdEnrichStrategy,
  DockerComposeEnrichStrategy,

  // Phase 1: Docs (priority 90 — last)
  ReadmeEnrichStrategy,
].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
