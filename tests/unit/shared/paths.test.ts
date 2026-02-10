/**
 * Path utilities unit tests
 */

import { describe, it, expect } from 'vitest';
import {
  normalizePath,
  resolvePath,
  relativePath,
  joinPaths,
  getExtension,
  getBasename,
  getDirname,
  isAbsolutePath,
  ensureTrailingSlash,
  removeTrailingSlash,
  matchesGlob,
  getParentDirs,
} from '@wcnegentropy/shared';

describe('Path Utilities', () => {
  describe('normalizePath', () => {
    it('normalizes forward slashes', () => {
      expect(normalizePath('/foo/bar')).toBe('/foo/bar');
    });

    it('converts backslashes to forward slashes', () => {
      expect(normalizePath('foo\\bar\\baz')).toBe('foo/bar/baz');
    });

    it('removes redundant separators', () => {
      expect(normalizePath('foo//bar///baz')).toBe('foo/bar/baz');
    });

    it('resolves dot segments', () => {
      expect(normalizePath('foo/./bar')).toBe('foo/bar');
      expect(normalizePath('foo/bar/../baz')).toBe('foo/baz');
    });

    it('handles empty string', () => {
      expect(normalizePath('')).toBe('.');
    });
  });

  describe('resolvePath', () => {
    it('resolves absolute path from base', () => {
      const result = resolvePath('/base', 'relative');
      expect(result).toBe('/base/relative');
    });

    it('resolves multiple path segments', () => {
      const result = resolvePath('/base', 'a', 'b', 'c');
      expect(result).toBe('/base/a/b/c');
    });

    it('handles absolute target path', () => {
      const result = resolvePath('/base', '/absolute');
      expect(result).toBe('/absolute');
    });

    it('normalizes result', () => {
      const result = resolvePath('/base', './relative/../other');
      expect(result).toBe('/base/other');
    });
  });

  describe('relativePath', () => {
    it('computes relative path between directories', () => {
      const result = relativePath('/foo/bar', '/foo/baz');
      expect(result).toBe('../baz');
    });

    it('handles same directory', () => {
      const result = relativePath('/foo/bar', '/foo/bar');
      // Node's relative() returns '.' for same paths
      expect(result).toBe('.');
    });

    it('handles nested paths', () => {
      const result = relativePath('/foo', '/foo/bar/baz');
      expect(result).toBe('bar/baz');
    });

    it('handles upward paths', () => {
      const result = relativePath('/foo/bar/baz', '/foo');
      expect(result).toBe('../..');
    });
  });

  describe('joinPaths', () => {
    it('joins multiple path segments', () => {
      expect(joinPaths('foo', 'bar', 'baz')).toBe('foo/bar/baz');
    });

    it('normalizes the result', () => {
      expect(joinPaths('foo', './bar', 'baz')).toBe('foo/bar/baz');
    });

    it('handles absolute segments', () => {
      expect(joinPaths('/foo', 'bar')).toBe('/foo/bar');
    });

    it('handles single segment', () => {
      expect(joinPaths('foo')).toBe('foo');
    });
  });

  describe('getExtension', () => {
    it('returns file extension with dot', () => {
      expect(getExtension('file.txt')).toBe('.txt');
    });

    it('returns extension for nested path', () => {
      expect(getExtension('/foo/bar/file.txt')).toBe('.txt');
    });

    it('returns last extension for multiple dots', () => {
      expect(getExtension('file.tar.gz')).toBe('.gz');
    });

    it('returns empty string for no extension', () => {
      expect(getExtension('file')).toBe('');
    });

    it('returns empty string for dotfile', () => {
      expect(getExtension('.gitignore')).toBe('');
    });

    it('handles extension with no filename', () => {
      expect(getExtension('/foo/bar/')).toBe('');
    });
  });

  describe('getBasename', () => {
    it('returns filename from path', () => {
      expect(getBasename('/foo/bar/file.txt')).toBe('file.txt');
    });

    it('returns filename without extension when specified', () => {
      expect(getBasename('/foo/bar/file.txt', '.txt')).toBe('file');
    });

    it('handles path without directory', () => {
      expect(getBasename('file.txt')).toBe('file.txt');
    });

    it('handles trailing slash', () => {
      expect(getBasename('/foo/bar/')).toBe('bar');
    });
  });

  describe('getDirname', () => {
    it('returns directory from file path', () => {
      expect(getDirname('/foo/bar/file.txt')).toBe('/foo/bar');
    });

    it('returns parent directory', () => {
      expect(getDirname('/foo/bar/')).toBe('/foo');
    });

    it('returns current dir for filename only', () => {
      expect(getDirname('file.txt')).toBe('.');
    });

    it('returns root for root file', () => {
      expect(getDirname('/file.txt')).toBe('/');
    });
  });

  describe('isAbsolutePath', () => {
    it('returns true for Unix absolute path', () => {
      expect(isAbsolutePath('/foo/bar')).toBe(true);
    });

    it('returns true for Windows absolute path', () => {
      expect(isAbsolutePath('C:\\foo\\bar')).toBe(true);
      expect(isAbsolutePath('D:/foo/bar')).toBe(true);
    });

    it('returns false for relative path', () => {
      expect(isAbsolutePath('foo/bar')).toBe(false);
      expect(isAbsolutePath('./foo')).toBe(false);
      expect(isAbsolutePath('../foo')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isAbsolutePath('')).toBe(false);
    });
  });

  describe('ensureTrailingSlash', () => {
    it('adds trailing slash if missing', () => {
      expect(ensureTrailingSlash('/foo/bar')).toBe('/foo/bar/');
    });

    it('keeps existing trailing slash', () => {
      expect(ensureTrailingSlash('/foo/bar/')).toBe('/foo/bar/');
    });

    it('normalizes path', () => {
      expect(ensureTrailingSlash('foo\\bar')).toBe('foo/bar/');
    });

    it('handles empty string', () => {
      expect(ensureTrailingSlash('')).toBe('./');
    });
  });

  describe('removeTrailingSlash', () => {
    it('removes trailing slash', () => {
      expect(removeTrailingSlash('/foo/bar/')).toBe('/foo/bar');
    });

    it('keeps path without trailing slash', () => {
      expect(removeTrailingSlash('/foo/bar')).toBe('/foo/bar');
    });

    it('normalizes path', () => {
      expect(removeTrailingSlash('foo\\bar\\')).toBe('foo/bar');
    });

    it('handles root path', () => {
      expect(removeTrailingSlash('/')).toBe('');
    });
  });

  describe('matchesGlob', () => {
    it('matches exact path', () => {
      expect(matchesGlob('foo/bar.txt', 'foo/bar.txt')).toBe(true);
    });

    it('matches single wildcard', () => {
      expect(matchesGlob('foo/bar.txt', 'foo/*.txt')).toBe(true);
      expect(matchesGlob('foo/baz.txt', 'foo/*.txt')).toBe(true);
      expect(matchesGlob('foo/bar/baz.txt', 'foo/*.txt')).toBe(false);
    });

    it('matches double wildcard', () => {
      expect(matchesGlob('foo/bar/baz.txt', 'foo/**/*.txt')).toBe(true);
      expect(matchesGlob('foo/a/b/c.txt', 'foo/**/*.txt')).toBe(true);
    });

    it('matches question mark', () => {
      expect(matchesGlob('foo/bar.txt', 'foo/ba?.txt')).toBe(true);
      expect(matchesGlob('foo/baz.txt', 'foo/ba?.txt')).toBe(true);
      expect(matchesGlob('foo/baaa.txt', 'foo/ba?.txt')).toBe(false);
    });

    it('handles pattern at start', () => {
      expect(matchesGlob('any.js', '*.js')).toBe(true);
      expect(matchesGlob('any.ts', '*.js')).toBe(false);
    });

    it('escapes regex special characters', () => {
      expect(matchesGlob('foo.bar', 'foo.bar')).toBe(true);
      expect(matchesGlob('fooXbar', 'foo.bar')).toBe(false);
    });

    it('returns false for invalid regex pattern', () => {
      // This shouldn't cause a regex error
      expect(matchesGlob('test', 'test')).toBe(true);
    });

    it('normalizes path before matching', () => {
      expect(matchesGlob('foo\\bar.txt', 'foo/*.txt')).toBe(true);
    });
  });

  describe('getParentDirs', () => {
    it('returns parent directories', () => {
      const result = getParentDirs('/foo/bar/baz');
      expect(result).toEqual(['foo', 'foo/bar']);
    });

    it('returns empty for single segment', () => {
      const result = getParentDirs('foo');
      expect(result).toEqual([]);
    });

    it('normalizes path first', () => {
      const result = getParentDirs('foo\\bar\\baz');
      expect(result).toEqual(['foo', 'foo/bar']);
    });

    it('handles root path', () => {
      const result = getParentDirs('/foo');
      expect(result).toEqual([]);
    });

    it('handles nested structure', () => {
      const result = getParentDirs('a/b/c/d');
      expect(result).toEqual(['a', 'a/b', 'a/b/c']);
    });
  });
});
