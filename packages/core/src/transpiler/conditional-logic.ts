/**
 * Conditional Logic Transpiler
 *
 * Maps UPG `when` clauses to JSON Schema dependencies and oneOf blocks.
 */

import type { ManifestPrompt } from '@wcnegentropy/shared';

/**
 * Conditional logic result
 */
export interface ConditionalLogicResult {
  /** JSON Schema dependencies object */
  dependencies?: Record<string, unknown>;
  /** JSON Schema allOf with if/then blocks */
  allOf?: Array<{
    if: { properties: Record<string, unknown> };
    then: { properties: Record<string, unknown>; required?: string[] };
  }>;
}

/**
 * Parsed condition from a `when` clause
 */
interface ParsedCondition {
  /** Field being checked */
  field: string;
  /** Operator (==, !=, in, not_in) */
  operator: '==' | '!=' | 'in' | 'not_in' | 'truthy' | 'falsy';
  /** Value being compared */
  value: unknown;
  /** Whether this is negated */
  negated: boolean;
}

/**
 * Parse a simple `when` clause expression
 *
 * Supports:
 * - "field_name" (truthy check)
 * - "not field_name" (falsy check)
 * - "field_name == value"
 * - "field_name != value"
 * - "field_name == 'string'"
 * - "field_name == true"
 * - "field_name == false"
 *
 * @param expression - The when clause expression
 * @returns Parsed condition or null if not parseable
 */
function parseWhenExpression(expression: string): ParsedCondition | null {
  const trimmed = expression.trim();

  // Handle "not field_name" (falsy check)
  if (trimmed.startsWith('not ')) {
    const field = trimmed.slice(4).trim();
    if (/^[a-z_][a-z0-9_]*$/i.test(field)) {
      return {
        field,
        operator: 'falsy',
        value: false,
        negated: true,
      };
    }
  }

  // Handle equality/inequality
  const eqMatch = trimmed.match(/^([a-z_][a-z0-9_]*)\s*(==|!=)\s*(.+)$/i);
  if (eqMatch) {
    const [, field, op, rawValue] = eqMatch;
    let value: unknown = rawValue.trim();

    // Parse value
    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else if (value === 'null' || value === 'none') {
      value = null;
    } else if (/^["'].*["']$/.test(value as string)) {
      // String literal
      value = (value as string).slice(1, -1);
    } else if (/^-?\d+$/.test(value as string)) {
      // Integer
      value = parseInt(value as string, 10);
    } else if (/^-?\d+\.\d+$/.test(value as string)) {
      // Float
      value = parseFloat(value as string);
    }

    return {
      field,
      operator: op as '==' | '!=',
      value,
      negated: op === '!=',
    };
  }

  // Handle simple field name (truthy check)
  if (/^[a-z_][a-z0-9_]*$/i.test(trimmed)) {
    return {
      field: trimmed,
      operator: 'truthy',
      value: true,
      negated: false,
    };
  }

  return null;
}

/**
 * Convert a parsed condition to JSON Schema if/then block
 */
function conditionToIfThen(
  condition: ParsedCondition,
  promptId: string
): {
  if: { properties: Record<string, unknown> };
  then: { properties: Record<string, unknown>; required?: string[] };
} | null {
  const { field, operator, value } = condition;

  // Build the "if" condition
  let ifCondition: Record<string, unknown>;

  switch (operator) {
    case '==':
    case 'truthy':
      if (typeof value === 'boolean') {
        ifCondition = { [field]: { const: value } };
      } else if (value === null) {
        ifCondition = { [field]: { type: 'null' } };
      } else {
        ifCondition = { [field]: { const: value } };
      }
      break;

    case '!=':
    case 'falsy':
      if (typeof value === 'boolean') {
        ifCondition = { [field]: { const: !value } };
      } else {
        // Use "not" schema
        ifCondition = { [field]: { not: { const: value } } };
      }
      break;

    default:
      return null;
  }

  // Build the "then" - make the dependent field visible
  return {
    if: { properties: ifCondition },
    then: {
      properties: {
        [promptId]: {}, // Empty object means "include this property"
      },
    },
  };
}

/**
 * Transpile prompt `when` clauses to JSON Schema conditional logic
 *
 * @param prompts - Array of manifest prompts
 * @returns Dependencies and allOf blocks for JSON Schema
 */
export function transpileConditionalLogic(prompts: ManifestPrompt[]): ConditionalLogicResult {
  const result: ConditionalLogicResult = {
    dependencies: {},
    allOf: [],
  };

  for (const prompt of prompts) {
    if (!prompt.when) {
      continue;
    }

    const condition = parseWhenExpression(prompt.when);
    if (!condition) {
      // Could not parse - skip this condition
      console.warn(`Could not parse when clause: ${prompt.when}`);
      continue;
    }

    // Add simple dependency
    if (!result.dependencies![condition.field]) {
      result.dependencies![condition.field] = [];
    }
    (result.dependencies![condition.field] as string[]).push(prompt.id);

    // Add if/then block for complex conditions
    const ifThen = conditionToIfThen(condition, prompt.id);
    if (ifThen) {
      result.allOf!.push(ifThen);
    }
  }

  // Clean up empty objects
  if (Object.keys(result.dependencies!).length === 0) {
    delete result.dependencies;
  }
  if (result.allOf!.length === 0) {
    delete result.allOf;
  }

  return result;
}

/**
 * Evaluate a `when` clause against form data
 *
 * This is used at runtime to determine visibility.
 *
 * @param expression - The when clause expression
 * @param formData - Current form data
 * @returns Whether the condition is met
 */
export function evaluateWhenClause(expression: string, formData: Record<string, unknown>): boolean {
  const condition = parseWhenExpression(expression);
  if (!condition) {
    // If we can't parse it, default to showing the field
    return true;
  }

  const actualValue = formData[condition.field];

  switch (condition.operator) {
    case '==':
      return actualValue === condition.value;
    case '!=':
      return actualValue !== condition.value;
    case 'truthy':
      return Boolean(actualValue);
    case 'falsy':
      return !actualValue;
    default:
      return true;
  }
}
