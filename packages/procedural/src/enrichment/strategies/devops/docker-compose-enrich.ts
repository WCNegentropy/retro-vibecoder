/**
 * Docker Compose Enrichment Strategy
 *
 * Enhances docker-compose.yml with:
 * - Health checks for services
 * - Restart policies
 * - Named volumes
 * - Network configuration
 * - Database service if stack uses one
 */

import type {
  EnrichmentStrategy,
  TechStack,
  EnrichmentFlags,
  EnrichmentContext,
} from '../../../types.js';

function generateEnhancedCompose(ctx: EnrichmentContext): string {
  const { stack, projectName, introspect } = ctx;
  const ports = introspect.getExposedPorts();
  const port = ports[0] ?? 3000;

  const envVarName = ['typescript', 'javascript'].includes(stack.language) ? 'NODE_ENV' :
    stack.language === 'go' ? 'GIN_MODE' :
    stack.language === 'rust' ? 'RUST_LOG' :
    stack.language === 'python' ? 'PYTHONENV' : 'APP_ENV';
  const envVarValue = stack.language === 'rust' ? 'info' : 'production';

  let services = `services:
  app:
    build: .
    container_name: ${projectName}-app
    ports:
      - "${port}:${port}"
    environment:
      - ${envVarName}=${envVarValue}
      - PORT=${port}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${port}/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
`;

  // Add database service
  switch (stack.database) {
    case 'postgres':
      services += `    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://app:app@postgres:5432/${projectName.replace(/-/g, '_')}

  postgres:
    image: postgres:16-alpine
    container_name: ${projectName}-postgres
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: ${projectName.replace(/-/g, '_')}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 10s
      timeout: 5s
      retries: 5
`;
      break;

    case 'mysql':
      services += `    depends_on:
      mysql:
        condition: service_healthy
    environment:
      - DATABASE_URL=mysql://app:app@mysql:3306/${projectName.replace(/-/g, '_')}

  mysql:
    image: mysql:8
    container_name: ${projectName}-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: ${projectName.replace(/-/g, '_')}
      MYSQL_USER: app
      MYSQL_PASSWORD: app
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
`;
      break;

    case 'mongodb':
      services += `    depends_on:
      mongo:
        condition: service_healthy
    environment:
      - MONGODB_URI=mongodb://mongo:27017/${projectName.replace(/-/g, '_')}

  mongo:
    image: mongo:7
    container_name: ${projectName}-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.runCommand('ping').ok"]
      interval: 10s
      timeout: 5s
      retries: 5
`;
      break;

    case 'redis':
      services += `    depends_on:
      redis:
        condition: service_healthy
    environment:
      - REDIS_URL=redis://redis:6379

  redis:
    image: redis:7-alpine
    container_name: ${projectName}-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
`;
      break;
  }

  // Volumes
  const volumes: string[] = [];
  if (stack.database === 'postgres') volumes.push('  postgres_data:');
  if (stack.database === 'mysql') volumes.push('  mysql_data:');
  if (stack.database === 'mongodb') volumes.push('  mongo_data:');
  if (stack.database === 'redis') volumes.push('  redis_data:');

  if (volumes.length > 0) {
    services += `\nvolumes:\n${volumes.join('\n')}\n`;
  }

  return services;
}

export const DockerComposeEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-docker-compose',
  name: 'Docker Compose Enrichment',
  priority: 42,

  matches: (stack: TechStack, flags: EnrichmentFlags) =>
    flags.dockerProd && stack.packaging === 'docker' && stack.database !== 'none'
    && !['desktop', 'game', 'mobile'].includes(stack.archetype),

  apply: async (context: EnrichmentContext) => {
    context.files['docker-compose.yml'] = generateEnhancedCompose(context);
  },
};
