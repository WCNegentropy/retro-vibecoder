/**
 * README Enrichment Strategy
 *
 * Enhances the Pass 1 README with:
 * - Real setup instructions based on the stack
 * - API documentation stubs
 * - Project structure overview
 * - Contributing guidelines reference
 * - License badge
 * - Tech stack badges
 */

import type { EnrichmentStrategy, TechStack, EnrichmentFlags, EnrichmentContext } from '../../../types.js';

function generateEnhancedReadme(ctx: EnrichmentContext): string {
  const { stack, projectName, introspect, flags } = ctx;
  const manifest = introspect.getManifest();
  const hasDocker = introspect.hasFile('Dockerfile');
  const hasCompose = introspect.hasFile('docker-compose.yml');
  const ports = introspect.getExposedPorts();
  const port = ports[0] ?? 3000;
  const allFiles = introspect.getAllPaths();

  let readme = `# ${projectName}\n\n`;

  // Badges
  const badges: string[] = [];
  if (stack.cicd === 'github-actions') {
    badges.push(`![CI](https://github.com/username/${projectName}/actions/workflows/ci.yml/badge.svg)`);
  }
  badges.push(`![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)`);

  if (badges.length > 0) {
    readme += badges.join(' ') + '\n\n';
  }

  // Description
  readme += `A ${stack.archetype} project built with ${getFrameworkName(stack)} and ${getLanguageName(stack)}.\n\n`;

  // Tech stack table
  readme += `## Tech Stack\n\n`;
  readme += `| Category | Technology |\n`;
  readme += `|----------|------------|\n`;
  readme += `| Language | ${getLanguageName(stack)} |\n`;
  if (stack.framework !== 'none') {
    readme += `| Framework | ${getFrameworkName(stack)} |\n`;
  }
  readme += `| Runtime | ${stack.runtime} |\n`;
  if (stack.database !== 'none') {
    readme += `| Database | ${getDatabaseName(stack)} |\n`;
  }
  if (stack.orm !== 'none') {
    readme += `| ORM | ${stack.orm} |\n`;
  }
  if (stack.packaging !== 'none') {
    readme += `| Container | ${stack.packaging} |\n`;
  }
  if (stack.cicd !== 'none') {
    readme += `| CI/CD | ${stack.cicd} |\n`;
  }
  readme += `| Testing | ${stack.testing} |\n`;
  readme += '\n';

  // Prerequisites
  readme += `## Prerequisites\n\n`;
  readme += getPrerequisites(stack);
  readme += '\n';

  // Getting Started
  readme += `## Getting Started\n\n`;
  readme += getSetupInstructions(stack, hasDocker, hasCompose);
  readme += '\n';

  // Project structure
  if (flags.depth !== 'minimal') {
    readme += `## Project Structure\n\n`;
    readme += '```\n';
    readme += generateFileTree(allFiles);
    readme += '```\n\n';
  }

  // API docs stub for backends
  if (stack.archetype === 'backend' && flags.depth !== 'minimal') {
    readme += `## API\n\n`;
    if (stack.transport === 'rest') {
      readme += `The API runs on \`http://localhost:${port}\` by default.\n\n`;
      readme += `| Method | Endpoint | Description |\n`;
      readme += `|--------|----------|-------------|\n`;
      readme += `| GET | /health | Health check |\n`;
      readme += `| GET | /api/v1 | API root |\n\n`;
    } else if (stack.transport === 'graphql') {
      readme += `GraphQL playground available at \`http://localhost:${port}/graphql\`.\n\n`;
    }
  }

  // Docker section
  if (hasDocker) {
    readme += `## Docker\n\n`;
    if (hasCompose) {
      readme += '```bash\n';
      readme += '# Start all services\n';
      readme += 'docker compose up -d\n\n';
      readme += '# Stop all services\n';
      readme += 'docker compose down\n';
      readme += '```\n\n';
    } else {
      readme += '```bash\n';
      readme += `# Build the image\n`;
      readme += `docker build -t ${projectName} .\n\n`;
      readme += `# Run the container\n`;
      readme += `docker run -p ${port}:${port} ${projectName}\n`;
      readme += '```\n\n';
    }
  }

  // Testing
  readme += `## Testing\n\n`;
  readme += getTestInstructions(stack, manifest);
  readme += '\n';

  // License
  readme += `## License\n\n`;
  readme += `This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.\n`;

  return readme;
}

function getLanguageName(stack: TechStack): string {
  const names: Record<string, string> = {
    typescript: 'TypeScript', javascript: 'JavaScript', python: 'Python',
    go: 'Go', rust: 'Rust', java: 'Java', csharp: 'C#', cpp: 'C++',
    swift: 'Swift', kotlin: 'Kotlin', ruby: 'Ruby', php: 'PHP',
  };
  return names[stack.language] ?? stack.language;
}

function getFrameworkName(stack: TechStack): string {
  const names: Record<string, string> = {
    express: 'Express.js', fastify: 'Fastify', nestjs: 'NestJS',
    fastapi: 'FastAPI', flask: 'Flask', django: 'Django',
    gin: 'Gin', echo: 'Echo', axum: 'Axum', actix: 'Actix Web',
    react: 'React', vue: 'Vue.js', svelte: 'Svelte', solid: 'SolidJS',
    commander: 'Commander.js', yargs: 'Yargs', clap: 'Clap', cobra: 'Cobra',
    click: 'Click', argparse: 'argparse',
    'spring-boot': 'Spring Boot', 'aspnet-core': 'ASP.NET Core',
    rails: 'Ruby on Rails', laravel: 'Laravel',
    tauri: 'Tauri', electron: 'Electron',
    bevy: 'Bevy', phaser: 'Phaser',
    none: 'None',
  };
  return names[stack.framework] ?? stack.framework;
}

