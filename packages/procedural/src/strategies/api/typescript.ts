/**
 * TypeScript Backend Strategies
 *
 * Generates TypeScript/Node.js backend projects (Express, Fastify, NestJS).
 * Tier 1 stacks (Express, Fastify) load templates from templates/procedural/.
 */

import type { GenerationStrategy } from '../../types.js';
import { renderTemplateSet, getTemplateSetId, type TemplateContext } from '../../renderer/index.js';

/**
 * Shared ESLint flat config for generated TypeScript projects
 */
const eslintConfig = `import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**'],
  }
);
`;

/**
 * Build a TemplateContext from the generation context
 */
function buildTemplateContext(
  projectName: string,
  stack: {
    language: string;
    database: string;
    orm: string;
    framework: string;
    archetype: string;
    runtime: string;
    transport: string;
    packaging: string;
    cicd: string;
  }
): TemplateContext {
  return {
    projectName,
    isTypeScript: stack.language === 'typescript',
    database: stack.database,
    orm: stack.orm,
    framework: stack.framework,
    archetype: stack.archetype,
    language: stack.language,
    runtime: stack.runtime,
    transport: stack.transport,
    packaging: stack.packaging,
    cicd: stack.cicd,
  };
}

/**
 * Apply rendered template files, filtering for TypeScript or JavaScript.
 * Skips JS-only files for TS projects and vice versa.
 */
function applyRenderedFiles(
  files: Record<string, string>,
  rendered: Record<string, string>,
  isTypeScript: boolean
): void {
  for (const [path, content] of Object.entries(rendered)) {
    if (isTypeScript) {
      // Skip JS-only files
      if (path === 'src/index.mjs' || path === 'jsconfig.json') continue;
    } else {
      // Skip TS-only files
      if (path === 'src/index.ts' || path === 'tsconfig.json' || path === 'tsup.config.ts')
        continue;
      // Rename test file for JS
      if (path === 'src/index.test.ts') {
        files['src/index.test.mjs'] = content;
        continue;
      }
    }
    files[path] = content;
  }
}

/**
 * Express.js backend strategy
 * Supports both TypeScript and JavaScript
 */
