/**
 * Constraint Solver
 *
 * Ensures that generated tech stacks are valid and sensible.
 * Prevents "cursed" combinations like Django with npm or jQuery with Rust.
 */

import type {
  TechStack,
  Archetype,
  Language,
  Framework,
  Database,
  ORM,
  Runtime,
  IncompatibilityRule,
  RequirementRule,
  DefaultPairing,
} from '../types.js';
import { FRAMEWORK_MAP, getCompatibleFrameworks } from '../matrices/frameworks.js';
import { getOrmsForStack } from '../matrices/databases.js';
import { isLanguageCompatible, getLanguagesForArchetype } from '../matrices/archetypes.js';
import { languageSupportsRuntime, getRuntimesForLanguage } from '../matrices/languages.js';

// ============================================================================
// Incompatibility Rules
// ============================================================================

/**
 * Rules defining incompatible combinations
 */
export const INCOMPATIBILITY_RULES: readonly IncompatibilityRule[] = [
  // Language-specific ORMs
  {
    when: { language: 'go' },
    incompatible: { orm: ['prisma', 'typeorm', 'sequelize', 'drizzle', 'sqlalchemy', 'diesel', 'entity-framework', 'activerecord', 'eloquent'] },
    reason: 'Go uses GORM or raw SQL drivers',
  },
  {
    when: { language: 'rust' },
    incompatible: { orm: ['prisma', 'typeorm', 'sequelize', 'drizzle', 'sqlalchemy', 'gorm', 'entity-framework', 'activerecord', 'eloquent'] },
    reason: 'Rust uses Diesel or SQLx',
  },
  {
    when: { language: 'python' },
    incompatible: { orm: ['prisma', 'typeorm', 'sequelize', 'drizzle', 'gorm', 'diesel', 'entity-framework', 'activerecord', 'eloquent'] },
    reason: 'Python uses SQLAlchemy or Django ORM',
  },
  {
    when: { language: 'csharp' },
    incompatible: { orm: ['prisma', 'typeorm', 'sequelize', 'drizzle', 'sqlalchemy', 'gorm', 'diesel', 'activerecord', 'eloquent'] },
    reason: 'C# uses Entity Framework',
  },
  {
    when: { language: 'ruby' },
    incompatible: { orm: ['prisma', 'typeorm', 'sequelize', 'drizzle', 'sqlalchemy', 'gorm', 'diesel', 'entity-framework', 'eloquent'] },
    reason: 'Ruby uses ActiveRecord',
  },
  {
    when: { language: 'php' },
    incompatible: { orm: ['prisma', 'typeorm', 'sequelize', 'drizzle', 'sqlalchemy', 'gorm', 'diesel', 'entity-framework', 'activerecord'] },
    reason: 'PHP uses Eloquent or Doctrine',
  },

  // Web frameworks need web-capable languages
  {
    when: { archetype: 'web' },
    incompatible: { language: ['go', 'rust', 'java', 'csharp', 'cpp', 'php', 'ruby'] },
    reason: 'Web frontends require JavaScript/TypeScript',
  },

  // CLI frameworks don't need databases typically
  {
    when: { archetype: 'cli' },
    incompatible: { database: ['cassandra', 'neo4j'] },
    reason: 'CLI tools rarely need distributed databases',
  },

  // Mobile frameworks are language-specific
  {
    when: { framework: 'swiftui' },
    incompatible: { language: ['typescript', 'javascript', 'python', 'go', 'rust', 'java', 'csharp', 'cpp', 'kotlin', 'php', 'ruby'] },
    reason: 'SwiftUI requires Swift',
  },
  {
    when: { framework: 'jetpack-compose' },
    incompatible: { language: ['typescript', 'javascript', 'python', 'go', 'rust', 'java', 'csharp', 'cpp', 'swift', 'php', 'ruby'] },
    reason: 'Jetpack Compose requires Kotlin',
  },
];

// ============================================================================
// Requirement Rules
// ============================================================================

/**
 * Rules defining required combinations
 */