function getDatabaseName(stack: TechStack): string {
  const names: Record<string, string> = {
    postgres: 'PostgreSQL', mysql: 'MySQL', sqlite: 'SQLite',
    mongodb: 'MongoDB', redis: 'Redis', cassandra: 'Cassandra', neo4j: 'Neo4j',
  };
  return names[stack.database] ?? stack.database;
}

function getPrerequisites(stack: TechStack): string {
  const lines: string[] = [];
  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      lines.push('- [Node.js](https://nodejs.org/) >= 18');
      lines.push('- [pnpm](https://pnpm.io/) >= 9');
      break;
    case 'python':
      lines.push('- [Python](https://python.org/) >= 3.11');
      lines.push('- [pip](https://pip.pypa.io/) or [uv](https://github.com/astral-sh/uv)');
      break;
    case 'go':
      lines.push('- [Go](https://go.dev/) >= 1.22');
      break;
    case 'rust':
      lines.push('- [Rust](https://rustup.rs/) (stable toolchain)');
      break;
    case 'java':
    case 'kotlin':
      lines.push('- [JDK](https://adoptium.net/) >= 17');
      lines.push(stack.buildTool === 'gradle' ? '- [Gradle](https://gradle.org/)' : '- [Maven](https://maven.apache.org/)');
      break;
    case 'csharp':
      lines.push('- [.NET SDK](https://dotnet.microsoft.com/) >= 8.0');
      break;
    case 'ruby':
      lines.push('- [Ruby](https://ruby-lang.org/) >= 3.2');
      lines.push('- [Bundler](https://bundler.io/)');
      break;
    case 'php':
      lines.push('- [PHP](https://php.net/) >= 8.2');
      lines.push('- [Composer](https://getcomposer.org/)');
      break;
  }

  if (stack.database === 'postgres') lines.push('- [PostgreSQL](https://postgresql.org/) >= 15');
  if (stack.database === 'mysql') lines.push('- [MySQL](https://mysql.com/) >= 8.0');
  if (stack.database === 'mongodb') lines.push('- [MongoDB](https://mongodb.com/) >= 7.0');
  if (stack.packaging === 'docker') lines.push('- [Docker](https://docker.com/) (optional)');

  return lines.map(l => l + '\n').join('');
}

function getSetupInstructions(stack: TechStack, _hasDocker: boolean, _hasCompose: boolean): string {
  let instructions = '```bash\n';
  instructions += '# Clone the repository\n';
  instructions += `git clone <repository-url>\ncd <project-directory>\n\n`;

  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      instructions += '# Install dependencies\npnpm install\n\n';
      instructions += '# Start development server\npnpm dev\n';
      break;
    case 'python':
      instructions += '# Create virtual environment\npython -m venv venv\nsource venv/bin/activate  # On Windows: venv\\Scripts\\activate\n\n';
      instructions += '# Install dependencies\npip install -r requirements.txt\n\n';
      instructions += '# Run the application\npython -m src.main\n';
      break;
    case 'go':
      instructions += '# Download dependencies\ngo mod download\n\n';
      instructions += '# Run the application\ngo run .\n';
      break;
    case 'rust':
      instructions += '# Build the project\ncargo build\n\n';
      instructions += '# Run the application\ncargo run\n';
      break;
    case 'java':
    case 'kotlin':
      instructions += stack.buildTool === 'gradle'
        ? '# Build the project\n./gradlew build\n\n# Run the application\n./gradlew run\n'
        : '# Build the project\nmvn package\n\n# Run the application\njava -jar target/*.jar\n';
      break;
    case 'csharp':
      instructions += '# Restore and run\ndotnet restore\ndotnet run\n';
      break;
    case 'ruby':
      instructions += '# Install dependencies\nbundle install\n\n';
      instructions += stack.framework === 'rails'
        ? '# Start the server\nbin/rails server\n'
        : '# Run the application\nruby app.rb\n';
      break;
    case 'php':
      instructions += '# Install dependencies\ncomposer install\n\n';
      instructions += stack.framework === 'laravel'
        ? '# Start the server\nphp artisan serve\n'
        : '# Start the server\nphp -S localhost:8000 -t public/\n';
      break;
    default:
      instructions += '# Build and run\nmake build\nmake run\n';
  }

  instructions += '```\n';
  return instructions;
}

function getTestInstructions(stack: TechStack, manifest: ReturnType<EnrichmentContext['introspect']['getManifest']>): string {
  let instructions = '```bash\n';
  const testCmd = manifest.scripts['test'];

  if (testCmd) {
    instructions += testCmd + '\n';
  } else {
    switch (stack.language) {
      case 'typescript':
      case 'javascript':
        instructions += 'pnpm test\n';
        break;
      case 'python':
        instructions += 'pytest\n';
        break;
      case 'go':
        instructions += 'go test ./...\n';
        break;
      case 'rust':
        instructions += 'cargo test\n';
        break;
      default:
        instructions += 'make test\n';
    }
  }

  instructions += '```\n';
  return instructions;
}

function generateFileTree(paths: string[]): string {
  const sorted = paths.sort();
  const lines: string[] = [];

  for (const path of sorted) {
    const parts = path.split('/');
    const depth = parts.length - 1;
    const indent = '  '.repeat(depth);
    const name = parts[parts.length - 1];
    lines.push(`${indent}${name}`);
  }

  return lines.join('\n') + '\n';
}

export const ReadmeEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-readme',
  name: 'README Enrichment',
  priority: 90,  // Run late — after all other enrichments

  matches: (_stack: TechStack, flags: EnrichmentFlags) => flags.docs,

  apply: async (context: EnrichmentContext) => {
    // Always replace the README with an enriched version
    context.files['README.md'] = generateEnhancedReadme(context);
  },
};
