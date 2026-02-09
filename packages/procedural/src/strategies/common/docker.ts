/**
 * Docker Strategy
 *
 * Generates Dockerfile and docker-compose.yml based on stack.
 */

import type { GenerationStrategy, TechStack } from '../../types.js';

/**
 * Generate Dockerfile content based on language and framework
 */
function generateDockerfile(stack: TechStack, projectName: string): string {
  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      return generateNodeDockerfile(stack, projectName);

    case 'python':
      return generatePythonDockerfile(stack, projectName);

    case 'go':
      return generateGoDockerfile(stack, projectName);

    case 'rust':
      return generateRustDockerfile(stack, projectName);

    case 'java':
    case 'kotlin':
      return generateJavaDockerfile(stack, projectName);

    case 'csharp':
      return generateDotnetDockerfile(stack, projectName);

    case 'ruby':
      return generateRubyDockerfile(stack, projectName);

    case 'php':
      return generatePhpDockerfile(stack, projectName);

    default:
      return generateGenericDockerfile(stack, projectName);
  }
}

function generateNodeDockerfile(_stack: TechStack, _projectName: string): string {
  return `# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/index.js"]
`;
}

function generatePythonDockerfile(_stack: TechStack, _projectName: string): string {
  return `# Python application
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`;
}

function generateGoDockerfile(_stack: TechStack, projectName: string): string {
  return `# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/bin/${projectName} .

# Production stage
FROM alpine:3.19

WORKDIR /app

# Copy binary
COPY --from=builder /app/bin/${projectName} .

EXPOSE 8080

CMD ["./${projectName}"]
`;
}

function generateRustDockerfile(_stack: TechStack, projectName: string): string {
  return `# Build stage
FROM rust:1.75-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache musl-dev

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./

# Create dummy src for caching dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy actual source
COPY . .

# Build actual application
RUN touch src/main.rs && cargo build --release

# Production stage
FROM alpine:3.19

WORKDIR /app

# Copy binary
COPY --from=builder /app/target/release/${projectName} .

EXPOSE 8080

CMD ["./${projectName}"]
`;
}

function generateJavaDockerfile(stack: TechStack, _projectName: string): string {
  if (stack.buildTool === 'gradle') {
    return `# Build stage
FROM gradle:8-jdk17 AS builder

WORKDIR /app

COPY . .

RUN gradle build --no-daemon

# Production stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
`;
  }
  return `# Build stage
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY . .

RUN mvn package -DskipTests

# Production stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
`;
}

function generateDotnetDockerfile(_stack: TechStack, projectName: string): string {
  return `# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder

WORKDIR /app

COPY *.csproj ./
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app/publish

# Production stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0

WORKDIR /app

COPY --from=builder /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "${projectName}.dll"]
`;
}

function generateRubyDockerfile(_stack: TechStack, _projectName: string): string {
  return `FROM ruby:3.2-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    libpq-dev \\
    && rm -rf /var/lib/apt/lists/*

COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test

COPY . .

EXPOSE 3000

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
`;
}

function generatePhpDockerfile(_stack: TechStack, _projectName: string): string {
  return `FROM php:8.2-fpm

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    git \\
    unzip \\
    libpq-dev \\
    && docker-php-ext-install pdo pdo_pgsql \\
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts

COPY . .
RUN composer dump-autoload --optimize

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
`;
}

function generateGenericDockerfile(_stack: TechStack, _projectName: string): string {
  return `FROM ubuntu:22.04

WORKDIR /app

COPY . .

EXPOSE 8080

CMD ["./start.sh"]
`;
}

/**
 * Generate docker-compose.yml if database is used
 */
function generateDockerCompose(stack: TechStack, projectName: string): string | null {
  if (stack.database === 'none') {
    return null;
  }

  const services: string[] = [];

  // App service
  services.push(`  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=\${DATABASE_URL}
    depends_on:
      - db`);

  // Database service
  switch (stack.database) {
    case 'postgres':
      services.push(`  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${projectName.replace(/-/g, '_')}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"`);
      break;

    case 'mysql':
      services.push(`  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: ${projectName.replace(/-/g, '_')}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"`);
      break;

    case 'mongodb':
      services.push(`  db:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"`);
      break;

    case 'redis':
      services.push(`  db:
    image: redis:7-alpine
    ports:
      - "6379:6379"`);
      break;
  }

  // Volumes
  const volumes: string[] = [];
  switch (stack.database) {
    case 'postgres':
      volumes.push('  postgres_data:');
      break;
    case 'mysql':
      volumes.push('  mysql_data:');
      break;
    case 'mongodb':
      volumes.push('  mongo_data:');
      break;
  }

  return `version: '3.8'

services:
${services.join('\n\n')}

${volumes.length > 0 ? `volumes:\n${volumes.join('\n')}` : ''}
`;
}

/**
 * Docker strategy - generates Dockerfile and docker-compose.yml
 */
export const DockerStrategy: GenerationStrategy = {
  id: 'docker',
  name: 'Docker Configuration',
  priority: 90, // Run late

  matches: stack => stack.packaging === 'docker',

  apply: async ({ stack, files, projectName }) => {
    files['Dockerfile'] = generateDockerfile(stack, projectName);

    const compose = generateDockerCompose(stack, projectName);
    if (compose) {
      files['docker-compose.yml'] = compose;
    }

    // Add .dockerignore
    files['.dockerignore'] = `node_modules
dist
.git
.env
*.log
Dockerfile
docker-compose.yml
.dockerignore
`;
  },
};