export const ExpressStrategy: GenerationStrategy = {
  id: 'express',
  name: 'Express Backend',
  priority: 10,

  matches: stack =>
    (stack.language === 'typescript' || stack.language === 'javascript') &&
    stack.archetype === 'backend' &&
    stack.framework === 'express',

  apply: async ({ files, projectName, stack }) => {
    const isTypeScript = stack.language === 'typescript';
    const templateCtx = buildTemplateContext(projectName, stack);

    // Try to load from Nunjucks templates
    const templateSetId = getTemplateSetId(stack.archetype, stack.language, stack.framework);
    if (templateSetId) {
      const rendered = renderTemplateSet(templateSetId, templateCtx);
      if (Object.keys(rendered).length > 0) {
        applyRenderedFiles(files, rendered, isTypeScript);

        // Add ESLint config if not already present
        if (!files['eslint.config.js']) {
          files['eslint.config.js'] = eslintConfig;
        }

        // Add database setup if needed (not templated yet)
        if (stack.orm === 'prisma' && stack.database !== 'none') {
          addPrismaSetup(files, projectName, stack.database, isTypeScript);
        }

        return;
      }
    }

    // package.json - different for TS vs JS
    const pkg: Record<string, unknown> = {
      name: projectName,
      version: '0.1.0',
      type: 'module',
      scripts: isTypeScript
        ? {
            dev: 'tsx watch src/index.ts',
            build: 'tsup',
            start: 'node dist/index.js',
            test: 'vitest',
            lint: 'eslint src/',
            typecheck: 'tsc --noEmit',
          }
        : {
            dev: 'node --watch src/index.mjs',
            start: 'node src/index.mjs',
            test: 'vitest',
            lint: 'eslint src/',
          },
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        helmet: '^7.1.0',
        'express-async-errors': '^3.1.1',
      },
      devDependencies: isTypeScript
        ? {
            '@types/express': '^4.17.21',
            '@types/cors': '^2.8.17',
            '@types/node': '^20.11.0',
            tsup: '^8.0.0',
            tsx: '^4.7.0',
            typescript: '^5.3.0',
            vitest: '^1.2.0',
            eslint: '^8.56.0',
          }
        : {
            vitest: '^1.2.0',
            eslint: '^8.56.0',
          },
    };
    files['package.json'] = JSON.stringify(pkg, null, 2);

    // TypeScript-specific files
    if (isTypeScript) {
      // tsconfig.json
      files['tsconfig.json'] = JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            outDir: 'dist',
            rootDir: 'src',
            declaration: true,
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2
      );

      // tsup.config.ts
      files['tsup.config.ts'] = `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
});
`;

      // Main entry (TypeScript)
      files['src/index.ts'] = `import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (_req, res) => {
  res.json({ message: 'Welcome to ${projectName} API' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

export { app };
`;
    } else {
      // JavaScript version
      files['src/index.mjs'] = `import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to ${projectName} API' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

export { app };
`;

      // jsconfig.json for better IDE support
      files['jsconfig.json'] = JSON.stringify(
        {
          compilerOptions: {
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            target: 'ES2022',
            checkJs: true,
          },
          include: ['src/**/*'],
          exclude: ['node_modules'],
        },
        null,
        2
      );
    }

    // Add ESLint config
    files['eslint.config.js'] = eslintConfig;

    // Add database setup if needed
    if (stack.orm === 'prisma' && stack.database !== 'none') {
      addPrismaSetup(files, projectName, stack.database, isTypeScript);
    }

    // Basic test
    const testExt = isTypeScript ? 'ts' : 'mjs';
    const importExt = isTypeScript ? 'js' : 'mjs';
    files[`src/index.test.${testExt}`] = `import { describe, it, expect } from 'vitest';
import { app } from './index.${importExt}';

describe('API', () => {
  it('should respond to health check', async () => {
    // Basic test placeholder
    expect(app).toBeDefined();
  });
});
`;
  },
};

/**
 * Fastify backend strategy
 * Supports both TypeScript and JavaScript
 */
