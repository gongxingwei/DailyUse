/**
 * Fuzzy Search Engine Tests
 */

import { describe, it, expect } from 'vitest';
import {
  levenshteinDistance,
  fuzzyMatch,
  fuzzyMatchMultiField,
  fuzzyFilter,
  highlightMatches,
} from '../fuzzySearch';

describe('FuzzySearch', () => {
  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
      expect(levenshteinDistance('', '')).toBe(0);
    });

    it('should return length for empty string comparison', () => {
      expect(levenshteinDistance('', 'hello')).toBe(5);
      expect(levenshteinDistance('hello', '')).toBe(5);
    });

    it('should calculate correct distance for substitution', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
    });

    it('should calculate correct distance for insertion/deletion', () => {
      expect(levenshteinDistance('hello', 'helo')).toBe(1);
      expect(levenshteinDistance('hello', 'helloo')).toBe(1);
    });

    it('should be case sensitive', () => {
      expect(levenshteinDistance('Hello', 'hello')).toBe(1);
    });
  });

  describe('fuzzyMatch', () => {
    it('should return 100 for exact match', () => {
      const result = fuzzyMatch('hello', 'hello');
      expect(result.score).toBe(100);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]).toEqual({ start: 0, end: 5, length: 5 });
    });

    it('should return 100 for substring match', () => {
      const result = fuzzyMatch('world', 'hello world');
      expect(result.score).toBe(100);
      expect(result.matches.length).toBeGreaterThan(0);
    });

    it('should be case insensitive by default', () => {
      const result = fuzzyMatch('HELLO', 'hello world');
      expect(result.score).toBe(100);
    });

    it('should handle case sensitive option', () => {
      const result = fuzzyMatch('HELLO', 'hello world', { caseSensitive: true });
      expect(result.score).toBeLessThan(100);
    });

    it('should match with typos', () => {
      const result = fuzzyMatch('helo', 'hello');
      expect(result.score).toBeGreaterThan(60);
    });

    it('should match acronyms', () => {
      const result = fuzzyMatch('cpt', 'Create Project Task');
      expect(result.score).toBe(90);
    });

    it('should return 0 for empty query', () => {
      const result = fuzzyMatch('', 'hello world');
      expect(result.score).toBe(0);
      expect(result.matches).toHaveLength(0);
    });

    it('should respect threshold option', () => {
      const result = fuzzyMatch('xyz', 'hello world', { threshold: 80 });
      expect(result.score).toBeLessThan(80);
    });

    it('should match multiple occurrences', () => {
      const result = fuzzyMatch('test', 'test test test');
      expect(result.score).toBe(100);
      expect(result.matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('fuzzyMatchMultiField', () => {
    it('should search across multiple fields', () => {
      const result = fuzzyMatchMultiField(
        'typescript',
        {
          title: 'Learn TypeScript',
          description: 'A course about TypeScript',
        },
        {
          title: 1.0,
          description: 0.5,
        }
      );

      expect(result.score).toBeGreaterThan(80);
    });

    it('should apply field weights', () => {
      const result1 = fuzzyMatchMultiField(
        'important',
        {
          title: 'This is important',
          description: 'Not here',
        },
        {
          title: 1.0,
          description: 0.1,
        }
      );

      const result2 = fuzzyMatchMultiField(
        'important',
        {
          title: 'Not here',
          description: 'This is important',
        },
        {
          title: 1.0,
          description: 0.1,
        }
      );

      expect(result1.score).toBeGreaterThan(result2.score);
    });

    it('should handle empty fields', () => {
      const result = fuzzyMatchMultiField(
        'test',
        {
          title: 'test',
          description: '',
        },
        {
          title: 1.0,
          description: 0.5,
        }
      );

      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('fuzzyFilter', () => {
    const items = [
      { id: 1, name: 'TypeScript Tutorial' },
      { id: 2, name: 'JavaScript Basics' },
      { id: 3, name: 'Python Guide' },
      { id: 4, name: 'TypeScript Advanced' },
    ];

    it('should filter and sort items by score', () => {
      const results = fuzzyFilter(
        'typescript',
        items,
        (item) => item.name,
        { threshold: 60 }
      );

      expect(results.length).toBe(2);
      expect(results[0].name).toContain('TypeScript');
      expect(results[0]._score).toBeGreaterThanOrEqual(results[1]._score);
    });

    it('should return empty array for no matches', () => {
      const results = fuzzyFilter(
        'rust',
        items,
        (item) => item.name,
        { threshold: 60 }
      );

      expect(results).toHaveLength(0);
    });

    it('should include match positions', () => {
      const results = fuzzyFilter(
        'script',
        items,
        (item) => item.name,
        { threshold: 50 }
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]._matches).toBeDefined();
    });
  });

  describe('highlightMatches', () => {
    it('should highlight single match', () => {
      const result = highlightMatches(
        'hello world',
        [{ start: 0, end: 5, length: 5 }],
        '<mark>',
        '</mark>'
      );

      expect(result).toBe('<mark>hello</mark> world');
    });

    it('should highlight multiple matches', () => {
      const result = highlightMatches(
        'hello world hello',
        [
          { start: 0, end: 5, length: 5 },
          { start: 12, end: 17, length: 5 },
        ],
        '<mark>',
        '</mark>'
      );

      expect(result).toBe('<mark>hello</mark> world <mark>hello</mark>');
    });

    it('should merge overlapping matches', () => {
      const result = highlightMatches(
        'hello world',
        [
          { start: 0, end: 5, length: 5 },
          { start: 3, end: 8, length: 5 },
        ],
        '<mark>',
        '</mark>'
      );

      expect(result).toBe('<mark>hello wo</mark>rld');
    });

    it('should return original text if no matches', () => {
      const result = highlightMatches('hello world', [], '<mark>', '</mark>');

      expect(result).toBe('hello world');
    });

    it('should use custom markers', () => {
      const result = highlightMatches(
        'hello world',
        [{ start: 0, end: 5, length: 5 }],
        '**',
        '**'
      );

      expect(result).toBe('**hello** world');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      const result = fuzzyMatch('aaa', longString);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should handle special characters', () => {
      const result = fuzzyMatch('hello!', 'hello! world');
      expect(result.score).toBe(100);
    });

    it('should handle unicode characters', () => {
      const result = fuzzyMatch('你好', '你好世界');
      expect(result.score).toBe(100);
    });

    it('should handle numbers', () => {
      const result = fuzzyMatch('123', 'test 123 test');
      expect(result.score).toBe(100);
    });
  });

  describe('Performance', () => {
    it('should complete search in reasonable time', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i} with random text ${Math.random()}`,
      }));

      const startTime = performance.now();
      const results = fuzzyFilter(
        'random',
        items,
        (item) => item.name,
        { threshold: 60 }
      );
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(500); // Should complete in < 500ms
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
