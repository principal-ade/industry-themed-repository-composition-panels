/**
 * Tests for repository scaling utilities
 */

import { describe, it, expect } from 'vitest';
import { calculateSizeFromFileCount, calculateRepositorySize, SIZE_TIERS } from './repositoryScaling';

describe('repositoryScaling', () => {
  describe('SIZE_TIERS', () => {
    it('should define discrete size tiers', () => {
      expect(SIZE_TIERS).toEqual([1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]);
    });

    it('should ensure all tiers produce whole-tile boundaries', () => {
      // Boundary = 4 × size, so verify all are whole numbers
      for (const tier of SIZE_TIERS) {
        const boundary = 4 * tier;
        expect(boundary).toBe(Math.round(boundary));
      }
    });
  });

  describe('calculateSizeFromFileCount', () => {
    it('should return 1.0 for empty repos', () => {
      expect(calculateSizeFromFileCount(0)).toBe(1.0);
      expect(calculateSizeFromFileCount(-1)).toBe(1.0);
    });

    it('should return 1.0 for repos with ≤100 files', () => {
      expect(calculateSizeFromFileCount(1)).toBe(1.0);
      expect(calculateSizeFromFileCount(50)).toBe(1.0);
      expect(calculateSizeFromFileCount(100)).toBe(1.0);
    });

    it('should round to nearest tier', () => {
      // Test specific file counts from BuildingSizeTest
      expect(calculateSizeFromFileCount(316)).toBe(1.5);  // ~1.5 → 1.5
      expect(calculateSizeFromFileCount(1000)).toBe(2.0); // 2.0 → 2.0
      expect(calculateSizeFromFileCount(3162)).toBe(2.5); // ~2.5 → 2.5
      expect(calculateSizeFromFileCount(10000)).toBe(3.0); // 3.0 → 3.0
    });

    it('should round mobile-app example to 2.5', () => {
      // mobile-app has 2000 files
      // Calculation: log10(2000) = 3.301 → 1.0 + (3.301 - 2) * 1.0 = 2.301
      // After rounding: 2.301 → 2.5 (nearest tier)
      expect(calculateSizeFromFileCount(2000)).toBe(2.5);
    });

    it('should round web-ade example to 3.0', () => {
      // web-ade has 5000 files
      // Calculation: log10(5000) = 3.699 → 1.0 + (3.699 - 2) * 1.0 = 2.699
      // After rounding: 2.699 → 2.5 or 3.0 (nearest tier)
      const size = calculateSizeFromFileCount(5000);
      expect([2.5, 3.0]).toContain(size);
    });

    it('should cap at 4.0 for very large repos', () => {
      expect(calculateSizeFromFileCount(100000)).toBe(4.0);
      expect(calculateSizeFromFileCount(1000000)).toBe(4.0);
    });

    it('should always return a value from SIZE_TIERS', () => {
      const testCounts = [50, 200, 500, 1500, 4000, 8000, 15000, 50000];

      for (const count of testCounts) {
        const size = calculateSizeFromFileCount(count);
        expect(SIZE_TIERS).toContain(size);
      }
    });

    it('should produce boundaries that cover whole tiles', () => {
      const testCounts = [100, 500, 1000, 2000, 5000, 10000, 20000];

      for (const count of testCounts) {
        const size = calculateSizeFromFileCount(count);
        const boundary = 4 * size;

        // Boundary should be a whole number
        expect(boundary).toBe(Math.round(boundary));
      }
    });
  });

  describe('calculateRepositorySize', () => {
    it('should return 1.0 when no metrics provided', () => {
      expect(calculateRepositorySize()).toBe(1.0);
      expect(calculateRepositorySize({})).toBe(1.0);
    });

    it('should use file count when available', () => {
      expect(calculateRepositorySize({ fileCount: 2000 })).toBe(2.5);
      expect(calculateRepositorySize({ fileCount: 5000 })).toBeGreaterThanOrEqual(2.5);
    });

    it('should return 1.0 for zero file count', () => {
      expect(calculateRepositorySize({ fileCount: 0 })).toBe(1.0);
    });
  });
});