export const FastifyStrategy: GenerationStrategy = {
  id: 'fastify',
  name: 'Fastify Backend',
  priority: 10,

  matches: stack =>
    (stack.language === 'typescript' || stack.language === 'javascript') &&
    stack.archetype === 'backend' &&
    stack.framework === 'fastify',

  apply: async ({ files, projectName, stack }) => {
    const isTypeScript = stack.language === 'typescript';
    const templateCtx = buildTemplateContext(projectName, stack);

    // Try to load from Nunjucks templates
    const templateSetId = getTemplateSetId(stack.archetype, stack.language, stack.framework);
    if (templateSetId) {
      const rendered = renderTemplateSet(templateSetId, templateCtx);
      if (Object.keys(rendered).length > 0) {
        applyRenderedFiles(files, rendered, isTypeScript);

        // Add ESLint config if not already present
        if (!files['eslint.config.js']) {
          files['eslint.config.js'] = eslintConfig;
        }

        if (stack.orm === 'prisma' && stack.database !== 'none') {
          addPrismaSetup(files, projectName, stack.database, isTypeScript);
        }

        return;
      }
    }

    // Fallback: inline generation (original code)
    const pkg: Record<string, unknown> = {
      name: projectName,
      version: '0.1.0',
      type: 'module',
      scripts: isTypeScript
        ? {
            dev: 'tsx watch src/index.ts',
            build: 'tsup',
            start: 'node dist/index.js',
            test: 'vitest',
            lint: 'eslint src/',
            typecheck: 'tsc --noEmit',
          }
        : {
            dev: 'node --watch src/index.mjs',
            start: 'node src/index.mjs',
            test: 'vitest',
            lint: 'eslint src/',
          },
      dependencies: {
        fastify: '^4.25.0',
        '@fastify/cors': '^8.5.0',
        '@fastify/helmet': '^11.1.1',
      },
      devDependencies: isTypeScript
        ? {
            '@types/node': '^20.11.0',
            tsup: '^8.0.0',
            tsx: '^4.7.0',
            typescript: '^5.3.0',
            vitest: '^1.2.0',
            eslint: '^8.56.0',
          }
        : {
            vitest: '^1.2.0',
            eslint: '^8.56.0',
          },
    };
    files['package.json'] = JSON.stringify(pkg, null, 2);

    if (isTypeScript) {
      // tsconfig.json
      files['tsconfig.json'] = JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            outDir: 'dist',
            rootDir: 'src',
            declaration: true,
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2
      );

      // tsup.config.ts
      files['tsup.config.ts'] = `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
});
`;

      // Main entry (TypeScript)
      files['src/index.ts'] = `import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

const fastify = Fastify({
  logger: true,
});

// Register plugins
await fastify.register(cors);
await fastify.register(helmet);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// API routes
fastify.get('/api', async () => {
  return { message: 'Welcome to ${projectName} API' };
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export { fastify };
`;
    } else {
      // JavaScript version
      files['jsconfig.json'] = JSON.stringify(
        {
          compilerOptions: {
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            target: 'ES2022',
            checkJs: true,
          },
          include: ['src/**/*'],
          exclude: ['node_modules'],
        },
        null,
        2
      );

      files['src/index.mjs'] = `import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

const fastify = Fastify({
  logger: true,
});

// Register plugins
await fastify.register(cors);
await fastify.register(helmet);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// API routes
fastify.get('/api', async () => {
  return { message: 'Welcome to ${projectName} API' };
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export { fastify };
`;
    }

    // Add ESLint config
    files['eslint.config.js'] = eslintConfig;

    // Add database setup if needed
    if (stack.orm === 'prisma' && stack.database !== 'none') {
      addPrismaSetup(files, projectName, stack.database, isTypeScript);
    }

    // Basic test
    const testExt = isTypeScript ? 'ts' : 'mjs';
    const importExt = isTypeScript ? 'js' : 'mjs';
    files[`src/index.test.${testExt}`] = `import { describe, it, expect } from 'vitest';
import { fastify } from './index.${importExt}';

describe('API', () => {
  it('should respond to health check', async () => {
    expect(fastify).toBeDefined();
  });
});
`;
  },
};

/**
 * Add Prisma setup to project files
 */
function addPrismaSetup(
  files: Record<string, string>,
  _projectName: string,
  database: string,
  _isTypeScript: boolean = true
): void {
  // Add prisma dependencies to package.json
  const pkg = JSON.parse(files['package.json']);
  pkg.dependencies['@prisma/client'] = '^5.8.0';
  pkg.devDependencies['prisma'] = '^5.8.0';
  pkg.scripts['db:generate'] = 'prisma generate';
  pkg.scripts['db:push'] = 'prisma db push';
  pkg.scripts['db:migrate'] = 'prisma migrate dev';
  files['package.json'] = JSON.stringify(pkg, null, 2);

  // Determine provider
  let provider = 'postgresql';
  let url = 'postgresql://user:password@localhost:5432/db';

  if (database === 'mysql') {
    provider = 'mysql';
    url = 'mysql://user:password@localhost:3306/db';
  } else if (database === 'sqlite') {
    provider = 'sqlite';
    url = 'file:./dev.db';
  } else if (database === 'mongodb') {
    provider = 'mongodb';
    url = 'mongodb://localhost:27017/db';
  }

  // Prisma schema
  files['prisma/schema.prisma'] = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

  // .env example
  files['.env.example'] = `DATABASE_URL="${url}"
`;
}

/**
 * Add TypeORM setup to a NestJS project (Bug 16)
 */
