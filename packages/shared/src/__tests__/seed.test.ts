import { describe, it, expect } from 'vitest';
import { parseSeed } from '../utils/seed.js';

describe('parseSeed', () => {
  it('should accept valid positive integer seeds', () => {
    expect(parseSeed('1')).toEqual({ valid: true, seed: 1 });
    expect(parseSeed('42')).toEqual({ valid: true, seed: 42 });
    expect(parseSeed('999999')).toEqual({ valid: true, seed: 999999 });
  });

  it('should accept MAX_SAFE_INTEGER', () => {
    const result = parseSeed('9007199254740991');
    expect(result.valid).toBe(true);
    expect(result.seed).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('should reject zero and negative', () => {
    expect(parseSeed('0').valid).toBe(false);
    expect(parseSeed('-1').valid).toBe(false);
  });

  it('should reject non-numeric strings', () => {
    expect(parseSeed('abc').valid).toBe(false);
    expect(parseSeed('').valid).toBe(false);
  });

  it('should reject float seeds (Bug 8)', () => {
    const result = parseSeed('3.14');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('integer');
  });

  it('should accept valid scientific notation like 1e10 (Bug 9)', () => {
    const result = parseSeed('1e10');
    expect(result.valid).toBe(true);
    expect(result.seed).toBe(10000000000);
  });

  it('should reject overflow seeds beyond MAX_SAFE_INTEGER (Bug 7)', () => {
    const result = parseSeed('9007199254740992');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('safe integer');
  });

  it('should reject seeds with leading/trailing whitespace', () => {
    expect(parseSeed(' 42').valid).toBe(false);
    expect(parseSeed('42 ').valid).toBe(false);
  });
});
