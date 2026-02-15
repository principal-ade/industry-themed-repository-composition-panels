/**
 * Tests for sprite layout engine
 * Ensures collision-free placement with proper boundary calculations
 */

import { describe, it, expect } from 'vitest';
import { layoutSpritesInRegion, layoutSpritesMultiRegion } from './spriteLayoutEngine';

describe('spriteLayoutEngine', () => {
  describe('layoutSpritesInRegion', () => {
    it('should place single sprite in center of small region', () => {
      const nodes = [{ id: 'node1', size: 1.0 }];
      const bounds = { width: 10, height: 10 };

      const result = layoutSpritesInRegion(nodes, bounds);

      expect(result.placed).toHaveLength(1);
      expect(result.overflow).toHaveLength(0);

      const node = result.placed[0];
      // Boundary radius is 2 × size = 2 tiles
      // Should be placed at (2, 2) minimum (radius from edge)
      expect(node.gridX).toBeGreaterThanOrEqual(2);
      expect(node.gridY).toBeGreaterThanOrEqual(2);
    });

    it('should not overlap sprite boundaries with default spacing', () => {
      const nodes = [
        { id: 'node1', size: 1.5 }, // Boundary radius = 3 tiles
        { id: 'node2', size: 1.5 }, // Boundary radius = 3 tiles
      ];
      const bounds = { width: 25, height: 25 };
      const spacing = 0.5;

      const result = layoutSpritesInRegion(nodes, bounds, { spacing });

      expect(result.placed).toHaveLength(2);

      const [n1, n2] = result.placed;
      const distance = Math.sqrt(
        Math.pow(n1.gridX - n2.gridX, 2) +
        Math.pow(n1.gridY - n2.gridY, 2)
      );

      // Distance should be >= sum of radii + spacing
      // radius1 = 3, radius2 = 3, spacing = 0.5
      // minimum distance = 3 + 3 + 0.5 = 6.5
      expect(distance).toBeGreaterThanOrEqual(6.5);
    });

    it('should respect boundary size when checking collisions', () => {
      // Test that boundaries (not sprite size) determine collision
      const nodes = [
        { id: 'large', size: 2.0 }, // Boundary = 4 × 2.0 = 8 tiles (radius 4)
        { id: 'small', size: 1.0 }, // Boundary = 4 × 1.0 = 4 tiles (radius 2)
      ];
      const bounds = { width: 25, height: 25 };
      const spacing = 0.5;

      const result = layoutSpritesInRegion(nodes, bounds, { spacing });

      expect(result.placed).toHaveLength(2);

      const large = result.placed.find(n => n.id === 'large')!;
      const small = result.placed.find(n => n.id === 'small')!;

      const distance = Math.sqrt(
        Math.pow(large.gridX - small.gridX, 2) +
        Math.pow(large.gridY - small.gridY, 2)
      );

      // minimum distance = 4 + 2 + 0.5 = 6.5
      expect(distance).toBeGreaterThanOrEqual(6.5);
    });

    it('should place sprites within region bounds including boundary size', () => {
      const nodes = [{ id: 'node1', size: 2.0 }]; // radius = 4
      const bounds = { width: 20, height: 20 };

      const result = layoutSpritesInRegion(nodes, bounds);

      expect(result.placed).toHaveLength(1);

      const node = result.placed[0];
      const radius = 2 * node.size; // 4 tiles

      // Node center must be at least radius from edges
      expect(node.gridX - radius).toBeGreaterThanOrEqual(0);
      expect(node.gridX + radius).toBeLessThanOrEqual(bounds.width);
      expect(node.gridY - radius).toBeGreaterThanOrEqual(0);
      expect(node.gridY + radius).toBeLessThanOrEqual(bounds.height);
    });

    it('should overflow when sprite does not fit', () => {
      const nodes = [
        { id: 'node1', size: 3.0 }, // Boundary radius = 6 tiles
      ];
      const bounds = { width: 10, height: 10 }; // Too small

      const result = layoutSpritesInRegion(nodes, bounds);

      // Node boundary (6 tiles radius) can't fit in 10x10 region
      expect(result.placed).toHaveLength(0);
      expect(result.overflow).toHaveLength(1);
      expect(result.overflow[0].id).toBe('node1');
    });

    it('should place largest sprites first for better packing', () => {
      const nodes = [
        { id: 'small', size: 1.0 },
        { id: 'large', size: 3.0 },
        { id: 'medium', size: 2.0 },
      ];
      const bounds = { width: 50, height: 50 };

      const result = layoutSpritesInRegion(nodes, bounds);

      expect(result.placed).toHaveLength(3);

      // First placed should be largest (top-left position)
      const firstPlaced = result.placed[0];
      expect(firstPlaced.id).toBe('large');
    });

    it('should always place sprites at whole tile positions', () => {
      // This ensures boundaries always cover full squares
      const nodes = [
        { id: 'node1', size: 1.5 },
        { id: 'node2', size: 2.0 },
        { id: 'node3', size: 2.5 },
      ];
      const bounds = { width: 50, height: 50 };

      const result = layoutSpritesInRegion(nodes, bounds);

      expect(result.placed).toHaveLength(3);

      // All positions should be whole numbers
      for (const node of result.placed) {
        expect(node.gridX).toBe(Math.round(node.gridX));
        expect(node.gridY).toBe(Math.round(node.gridY));

        // Verify boundaries extend to whole tiles
        // Boundary = 4 × size tiles, centered on sprite
        const boundaryRadius = 2 * node.size;
        const minX = node.gridX - boundaryRadius;
        const maxX = node.gridX + boundaryRadius;
        const minY = node.gridY - boundaryRadius;
        const maxY = node.gridY + boundaryRadius;

        // Since sprite is at whole tile, boundary extends to whole tiles
        expect(minX).toBe(Math.round(minX));
        expect(maxX).toBe(Math.round(maxX));
        expect(minY).toBe(Math.round(minY));
        expect(maxY).toBe(Math.round(maxY));
      }
    });
  });

  describe('layoutSpritesMultiRegion', () => {
    it('should group nodes by age into separate regions', () => {
      const now = Date.now();
      const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

      const nodes = [
        // Last month
        { id: 'recent1', size: 1.5, lastEditedAt: daysAgo(15) },
        { id: 'recent2', size: 1.5, lastEditedAt: daysAgo(25) },

        // Last 3 months
        { id: 'threeMonth1', size: 1.5, lastEditedAt: daysAgo(60) },
        { id: 'threeMonth2', size: 1.5, lastEditedAt: daysAgo(80) },

        // Last year
        { id: 'year1', size: 1.5, lastEditedAt: daysAgo(200) },

        // Older
        { id: 'old1', size: 1.5, lastEditedAt: daysAgo(400) },
      ];

      const regionSize = 25;
      const result = layoutSpritesMultiRegion(nodes, regionSize);

      // Should have multiple regions for different age groups
      expect(result.length).toBeGreaterThan(1);

      // Find regions by age bucket
      const lastMonthRegions = result.filter(r => r.name === 'Last Month');
      const last3MonthsRegions = result.filter(r => r.name === 'Last 3 Months');
      const lastYearRegions = result.filter(r => r.name === 'Last Year');
      const olderRegions = result.filter(r => r.name === 'Older');

      // Should have regions for each age group that has nodes
      expect(lastMonthRegions.length).toBeGreaterThan(0);
      expect(last3MonthsRegions.length).toBeGreaterThan(0);
      expect(lastYearRegions.length).toBeGreaterThan(0);
      expect(olderRegions.length).toBeGreaterThan(0);

      // Verify nodes are in correct age groups
      const lastMonthNodes = lastMonthRegions.flatMap(r => r.nodes.map(n => n.id));
      expect(lastMonthNodes).toContain('recent1');
      expect(lastMonthNodes).toContain('recent2');

      const last3MonthsNodes = last3MonthsRegions.flatMap(r => r.nodes.map(n => n.id));
      expect(last3MonthsNodes).toContain('threeMonth1');
      expect(last3MonthsNodes).toContain('threeMonth2');
    });

    it('should create multiple regions when sprites overflow', () => {
      // Create many small sprites that will overflow one region
      const nodes = Array.from({ length: 20 }, (_, i) => ({
        id: `node${i}`,
        size: 1.5,
      }));
      const regionSize = 25;

      const result = layoutSpritesMultiRegion(nodes, regionSize);

      // Should create multiple regions
      expect(result.length).toBeGreaterThan(1);

      // All nodes should be placed somewhere
      const totalPlaced = result.reduce((sum, region) => sum + region.nodes.length, 0);
      expect(totalPlaced).toBe(20);
    });

    it('should offset node coordinates to world space', () => {
      const nodes = [
        { id: 'node1', size: 1.0 },
        { id: 'node2', size: 1.0 },
      ];
      const regionSize = 25;

      const result = layoutSpritesMultiRegion(nodes, regionSize);

      // Check that nodes are in world coordinates (not local)
      for (const region of result) {
        for (const node of region.nodes) {
          // World coordinates should be >= region bounds offset
          expect(node.gridX).toBeGreaterThanOrEqual(region.bounds.x);
          expect(node.gridY).toBeGreaterThanOrEqual(region.bounds.y);
          expect(node.gridX).toBeLessThan(region.bounds.x + region.bounds.width);
          expect(node.gridY).toBeLessThan(region.bounds.y + region.bounds.height);
        }
      }
    });

    it('should not have overlapping boundaries across all regions', () => {
      const nodes = Array.from({ length: 15 }, (_, i) => ({
        id: `node${i}`,
        size: 1.5,
      }));
      const regionSize = 25;
      const spacing = 0.5;

      const result = layoutSpritesMultiRegion(nodes, regionSize, { spacing });

      // Collect all placed nodes across regions
      const allNodes = result.flatMap(r => r.nodes);

      // Check every pair for collision
      for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
          const n1 = allNodes[i];
          const n2 = allNodes[j];

          const distance = Math.sqrt(
            Math.pow(n1.gridX - n2.gridX, 2) +
            Math.pow(n1.gridY - n2.gridY, 2)
          );

          const radius1 = 2 * n1.size;
          const radius2 = 2 * n2.size;
          const minDistance = radius1 + radius2 + spacing;

          expect(distance).toBeGreaterThanOrEqual(minDistance - 0.01); // Small epsilon for float precision
        }
      }
    });
  });
});
