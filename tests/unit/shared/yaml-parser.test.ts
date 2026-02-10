/**
 * YAML parser utilities unit tests
 */

import { describe, it, expect } from 'vitest';
import { parseYaml, stringifyYaml, isValidYaml, getLineForPath } from '@wcnegentropy/shared';

describe('YAML Parser Utilities', () => {
  describe('parseYaml', () => {
    it('parses simple YAML', () => {
      const yaml = `
name: test
version: 1.0.0
`;
      const result = parseYaml<{ name: string; version: string }>(yaml);
      expect(result.name).toBe('test');
      expect(result.version).toBe('1.0.0');
    });

    it('parses nested structures', () => {
      const yaml = `
metadata:
  name: test
  version: 1.0.0
prompts:
  - id: name
    type: string
`;
      const result = parseYaml<{
        metadata: { name: string; version: string };
        prompts: Array<{ id: string; type: string }>;
      }>(yaml);

      expect(result.metadata.name).toBe('test');
      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].id).toBe('name');
    });

    it('parses arrays', () => {
      const yaml = `
items:
  - one
  - two
  - three
`;
      const result = parseYaml<{ items: string[] }>(yaml);
      expect(result.items).toEqual(['one', 'two', 'three']);
    });

    it('handles YAML anchors and aliases with merge option', () => {
      const yaml = `
defaults: &defaults
  timeout: 30
  retries: 3

production:
  <<: *defaults
  timeout: 60
`;
      const result = parseYaml<{
        defaults: { timeout: number; retries: number };
        production: { timeout: number; retries: number };
      }>(yaml, { merge: true });

      expect(result.production.timeout).toBe(60);
      expect(result.production.retries).toBe(3);
    });

    it('throws error for invalid YAML', () => {
      // YAML with unclosed bracket
      const invalidYaml = 'items: [unclosed';
      expect(() => parseYaml(invalidYaml)).toThrow('YAML parse error');
    });

    it('parses empty YAML as null', () => {
      const result = parseYaml('');
      expect(result).toBeNull();
    });

    it('parses scalar values', () => {
      expect(parseYaml('42')).toBe(42);
      expect(parseYaml('true')).toBe(true);
      expect(parseYaml('"string"')).toBe('string');
    });

    it('parses multiline strings', () => {
      const yaml = `
description: |
  This is a
  multiline string
`;
      const result = parseYaml<{ description: string }>(yaml);
      expect(result.description).toContain('This is a');
      expect(result.description).toContain('multiline string');
    });

    it('handles comments', () => {
      const yaml = `
# This is a comment
name: test # inline comment
`;
      const result = parseYaml<{ name: string }>(yaml);
      expect(result.name).toBe('test');
    });
  });

  describe('stringifyYaml', () => {
    it('stringifies simple object', () => {
      const obj = { name: 'test', version: '1.0.0' };
      const result = stringifyYaml(obj);
      expect(result).toContain('name: test');
      // YAML doesn't quote strings by default
      expect(result).toContain('version: 1.0.0');
    });

    it('stringifies nested object', () => {
      const obj = {
        metadata: {
          name: 'test',
          version: '1.0.0',
        },
      };
      const result = stringifyYaml(obj);
      expect(result).toContain('metadata:');
      expect(result).toContain('name: test');
    });

    it('stringifies arrays', () => {
      const obj = { items: ['one', 'two', 'three'] };
      const result = stringifyYaml(obj);
      expect(result).toContain('- one');
      expect(result).toContain('- two');
      expect(result).toContain('- three');
    });

    it('respects custom indent option', () => {
      const obj = { a: { b: 'value' } };
      const result = stringifyYaml(obj, { indent: 4 });
      expect(result).toContain('    b: value');
    });

    it('handles null values', () => {
      const obj = { nullable: null };
      const result = stringifyYaml(obj);
      expect(result).toContain('nullable: null');
    });

    it('handles boolean values', () => {
      const obj = { enabled: true, disabled: false };
      const result = stringifyYaml(obj);
      expect(result).toContain('enabled: true');
      expect(result).toContain('disabled: false');
    });

    it('handles numeric values', () => {
      const obj = { count: 42, ratio: 3.14 };
      const result = stringifyYaml(obj);
      expect(result).toContain('count: 42');
      expect(result).toContain('ratio: 3.14');
    });

    it('roundtrip: parse(stringify(obj)) equals obj', () => {
      const obj = {
        name: 'test',
        count: 42,
        enabled: true,
        items: ['a', 'b'],
        nested: { key: 'value' },
      };
      const yaml = stringifyYaml(obj);
      const result = parseYaml(yaml);
      expect(result).toEqual(obj);
    });
  });

  describe('isValidYaml', () => {
    it('returns true for valid YAML', () => {
      const yaml = `
name: test
version: 1.0.0
`;
      expect(isValidYaml(yaml)).toBe(true);
    });

    it('returns true for empty YAML', () => {
      expect(isValidYaml('')).toBe(true);
    });

    it('returns true for scalar YAML', () => {
      expect(isValidYaml('42')).toBe(true);
      expect(isValidYaml('true')).toBe(true);
      expect(isValidYaml('"string"')).toBe(true);
    });

    it('returns false for invalid YAML', () => {
      const invalidYaml = `
name: test
  bad indentation: here
`;
      expect(isValidYaml(invalidYaml)).toBe(false);
    });

    it('returns false for unclosed quotes', () => {
      const invalidYaml = 'name: "unclosed string';
      expect(isValidYaml(invalidYaml)).toBe(false);
    });

    it('returns true for complex valid YAML', () => {
      const yaml = `
apiVersion: upg/v1
metadata:
  name: test
  version: "1.0.0"
prompts:
  - id: name
    type: string
    message: "What is your name?"
actions:
  - type: generate
    src: template/
    dest: ./
`;
      expect(isValidYaml(yaml)).toBe(true);
    });
  });

  describe('getLineForPath', () => {
    const sampleYaml = `apiVersion: upg/v1
metadata:
  name: test-template
  version: 1.0.0
prompts:
  - id: name
    type: string
actions:
  - type: generate`;

    it('finds line for top-level key', () => {
      const line = getLineForPath(sampleYaml, 'apiVersion');
      expect(line).toBe(1);
    });

    it('finds line for nested key', () => {
      const line = getLineForPath(sampleYaml, 'metadata.name');
      expect(line).toBe(3);
    });

    it('finds line for deeply nested key', () => {
      const line = getLineForPath(sampleYaml, 'metadata.version');
      expect(line).toBe(4);
    });

    it('returns undefined for non-existent path', () => {
      const line = getLineForPath(sampleYaml, 'nonexistent.path');
      expect(line).toBeUndefined();
    });

    it('returns undefined for partial match', () => {
      const line = getLineForPath(sampleYaml, 'metadata.nonexistent');
      expect(line).toBeUndefined();
    });

    it('skips comments when finding path', () => {
      const yamlWithComments = `# Comment
apiVersion: upg/v1
# Another comment
metadata:
  name: test`;
      const line = getLineForPath(yamlWithComments, 'metadata.name');
      expect(line).toBe(5);
    });

    it('skips empty lines when finding path', () => {
      const yamlWithEmpty = `apiVersion: upg/v1

metadata:

  name: test`;
      const line = getLineForPath(yamlWithEmpty, 'metadata.name');
      expect(line).toBe(5);
    });
  });
});
