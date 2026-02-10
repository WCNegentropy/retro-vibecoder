/**
 * Conditional logic transpiler tests
 */

import { describe, it, expect } from 'vitest';
import { transpileConditionalLogic, evaluateWhenClause } from '@wcnegentropy/core/transpiler';
import type { ManifestPrompt } from '@wcnegentropy/shared';

describe('Conditional Logic Transpiler', () => {
  describe('transpileConditionalLogic', () => {
    it('creates dependencies for simple boolean when clause', () => {
      const prompts: ManifestPrompt[] = [
        { id: 'use_db', type: 'boolean', message: 'Use database?' },
        {
          id: 'db_type',
          type: 'select',
          message: 'DB type?',
          choices: ['pg', 'mysql'],
          when: 'use_db',
        },
      ];

      const result = transpileConditionalLogic(prompts);

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies?.use_db).toContain('db_type');
    });

    it('creates dependencies for equality when clause', () => {
      const prompts: ManifestPrompt[] = [
        { id: 'framework', type: 'select', message: 'Framework?', choices: ['react', 'vue'] },
        {
          id: 'react_version',
          type: 'select',
          message: 'React version?',
          choices: ['17', '18'],
          when: "framework == 'react'",
        },
      ];

      const result = transpileConditionalLogic(prompts);

      expect(result.dependencies?.framework).toContain('react_version');
      expect(result.allOf).toBeDefined();
    });

    it('creates dependencies for negated when clause', () => {
      const prompts: ManifestPrompt[] = [
        { id: 'use_typescript', type: 'boolean', message: 'TypeScript?' },
        { id: 'js_config', type: 'string', message: 'JS config?', when: 'not use_typescript' },
      ];

      const result = transpileConditionalLogic(prompts);

      expect(result.dependencies?.use_typescript).toContain('js_config');
    });

    it('handles multiple conditional prompts', () => {
      const prompts: ManifestPrompt[] = [
        { id: 'use_auth', type: 'boolean', message: 'Auth?' },
        {
          id: 'auth_type',
          type: 'select',
          message: 'Auth type?',
          choices: ['jwt', 'oauth'],
          when: 'use_auth',
        },
        { id: 'auth_config', type: 'string', message: 'Auth config?', when: 'use_auth' },
      ];

      const result = transpileConditionalLogic(prompts);

      expect(result.dependencies?.use_auth).toHaveLength(2);
      expect(result.dependencies?.use_auth).toContain('auth_type');
      expect(result.dependencies?.use_auth).toContain('auth_config');
    });

    it('returns empty result for prompts without when clauses', () => {
      const prompts: ManifestPrompt[] = [
        { id: 'name', type: 'string', message: 'Name?' },
        { id: 'version', type: 'string', message: 'Version?' },
      ];

      const result = transpileConditionalLogic(prompts);

      expect(result.dependencies).toBeUndefined();
      expect(result.allOf).toBeUndefined();
    });
  });

  describe('evaluateWhenClause', () => {
    it('evaluates truthy check', () => {
      expect(evaluateWhenClause('use_db', { use_db: true })).toBe(true);
      expect(evaluateWhenClause('use_db', { use_db: false })).toBe(false);
      expect(evaluateWhenClause('use_db', { use_db: 'yes' })).toBe(true);
      expect(evaluateWhenClause('use_db', { use_db: '' })).toBe(false);
    });

    it('evaluates falsy check', () => {
      expect(evaluateWhenClause('not use_db', { use_db: true })).toBe(false);
      expect(evaluateWhenClause('not use_db', { use_db: false })).toBe(true);
    });

    it('evaluates equality check', () => {
      expect(evaluateWhenClause("framework == 'react'", { framework: 'react' })).toBe(true);
      expect(evaluateWhenClause("framework == 'react'", { framework: 'vue' })).toBe(false);
    });

    it('evaluates inequality check', () => {
      expect(evaluateWhenClause("framework != 'react'", { framework: 'vue' })).toBe(true);
      expect(evaluateWhenClause("framework != 'react'", { framework: 'react' })).toBe(false);
    });

    it('evaluates boolean equality', () => {
      expect(evaluateWhenClause('enabled == true', { enabled: true })).toBe(true);
      expect(evaluateWhenClause('enabled == false', { enabled: false })).toBe(true);
    });

    it('evaluates numeric equality', () => {
      expect(evaluateWhenClause('count == 5', { count: 5 })).toBe(true);
      expect(evaluateWhenClause('count == 5', { count: 3 })).toBe(false);
    });

    it('returns true for unparseable expressions', () => {
      expect(evaluateWhenClause('complex && expression', {})).toBe(true);
    });
  });
});