function addTypeOrmSetup(
  files: Record<string, string>,
  _projectName: string,
  database: string
): void {
  const pkg = JSON.parse(files['package.json']);

  pkg.dependencies['@nestjs/typeorm'] = '^10.0.1';
  pkg.dependencies['typeorm'] = '^0.3.20';

  // Add database driver
  if (database === 'postgres') {
    pkg.dependencies['pg'] = '^8.11.3';
  } else if (database === 'mysql') {
    pkg.dependencies['mysql2'] = '^3.7.0';
  } else if (database === 'sqlite') {
    pkg.dependencies['better-sqlite3'] = '^9.4.3';
  }

  pkg.scripts['db:migration:generate'] = 'typeorm migration:generate';
  pkg.scripts['db:migration:run'] = 'typeorm migration:run';
  files['package.json'] = JSON.stringify(pkg, null, 2);

  // Determine connection config
  let dbType = 'postgres';
  let url = 'postgresql://user:password@localhost:5432/db';
  if (database === 'mysql') {
    dbType = 'mysql';
    url = 'mysql://user:password@localhost:3306/db';
  } else if (database === 'sqlite') {
    dbType = 'sqlite';
    url = './dev.db';
  }

  // Sample entity
  files['src/entities/user.entity.ts'] =
    `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
`;

  // Update app.module.ts to include TypeOrmModule
  if (files['src/app.module.ts']) {
    files['src/app.module.ts'] = `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: '${dbType}',
      url: process.env.DATABASE_URL,
      entities: [User],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;
  }

  // .env example
  files['.env.example'] = `DATABASE_URL="${url}"
`;
}

/**
 * NestJS backend strategy
 */
export const NestJSStrategy: GenerationStrategy = {
  id: 'nestjs',
  name: 'NestJS Backend',
  priority: 10,

  matches: stack =>
    stack.language === 'typescript' &&
    stack.archetype === 'backend' &&
    stack.framework === 'nestjs',

  apply: async ({ files, projectName, stack }) => {
    // package.json
    files['package.json'] = JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        scripts: {
          build: 'nest build',
          start: 'nest start',
          'start:dev': 'nest start --watch',
          'start:prod': 'node dist/main',
          test: 'jest',
          'test:watch': 'jest --watch',
          lint: 'eslint src/',
        },
        dependencies: {
          '@nestjs/common': '^10.3.0',
          '@nestjs/core': '^10.3.0',
          '@nestjs/platform-express': '^10.3.0',
          'reflect-metadata': '^0.2.1',
          rxjs: '^7.8.1',
        },
        devDependencies: {
          '@nestjs/cli': '^10.3.0',
          '@nestjs/testing': '^10.3.0',
          '@types/express': '^4.17.21',
          '@types/jest': '^29.5.11',
          '@types/node': '^20.11.0',
          jest: '^29.7.0',
          'ts-jest': '^29.1.1',
          'ts-node': '^10.9.2',
          typescript: '^5.3.0',
        },
      },
      null,
      2
    );

    // tsconfig.json
    files['tsconfig.json'] = JSON.stringify(
      {
        compilerOptions: {
          module: 'commonjs',
          declaration: true,
          removeComments: true,
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
          allowSyntheticDefaultImports: true,
          target: 'ES2021',
          sourceMap: true,
          outDir: './dist',
          baseUrl: './',
          incremental: true,
          skipLibCheck: true,
          strictNullChecks: true,
          noImplicitAny: true,
          strictBindCallApply: true,
          forceConsistentCasingInFileNames: true,
          noFallthroughCasesInSwitch: true,
        },
      },
      null,
      2
    );

    // nest-cli.json
    files['nest-cli.json'] = JSON.stringify(
      {
        $schema: 'https://json.schemastore.org/nest-cli',
        collection: '@nestjs/schematics',
        sourceRoot: 'src',
      },
      null,
      2
    );

    // Main entry
    files['src/main.ts'] = `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(\`Application is running on: http://localhost:\${port}\`);
}
bootstrap();
`;

    // App module
    files['src/app.module.ts'] = `import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;

    // App controller
    files['src/app.controller.ts'] = `import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
`;

    // App service
    files['src/app.service.ts'] = `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from ${projectName}!';
  }
}
`;

    // Add ESLint config
    files['eslint.config.js'] = eslintConfig;

    // Add database setup if needed
    if (stack.orm === 'prisma' && stack.database !== 'none') {
      addPrismaSetup(files, projectName, stack.database, true);
    }

    // Bug 16: Add TypeORM setup if needed
    if (stack.orm === 'typeorm' && stack.database !== 'none') {
      addTypeOrmSetup(files, projectName, stack.database);
    }
  },
};
