/**
 * Jinja2 filters unit tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JINJA2_FILTERS, evaluateJinja2Expression } from '@wcnegentropy/core/transpiler';

describe('Jinja2 Filters', () => {
  describe('String Case Filters', () => {
    describe('upper', () => {
      it('converts string to uppercase', () => {
        expect(JINJA2_FILTERS.upper('hello')).toBe('HELLO');
      });

      it('handles mixed case', () => {
        expect(JINJA2_FILTERS.upper('HeLLo WoRLD')).toBe('HELLO WORLD');
      });

      it('handles non-string input', () => {
        expect(JINJA2_FILTERS.upper(123)).toBe('123');
      });
    });

    describe('lower', () => {
      it('converts string to lowercase', () => {
        expect(JINJA2_FILTERS.lower('HELLO')).toBe('hello');
      });

      it('handles mixed case', () => {
        expect(JINJA2_FILTERS.lower('HeLLo WoRLD')).toBe('hello world');
      });

      it('handles non-string input', () => {
        expect(JINJA2_FILTERS.lower(123)).toBe('123');
      });
    });

    describe('capitalize', () => {
      it('capitalizes first letter', () => {
        expect(JINJA2_FILTERS.capitalize('hello')).toBe('Hello');
      });

      it('lowercases rest of string', () => {
        expect(JINJA2_FILTERS.capitalize('hELLO')).toBe('Hello');
      });

      it('handles empty string', () => {
        expect(JINJA2_FILTERS.capitalize('')).toBe('');
      });
    });

    describe('title', () => {
      it('capitalizes each word', () => {
        expect(JINJA2_FILTERS.title('hello world')).toBe('Hello World');
      });

      it('handles mixed case', () => {
        expect(JINJA2_FILTERS.title('hELLO wORLD')).toBe('Hello World');
      });

      it('handles single word', () => {
        expect(JINJA2_FILTERS.title('hello')).toBe('Hello');
      });
    });
  });

  describe('String Transformation Filters', () => {
    describe('replace', () => {
      it('replaces all occurrences', () => {
        expect(JINJA2_FILTERS.replace('hello world world', 'world', 'there')).toBe(
          'hello there there'
        );
      });

      it('handles no matches', () => {
        expect(JINJA2_FILTERS.replace('hello', 'x', 'y')).toBe('hello');
      });
    });

    describe('slug', () => {
      it('converts to kebab-case', () => {
        expect(JINJA2_FILTERS.slug('Hello World')).toBe('hello-world');
      });

      it('removes special characters', () => {
        expect(JINJA2_FILTERS.slug('Hello! World?')).toBe('hello-world');
      });

      it('handles multiple spaces', () => {
        expect(JINJA2_FILTERS.slug('hello   world')).toBe('hello-world');
      });

      it('removes leading/trailing hyphens', () => {
        expect(JINJA2_FILTERS.slug('  hello world  ')).toBe('hello-world');
      });
    });

    describe('snake', () => {
      it('converts to snake_case', () => {
        expect(JINJA2_FILTERS.snake('HelloWorld')).toBe('hello_world');
      });

      it('handles spaces', () => {
        expect(JINJA2_FILTERS.snake('hello world')).toBe('hello_world');
      });

      it('handles kebab-case input', () => {
        expect(JINJA2_FILTERS.snake('hello-world')).toBe('hello_world');
      });
    });

    describe('camel', () => {
      it('converts to camelCase', () => {
        expect(JINJA2_FILTERS.camel('hello_world')).toBe('helloWorld');
      });

      it('handles spaces', () => {
        expect(JINJA2_FILTERS.camel('hello world')).toBe('helloWorld');
      });

      it('handles kebab-case input', () => {
        expect(JINJA2_FILTERS.camel('hello-world')).toBe('helloWorld');
      });

      it('ensures first char is lowercase', () => {
        expect(JINJA2_FILTERS.camel('Hello_world')).toBe('helloWorld');
      });
    });

    describe('pascal', () => {
      it('converts to PascalCase', () => {
        expect(JINJA2_FILTERS.pascal('hello_world')).toBe('HelloWorld');
      });

      it('handles spaces', () => {
        expect(JINJA2_FILTERS.pascal('hello world')).toBe('HelloWorld');
      });

      it('handles kebab-case input', () => {
        expect(JINJA2_FILTERS.pascal('hello-world')).toBe('HelloWorld');
      });
    });

    describe('trim', () => {
      it('removes whitespace from both ends', () => {
        expect(JINJA2_FILTERS.trim('  hello  ')).toBe('hello');
      });

      it('handles tabs and newlines', () => {
        expect(JINJA2_FILTERS.trim('\t\nhello\n\t')).toBe('hello');
      });
    });

    describe('truncate', () => {
      it('truncates long strings', () => {
        expect(JINJA2_FILTERS.truncate('hello world', 8)).toBe('hello...');
      });

      it('does not truncate short strings', () => {
        expect(JINJA2_FILTERS.truncate('hi', 10)).toBe('hi');
      });

      it('uses custom ending', () => {
        expect(JINJA2_FILTERS.truncate('hello world', 8, '!')).toBe('hello w!');
      });

      it('uses default length of 50', () => {
        const longStr = 'a'.repeat(60);
        const result = JINJA2_FILTERS.truncate(longStr) as string;
        expect(result.length).toBe(50);
      });
    });

    describe('wordwrap', () => {
      it('wraps text at specified width', () => {
        const text = 'hello world how are you';
        const result = JINJA2_FILTERS.wordwrap(text, 10);
        expect(result).toBe('hello\nworld how\nare you');
      });

      it('handles single long word', () => {
        const result = JINJA2_FILTERS.wordwrap('supercalifragilistic', 10);
        expect(result).toBe('supercalifragilistic');
      });

      it('uses default width of 79', () => {
        const text = 'a '.repeat(50);
        const result = JINJA2_FILTERS.wordwrap(text);
        expect(result).toContain('\n');
      });
    });
  });

  describe('Array/String Filters', () => {
    describe('first', () => {
      it('gets first array element', () => {
        expect(JINJA2_FILTERS.first(['a', 'b', 'c'])).toBe('a');
      });

      it('gets first character of string', () => {
        expect(JINJA2_FILTERS.first('hello')).toBe('h');
      });

      it('returns undefined for empty array', () => {
        expect(JINJA2_FILTERS.first([])).toBeUndefined();
      });
    });

    describe('last', () => {
      it('gets last array element', () => {
        expect(JINJA2_FILTERS.last(['a', 'b', 'c'])).toBe('c');
      });

      it('gets last character of string', () => {
        expect(JINJA2_FILTERS.last('hello')).toBe('o');
      });

      it('returns undefined for empty array', () => {
        expect(JINJA2_FILTERS.last([])).toBeUndefined();
      });
    });

    describe('join', () => {
      it('joins array with default separator', () => {
        expect(JINJA2_FILTERS.join(['a', 'b', 'c'])).toBe('a, b, c');
      });

      it('joins array with custom separator', () => {
        expect(JINJA2_FILTERS.join(['a', 'b', 'c'], '-')).toBe('a-b-c');
      });

      it('returns string for non-array input', () => {
        expect(JINJA2_FILTERS.join('hello')).toBe('hello');
      });
    });

    describe('split', () => {
      it('splits string with default separator', () => {
        expect(JINJA2_FILTERS.split('a,b,c')).toEqual(['a', 'b', 'c']);
      });

      it('splits string with custom separator', () => {
        expect(JINJA2_FILTERS.split('a-b-c', '-')).toEqual(['a', 'b', 'c']);
      });
    });

    describe('length', () => {
      it('gets array length', () => {
        expect(JINJA2_FILTERS.length(['a', 'b', 'c'])).toBe(3);
      });

      it('gets string length', () => {
        expect(JINJA2_FILTERS.length('hello')).toBe(5);
      });

      it('handles empty array', () => {
        expect(JINJA2_FILTERS.length([])).toBe(0);
      });

      it('handles empty string', () => {
        expect(JINJA2_FILTERS.length('')).toBe(0);
      });
    });
  });

  describe('Type Conversion Filters', () => {
    describe('int', () => {
      it('converts string to integer', () => {
        expect(JINJA2_FILTERS.int('42')).toBe(42);
      });

      it('truncates decimal values', () => {
        expect(JINJA2_FILTERS.int('3.14')).toBe(3);
      });

      it('returns default for invalid input', () => {
        expect(JINJA2_FILTERS.int('not a number', 10)).toBe(10);
      });

      it('uses default of 0', () => {
        expect(JINJA2_FILTERS.int('abc')).toBe(0);
      });
    });

    describe('float', () => {
      it('converts string to float', () => {
        expect(JINJA2_FILTERS.float('3.14')).toBe(3.14);
      });

      it('handles integer strings', () => {
        expect(JINJA2_FILTERS.float('42')).toBe(42);
      });

      it('returns default for invalid input', () => {
        expect(JINJA2_FILTERS.float('not a number', 1.5)).toBe(1.5);
      });

      it('uses default of 0.0', () => {
        expect(JINJA2_FILTERS.float('abc')).toBe(0);
      });
    });

    describe('string', () => {
      it('converts number to string', () => {
        expect(JINJA2_FILTERS.string(42)).toBe('42');
      });

      it('converts boolean to string', () => {
        expect(JINJA2_FILTERS.string(true)).toBe('true');
      });

      it('converts null to string', () => {
        expect(JINJA2_FILTERS.string(null)).toBe('null');
      });
    });

    describe('bool', () => {
      it('returns boolean unchanged', () => {
        expect(JINJA2_FILTERS.bool(true)).toBe(true);
        expect(JINJA2_FILTERS.bool(false)).toBe(false);
      });

      it('converts truthy strings', () => {
        expect(JINJA2_FILTERS.bool('true')).toBe(true);
        expect(JINJA2_FILTERS.bool('yes')).toBe(true);
        expect(JINJA2_FILTERS.bool('1')).toBe(true);
        expect(JINJA2_FILTERS.bool('on')).toBe(true);
      });

      it('converts falsy strings', () => {
        expect(JINJA2_FILTERS.bool('false')).toBe(false);
        expect(JINJA2_FILTERS.bool('no')).toBe(false);
        expect(JINJA2_FILTERS.bool('')).toBe(false);
      });

      it('handles case insensitivity', () => {
        expect(JINJA2_FILTERS.bool('TRUE')).toBe(true);
        expect(JINJA2_FILTERS.bool('YES')).toBe(true);
      });

      it('converts numbers', () => {
        expect(JINJA2_FILTERS.bool(1)).toBe(true);
        expect(JINJA2_FILTERS.bool(0)).toBe(false);
      });
    });
  });

  describe('Numeric Filters', () => {
    describe('abs', () => {
      it('returns absolute value of positive number', () => {
        expect(JINJA2_FILTERS.abs(5)).toBe(5);
      });

      it('returns absolute value of negative number', () => {
        expect(JINJA2_FILTERS.abs(-5)).toBe(5);
      });

      it('handles string input', () => {
        expect(JINJA2_FILTERS.abs('-42')).toBe(42);
      });
    });

    describe('round', () => {
      it('rounds to nearest integer by default', () => {
        expect(JINJA2_FILTERS.round(3.5)).toBe(4);
        expect(JINJA2_FILTERS.round(3.4)).toBe(3);
      });

      it('rounds to specified precision', () => {
        expect(JINJA2_FILTERS.round(3.14159, 2)).toBe(3.14);
        expect(JINJA2_FILTERS.round(3.14159, 3)).toBe(3.142);
      });

      it('handles string input', () => {
        expect(JINJA2_FILTERS.round('3.5')).toBe(4);
      });
    });
  });

  describe('Default Filter', () => {
    describe('default', () => {
      it('returns value if defined', () => {
        expect(JINJA2_FILTERS.default('hello', 'default')).toBe('hello');
      });

      it('returns default for null', () => {
        expect(JINJA2_FILTERS.default(null, 'default')).toBe('default');
      });

      it('returns default for undefined', () => {
        expect(JINJA2_FILTERS.default(undefined, 'default')).toBe('default');
      });

      it('returns default for empty string', () => {
        expect(JINJA2_FILTERS.default('', 'default')).toBe('default');
      });

      it('keeps 0 as valid value', () => {
        expect(JINJA2_FILTERS.default(0, 'default')).toBe(0);
      });

      it('keeps false as valid value', () => {
        expect(JINJA2_FILTERS.default(false, 'default')).toBe(false);
      });
    });
  });
});

describe('evaluateJinja2Expression', () => {
  describe('Basic Variable Substitution', () => {
    it('substitutes simple variable', () => {
      const result = evaluateJinja2Expression('{{ name }}', { name: 'John' });
      expect(result).toBe('John');
    });

    it('returns original string if not a jinja expression', () => {
      const result = evaluateJinja2Expression('not a template', { name: 'John' });
      expect(result).toBe('not a template');
    });

    it('returns undefined for missing variable', () => {
      const result = evaluateJinja2Expression('{{ missing }}', {});
      expect(result).toBeUndefined();
    });
  });

  describe('Nested Variable Access', () => {
    it('accesses nested properties', () => {
      const result = evaluateJinja2Expression('{{ user.name }}', {
        user: { name: 'John' },
      });
      expect(result).toBe('John');
    });

    it('accesses deeply nested properties', () => {
      const result = evaluateJinja2Expression('{{ a.b.c }}', {
        a: { b: { c: 'deep' } },
      });
      expect(result).toBe('deep');
    });

    it('returns undefined for invalid path', () => {
      const result = evaluateJinja2Expression('{{ user.missing }}', {
        user: { name: 'John' },
      });
      expect(result).toBeUndefined();
    });
  });

  describe('Environment Variables', () => {
    beforeEach(() => {
      vi.stubEnv('TEST_VAR', 'test_value');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('accesses environment variables', () => {
      const result = evaluateJinja2Expression('{{ env.TEST_VAR }}', {});
      expect(result).toBe('test_value');
    });

    it('returns empty string for missing env var', () => {
      const result = evaluateJinja2Expression('{{ env.NONEXISTENT }}', {});
      expect(result).toBe('');
    });
  });

  describe('Filter Application', () => {
    it('applies single filter', () => {
      const result = evaluateJinja2Expression('{{ name | upper }}', {
        name: 'john',
      });
      expect(result).toBe('JOHN');
    });

    it('applies multiple filters', () => {
      const result = evaluateJinja2Expression('{{ name | lower | capitalize }}', {
        name: 'JOHN DOE',
      });
      expect(result).toBe('John doe');
    });

    it('applies filter with arguments', () => {
      const result = evaluateJinja2Expression('{{ items | join("-") }}', {
        items: ['a', 'b', 'c'],
      });
      expect(result).toBe('a-b-c');
    });

    it('applies filter with numeric argument', () => {
      const result = evaluateJinja2Expression('{{ text | truncate(5) }}', {
        text: 'hello world',
      });
      expect(result).toBe('he...');
    });

    it('applies filter with multiple arguments', () => {
      const result = evaluateJinja2Expression('{{ text | replace("world", "there") }}', {
        text: 'hello world',
      });
      expect(result).toBe('hello there');
    });
  });

  describe('Filter with Boolean Arguments', () => {
    it('parses true argument', () => {
      // Testing that boolean arguments are parsed correctly
      const result = evaluateJinja2Expression('{{ val | default(true) }}', {
        val: null,
      });
      expect(result).toBe(true);
    });

    it('parses false argument', () => {
      const result = evaluateJinja2Expression('{{ val | default(false) }}', {
        val: undefined,
      });
      expect(result).toBe(false);
    });
  });

  describe('Unknown Filters', () => {
    it('warns and continues for unknown filter', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = evaluateJinja2Expression('{{ name | unknownFilter }}', {
        name: 'john',
      });

      expect(result).toBe('john');
      expect(warnSpy).toHaveBeenCalledWith('Unknown Jinja2 filter: unknownFilter');

      warnSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles whitespace in expression', () => {
      const result = evaluateJinja2Expression('{{   name   |   upper   }}', {
        name: 'john',
      });
      expect(result).toBe('JOHN');
    });

    it('handles filter chains with conversion', () => {
      const result = evaluateJinja2Expression('{{ name | slug | upper }}', {
        name: 'Hello World',
      });
      expect(result).toBe('HELLO-WORLD');
    });
  });
});