export const REQUIREMENT_RULES: readonly RequirementRule[] = [
  // Django requires Python
  {
    when: { framework: 'django' },
    requires: { language: 'python' },
    reason: 'Django is a Python framework',
  },
  // Rails requires Ruby
  {
    when: { framework: 'rails' },
    requires: { language: 'ruby' },
    reason: 'Rails is a Ruby framework',
  },
  // Laravel requires PHP
  {
    when: { framework: 'laravel' },
    requires: { language: 'php' },
    reason: 'Laravel is a PHP framework',
  },
  // Spring Boot requires Java/Kotlin
  {
    when: { framework: 'spring-boot' },
    requires: { language: 'java' },
    reason: 'Spring Boot is a JVM framework',
  },
  // ASP.NET requires C#
  {
    when: { framework: 'aspnet-core' },
    requires: { language: 'csharp' },
    reason: 'ASP.NET Core requires C#',
  },
  // Rust frameworks
  {
    when: { framework: 'axum' },
    requires: { language: 'rust' },
    reason: 'Axum is a Rust framework',
  },
  {
    when: { framework: 'actix' },
    requires: { language: 'rust' },
    reason: 'Actix is a Rust framework',
  },
  {
    when: { framework: 'clap' },
    requires: { language: 'rust' },
    reason: 'Clap is a Rust CLI library',
  },
  // Go frameworks
  {
    when: { framework: 'gin' },
    requires: { language: 'go' },
    reason: 'Gin is a Go framework',
  },
  {
    when: { framework: 'echo' },
    requires: { language: 'go' },
    reason: 'Echo is a Go framework',
  },
  {
    when: { framework: 'cobra' },
    requires: { language: 'go' },
    reason: 'Cobra is a Go CLI library',
  },
  // Python frameworks
  {
    when: { framework: 'fastapi' },
    requires: { language: 'python' },
    reason: 'FastAPI is a Python framework',
  },
  {
    when: { framework: 'flask' },
    requires: { language: 'python' },
    reason: 'Flask is a Python framework',
  },
  {
    when: { framework: 'click' },
    requires: { language: 'python' },
    reason: 'Click is a Python CLI library',
  },
  // Tauri backend requires Rust
  {
    when: { framework: 'tauri' },
    requires: { language: 'rust' },
    reason: 'Tauri backend is written in Rust',
  },
];

// ============================================================================
// Default Pairings (Happy Paths)
// ============================================================================

/**
 * Sensible default pairings that bias the RNG
 */
export const DEFAULT_PAIRINGS: readonly DefaultPairing[] = [
  // React defaults
  { key: 'framework', value: 'react', defaults: { buildTool: 'vite', styling: 'tailwind', testing: 'vitest' }, weight: 10 },
  { key: 'framework', value: 'vue', defaults: { buildTool: 'vite', styling: 'tailwind', testing: 'vitest' }, weight: 10 },
  { key: 'framework', value: 'svelte', defaults: { buildTool: 'vite', styling: 'tailwind', testing: 'vitest' }, weight: 10 },

  // Backend defaults
  { key: 'framework', value: 'express', defaults: { buildTool: 'tsup', testing: 'vitest', orm: 'prisma' }, weight: 10 },
  { key: 'framework', value: 'fastapi', defaults: { orm: 'sqlalchemy', database: 'postgres' }, weight: 10 },
  { key: 'framework', value: 'gin', defaults: { orm: 'gorm', database: 'postgres' }, weight: 10 },
  { key: 'framework', value: 'axum', defaults: { orm: 'diesel', database: 'postgres' }, weight: 10 },
  { key: 'framework', value: 'spring-boot', defaults: { buildTool: 'gradle', database: 'postgres' }, weight: 10 },

  // Rust defaults
  { key: 'language', value: 'rust', defaults: { buildTool: 'cargo', testing: 'rust-test' }, weight: 15 },

  // Go defaults
  { key: 'language', value: 'go', defaults: { buildTool: 'make', testing: 'go-test' }, weight: 15 },

  // TypeScript/Node defaults
  { key: 'language', value: 'typescript', defaults: { runtime: 'node', packaging: 'docker' }, weight: 10 },
];

// ============================================================================
// Constraint Solver
// ============================================================================

/**
 * Result of constraint validation
 */
export interface ConstraintValidation {
  valid: boolean;
  violations: string[];
  appliedRules: string[];
}

/**
 * Check if a partial stack violates any incompatibility rules
 */
export function checkIncompatibilities(stack: Partial<TechStack>): string[] {
  const violations: string[] = [];

  for (const rule of INCOMPATIBILITY_RULES) {
    // Check if the rule's condition matches
    const conditionMatches = Object.entries(rule.when).every(
      ([key, value]) => stack[key as keyof TechStack] === value
    );

    if (conditionMatches) {
      // Check if any incompatible values are present
      for (const [key, incompatibleValues] of Object.entries(rule.incompatible)) {
        const currentValue = stack[key as keyof TechStack];
        if (currentValue && (incompatibleValues as unknown[]).includes(currentValue)) {
          violations.push(`${rule.reason}: ${key}='${currentValue}' is incompatible with ${JSON.stringify(rule.when)}`);
        }
      }
    }
  }

  return violations;
}

/**
 * Check if a partial stack satisfies all requirement rules
 */
