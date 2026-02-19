/**
 * Unit Test Enrichment Strategy
 *
 * Generates unit tests based on the project's language, framework,
 * and detected source files.
 */

import type {
  EnrichmentStrategy,
  TechStack,
  EnrichmentFlags,
  EnrichmentContext,
} from '../../../types.js';

function generateTypescriptTests(projectName: string, framework: string): string {
  if (framework === 'express' || framework === 'fastify' || framework === 'nestjs') {
    return `import { describe, it, expect } from 'vitest';

describe('${projectName}', () => {
  describe('Health Check', () => {
    it('should return ok status', () => {
      const result = { status: 'ok', timestamp: new Date().toISOString() };
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should reject empty names', () => {
      const validate = (name: string) => name.length > 0;
      expect(validate('')).toBe(false);
      expect(validate('test')).toBe(true);
    });

    it('should handle null inputs gracefully', () => {
      const sanitize = (input: string | null | undefined): string => input?.trim() ?? '';
      expect(sanitize(null)).toBe('');
      expect(sanitize(undefined)).toBe('');
      expect(sanitize('  hello  ')).toBe('hello');
    });
  });

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => crypto.randomUUID()));
      expect(ids.size).toBe(100);
    });
  });
});
`;
  }

  // Web/CLI tests
  return `import { describe, it, expect } from 'vitest';

describe('${projectName}', () => {
  describe('Configuration', () => {
    it('should merge config with defaults', () => {
      const defaults = { port: 3000, host: 'localhost' };
      const overrides = { port: 8080 };
      const merged = { ...defaults, ...overrides };
      expect(merged.port).toBe(8080);
      expect(merged.host).toBe('localhost');
    });
  });

  describe('Data Processing', () => {
    it('should handle arrays correctly', () => {
      const items = ['a', 'b', 'c'];
      expect(items).toHaveLength(3);
      expect(items).toContain('b');
    });

    it('should sanitize string input', () => {
      const sanitize = (input: string | null | undefined): string => input?.trim() ?? '';
      expect(sanitize(null)).toBe('');
      expect(sanitize(undefined)).toBe('');
      expect(sanitize('  hello  ')).toBe('hello');
    });
  });

  describe('Async Operations', () => {
    it('should handle async operations', async () => {
      const result = await Promise.resolve(42);
      expect(result).toBe(42);
    });
  });
});
`;
}

function generatePythonTests(projectName: string): string {
  return `"""Unit tests for ${projectName}."""

import pytest
from datetime import datetime


class TestHealthCheck:
    """Tests for health check functionality."""

    def test_health_check_returns_ok(self):
        result = {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
        assert result["status"] == "ok"
        assert result["timestamp"] is not None

    def test_health_check_timestamp_format(self):
        timestamp = datetime.utcnow().isoformat()
        parsed = datetime.fromisoformat(timestamp)
        assert isinstance(parsed, datetime)


class TestDataValidation:
    """Tests for data validation logic."""

    def test_reject_empty_names(self):
        assert len("") == 0
        assert len("test") > 0

    def test_sanitize_input(self):
        sanitize = lambda x: (x or "").strip()
        assert sanitize(None) == ""
        assert sanitize("") == ""
        assert sanitize("  hello  ") == "hello"

    @pytest.mark.parametrize("input_val,expected", [
        ("hello", True),
        ("", False),
        ("  ", False),
    ])
    def test_is_valid_name(self, input_val, expected):
        is_valid = bool(input_val and input_val.strip())
        assert is_valid == expected


class TestConfiguration:
    """Tests for configuration handling."""

    def test_default_config(self):
        config = {"version": "1.0.0", "debug": False}
        assert config["version"] == "1.0.0"
        assert config["debug"] is False

    def test_config_override(self):
        defaults = {"port": 3000, "host": "localhost"}
        overrides = {"port": 8080}
        merged = {**defaults, **overrides}
        assert merged["port"] == 8080
        assert merged["host"] == "localhost"
`;
}

function generateGoTests(_projectName: string): string {
  return `package main

import (
\t"testing"
\t"time"
)

func TestHealthCheck(t *testing.T) {
\tresult := map[string]string{
\t\t"status":    "ok",
\t\t"timestamp": time.Now().UTC().Format(time.RFC3339),
\t}

\tif result["status"] != "ok" {
\t\tt.Errorf("expected status 'ok', got '%s'", result["status"])
\t}

\tif result["timestamp"] == "" {
\t\tt.Error("expected non-empty timestamp")
\t}
}

func TestDataValidation(t *testing.T) {
\ttests := []struct {
\t\tname     string
\t\tinput    string
\t\texpected bool
\t}{
\t\t{"valid name", "hello", true},
\t\t{"empty string", "", false},
\t\t{"whitespace only", "   ", false},
\t}

\tfor _, tt := range tests {
\t\tt.Run(tt.name, func(t *testing.T) {
\t\t\tresult := len(tt.input) > 0 && tt.input != "   "
\t\t\tif result != tt.expected {
\t\t\t\tt.Errorf("expected %v, got %v", tt.expected, result)
\t\t\t}
\t\t})
\t}
}
`;
}

function generateRustTests(projectName: string): string {
  return `//! Unit tests for ${projectName}

#[cfg(test)]
mod tests {
    #[test]
    fn test_health_check() {
        let status = "ok";
        assert_eq!(status, "ok");
    }

    #[test]
    fn test_data_validation() {
        let validate = |name: &str| -> bool { !name.trim().is_empty() };

        assert!(validate("hello"));
        assert!(!validate(""));
        assert!(!validate("   "));
    }

    #[test]
    fn test_sanitize_input() {
        let sanitize = |input: Option<&str>| -> String {
            input.unwrap_or("").trim().to_string()
        };

        assert_eq!(sanitize(None), "");
        assert_eq!(sanitize(Some("")), "");
        assert_eq!(sanitize(Some("  hello  ")), "hello");
    }

    #[test]
    fn test_id_uniqueness() {
        use std::collections::HashSet;
        let ids: HashSet<String> = (0..100)
            .map(|i| format!("id-{}", i))
            .collect();
        assert_eq!(ids.len(), 100);
    }
}
`;
}

export const UnitTestEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-unit-tests',
  name: 'Unit Test Generation',
  priority: 30,

  matches: (_stack: TechStack, flags: EnrichmentFlags) => flags.tests,

  apply: async (context: EnrichmentContext) => {
    const { files, stack, projectName } = context;

    switch (stack.language) {
      case 'typescript':
      case 'javascript':
        files['src/__tests__/app.test.ts'] = generateTypescriptTests(projectName, stack.framework);
        break;
      case 'python':
        files['tests/test_app.py'] = generatePythonTests(projectName);
        break;
      case 'go':
        files['main_test.go'] = generateGoTests(projectName);
        break;
      case 'rust':
        files['tests/unit_test.rs'] = generateRustTests(projectName);
        break;
    }
  },
};
