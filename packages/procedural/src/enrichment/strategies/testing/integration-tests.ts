/**
 * Integration Test Enrichment Strategy
 *
 * Generates API integration tests for backend projects.
 */

import type {
  EnrichmentStrategy,
  TechStack,
  EnrichmentFlags,
  EnrichmentContext,
} from '../../../types.js';

function getDefaultPort(language: string): number {
  const portMap: Record<string, number> = {
    typescript: 3000,
    javascript: 3000,
    python: 8000,
    go: 8080,
    rust: 8080,
    java: 8080,
    kotlin: 8080,
  };
  return portMap[language] ?? 3000;
}

function getRouteEndpoint(context: EnrichmentContext): string {
  const routeFiles = Object.keys(context.files).filter(f => f.match(/routes\/.*\.(ts|py|go|rs)$/));
  if (routeFiles.length > 0) {
    const match = routeFiles[0].match(/routes\/([^/.]+)/);
    if (match) {
      return `/${match[1]}`;
    }
  }
  return '/api/v1/items';
}

function generateTypescriptIntegrationTests(port: number, endpoint: string): string {
  return `import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = \`http://localhost:${port}\`;

describe('API Integration Tests', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await fetch(\`\${BASE_URL}/health\`);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.status).toBe('ok');
    });
  });

  describe('CRUD Operations', () => {
    let createdId: string;

    it('should create a resource', async () => {
      const response = await fetch(\`\${BASE_URL}${endpoint}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Item' }),
      });
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.data.name).toBe('Test Item');
      expect(body.data.id).toBeDefined();
      createdId = body.data.id;
    });

    it('should list resources', async () => {
      const response = await fetch(\`\${BASE_URL}${endpoint}\`);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.data).toBeInstanceOf(Array);
      expect(body.total).toBeGreaterThanOrEqual(0);
    });

    it('should return 404 for non-existent resource', async () => {
      const response = await fetch(\`\${BASE_URL}${endpoint}/non-existent-id\`);
      expect(response.status).toBe(404);
    });
  });
});
`;
}

function generatePythonIntegrationTests(port: number, endpoint: string): string {
  return `"""API integration tests."""

import pytest
import requests

BASE_URL = f"http://localhost:${port}"


class TestHealthEndpoint:
    def test_health_returns_ok(self):
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


class TestCrudOperations:
    created_id: str = ""

    def test_create_resource(self):
        response = requests.post(
            f"{BASE_URL}${endpoint}",
            json={"name": "Test Item"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["data"]["name"] == "Test Item"
        TestCrudOperations.created_id = data["data"]["id"]

    def test_list_resources(self):
        response = requests.get(f"{BASE_URL}${endpoint}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["data"], list)

    def test_not_found(self):
        response = requests.get(f"{BASE_URL}${endpoint}/non-existent-id")
        assert response.status_code == 404
`;
}

export const IntegrationTestEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-integration-tests',
  name: 'Integration Test Generation',
  priority: 32,

  matches: (stack: TechStack, flags: EnrichmentFlags) =>
    flags.tests && stack.archetype === 'backend',

  apply: async (context: EnrichmentContext) => {
    const { files, stack, introspect } = context;
    const ports = introspect.getExposedPorts();
    const port = ports[0] ?? getDefaultPort(stack.language);
    const endpoint = getRouteEndpoint(context);

    switch (stack.language) {
      case 'typescript':
      case 'javascript':
        files['tests/integration/api.test.ts'] = generateTypescriptIntegrationTests(port, endpoint);
        break;
      case 'python':
        files['tests/test_integration.py'] = generatePythonIntegrationTests(port, endpoint);
        break;
    }
  },
};