export function checkRequirements(stack: Partial<TechStack>): string[] {
  const violations: string[] = [];

  for (const rule of REQUIREMENT_RULES) {
    // Check if the rule's condition matches
    const conditionMatches = Object.entries(rule.when).every(
      ([key, value]) => stack[key as keyof TechStack] === value
    );

    if (conditionMatches) {
      // Check if required values are present
      for (const [key, requiredValue] of Object.entries(rule.requires)) {
        const currentValue = stack[key as keyof TechStack];
        if (currentValue && currentValue !== requiredValue) {
          violations.push(`${rule.reason}: requires ${key}='${requiredValue}', got '${currentValue}'`);
        }
      }
    }
  }

  return violations;
}

/**
 * Validate a complete or partial stack against all constraints
 */
export function validateStack(stack: Partial<TechStack>): ConstraintValidation {
  const incompatibilities = checkIncompatibilities(stack);
  const requirements = checkRequirements(stack);
  const violations = [...incompatibilities, ...requirements];

  // Check archetype-language compatibility
  if (stack.archetype && stack.language) {
    if (!isLanguageCompatible(stack.archetype, stack.language)) {
      violations.push(`Language '${stack.language}' is not compatible with archetype '${stack.archetype}'`);
    }
  }

  // Check language-runtime compatibility
  if (stack.language && stack.runtime) {
    if (!languageSupportsRuntime(stack.language, stack.runtime)) {
      violations.push(`Language '${stack.language}' does not support runtime '${stack.runtime}'`);
    }
  }

  // Check framework-language compatibility
  if (stack.framework && stack.language) {
    const frameworkEntry = FRAMEWORK_MAP.get(stack.framework);
    if (frameworkEntry && frameworkEntry.language !== stack.language) {
      violations.push(`Framework '${stack.framework}' requires language '${frameworkEntry.language}', got '${stack.language}'`);
    }
  }

  // Check ORM-database-language compatibility
  if (stack.orm && stack.orm !== 'none' && stack.database && stack.language) {
    const compatibleOrms = getOrmsForStack(stack.database, stack.language);
    if (!compatibleOrms.includes(stack.orm)) {
      violations.push(`ORM '${stack.orm}' is not compatible with database '${stack.database}' and language '${stack.language}'`);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    appliedRules: violations.map((v) => v.split(':')[0]),
  };
}

/**
 * Get valid options for a stack dimension given current selections
 */
export function getValidOptions<K extends keyof TechStack>(
  dimension: K,
  currentStack: Partial<TechStack>,
  allOptions: readonly TechStack[K][]
): TechStack[K][] {
  return allOptions.filter((option) => {
    const testStack = { ...currentStack, [dimension]: option };
    const validation = validateStack(testStack);
    return validation.valid;
  });
}

/**
 * Get valid languages for a given archetype
 */
export function getValidLanguagesForArchetype(archetype: Archetype): Language[] {
  return getLanguagesForArchetype(archetype);
}

/**
 * Get valid frameworks for a given archetype and language
 */
export function getValidFrameworks(archetype: Archetype, language: Language): Framework[] {
  const frameworks = getCompatibleFrameworks(archetype, language);
  return frameworks.map((f) => f.id);
}

/**
 * Get valid runtimes for a given language
 */
export function getValidRuntimes(language: Language): Runtime[] {
  return getRuntimesForLanguage(language);
}

/**
 * Get valid ORMs for a given database and language
 */
export function getValidOrms(database: Database, language: Language): ORM[] {
  if (database === 'none') return ['none'];
  const orms = getOrmsForStack(database, language);
  return orms.length > 0 ? orms : ['none'];
}

/**
 * Get valid databases for a given stack (most databases work with most stacks)
 */
export function getValidDatabases(stack: Partial<TechStack>): Database[] {
  // For web frontends, database is usually 'none'
  if (stack.archetype === 'web') {
    return ['none'];
  }

  // For backends and CLIs, SQL databases are most common
  if (stack.archetype === 'backend' || stack.archetype === 'cli') {
    return ['postgres', 'mysql', 'sqlite', 'mongodb', 'redis', 'none'];
  }

  return ['postgres', 'mysql', 'sqlite', 'mongodb', 'none'];
}

/**
 * Apply default pairings to a partial stack
 */
export function applyDefaults(stack: Partial<TechStack>): Partial<TechStack> {
  const result = { ...stack };

  for (const pairing of DEFAULT_PAIRINGS) {
    if (stack[pairing.key] === pairing.value) {
      for (const [key, value] of Object.entries(pairing.defaults)) {
        if (result[key as keyof TechStack] === undefined) {
          (result as Record<string, unknown>)[key] = value;
        }
      }
    }
  }

  return result;
}
