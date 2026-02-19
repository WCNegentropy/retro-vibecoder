/**
 * Environment Files Enrichment Strategy
 *
 * Generates .env.example files based on the project stack:
 * - Database connection strings
 * - API keys placeholders
 * - Port configuration
 * - Runtime-specific variables
 */

import type {
  EnrichmentStrategy,
  TechStack,
  EnrichmentFlags,
  EnrichmentContext,
} from '../../../types.js';

function generateEnvExample(ctx: EnrichmentContext): string {
  const { stack, introspect } = ctx;
  const ports = introspect.getExposedPorts();
  const port = ports[0] ?? 3000;

  const envVarName = ['typescript', 'javascript'].includes(stack.language)
    ? 'NODE_ENV'
    : stack.language === 'go'
      ? 'GIN_MODE'
      : stack.language === 'rust'
        ? 'RUST_LOG'
        : stack.language === 'python'
          ? 'PYTHONENV'
          : 'APP_ENV';
  const envVarValue = stack.language === 'rust' ? 'debug' : 'development';

  const lines: string[] = [
    '# ─── Application ────────────────────────────────────────────',
    `${envVarName}=${envVarValue}`,
    `PORT=${port}`,
    `HOST=0.0.0.0`,
    '',
  ];

  // Database
  if (stack.database !== 'none') {
    lines.push('# ─── Database ──────────────────────────────────────────────');
    switch (stack.database) {
      case 'postgres':
        lines.push('DATABASE_URL=postgresql://user:password@localhost:5432/mydb');
        lines.push('DB_HOST=localhost');
        lines.push('DB_PORT=5432');
        lines.push('DB_USER=user');
        lines.push('DB_PASSWORD=password');
        lines.push('DB_NAME=mydb');
        break;
      case 'mysql':
        lines.push('DATABASE_URL=mysql://user:password@localhost:3306/mydb');
        lines.push('DB_HOST=localhost');
        lines.push('DB_PORT=3306');
        lines.push('DB_USER=user');
        lines.push('DB_PASSWORD=password');
        lines.push('DB_NAME=mydb');
        break;
      case 'sqlite':
        lines.push('DATABASE_URL=file:./dev.db');
        break;
      case 'mongodb':
        lines.push('MONGODB_URI=mongodb://localhost:27017/mydb');
        break;
      case 'redis':
        lines.push('REDIS_URL=redis://localhost:6379');
        break;
    }
    lines.push('');
  }

  // Auth
  if (stack.archetype === 'backend') {
    lines.push('# ─── Authentication ────────────────────────────────────────');
    lines.push('JWT_SECRET=change-me-in-production');
    lines.push('JWT_EXPIRATION=24h');
    lines.push('');
  }

  // API transport
  if (stack.transport === 'graphql') {
    lines.push('# ─── GraphQL ───────────────────────────────────────────────');
    lines.push('GRAPHQL_PLAYGROUND=true');
    lines.push('GRAPHQL_DEBUG=true');
    lines.push('');
  }

  // Logging
  lines.push('# ─── Logging ───────────────────────────────────────────────');
  lines.push('LOG_LEVEL=debug');
  lines.push('');

  // CORS (for APIs)
  if (stack.archetype === 'backend') {
    lines.push('# ─── CORS ──────────────────────────────────────────────────');
    lines.push('CORS_ORIGIN=http://localhost:3000');
    lines.push('');
  }

  return lines.join('\n');
}

function generateGitignoreAdditions(_stack: TechStack): string {
  const lines: string[] = ['# Environment files', '.env', '.env.local', '.env.*.local', ''];

  return lines.join('\n');
}

export const EnvFilesEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-env-files',
  name: 'Environment File Generation',
  priority: 5,

  matches: (stack: TechStack, flags: EnrichmentFlags) =>
    flags.envFiles && (stack.archetype === 'backend' || stack.database !== 'none'),

  apply: async (context: EnrichmentContext) => {
    const { files, introspect, stack } = context;

    // Generate .env.example
    if (!introspect.hasFile('.env.example')) {
      files['.env.example'] = generateEnvExample(context);
    }

    // Ensure .env is in .gitignore
    const gitignore = introspect.getContent('.gitignore');
    if (gitignore && !gitignore.includes('.env')) {
      files['.gitignore'] = gitignore + '\n' + generateGitignoreAdditions(stack);
    }
  },
};
