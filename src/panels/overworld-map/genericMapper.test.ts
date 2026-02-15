/**
 * Tests for generic mapper
 * Ensures size consistency between layout and rendering
 */

import { describe, it, expect } from 'vitest';
import { nodesToUnifiedOverworldMap, type GenericNode } from './genericMapper';

describe('genericMapper', () => {
  describe('nodesToUnifiedOverworldMap', () => {
    it('should use consistent sizes for layout and rendering', () => {
      // Create nodes without explicit size (will use type-based size)
      const nodes: GenericNode[] = [
        {
          id: 'castle',
          name: 'Castle',
          isRoot: true,
          category: 'frontend',
          // No size specified - should default to 3 (castle type)
        },
        {
          id: 'house',
          name: 'House',
          category: 'library',
          importance: 30,
          // No size specified - should default to 2 (house type)
        },
      ];

      const map = nodesToUnifiedOverworldMap(nodes);

      // Check that nodes were created
      expect(map.nodes).toHaveLength(2);

      const castleNode = map.nodes.find(n => n.id === 'castle')!;
      const houseNode = map.nodes.find(n => n.id === 'house')!;

      // Castle should have size 3 (root node type)
      expect(castleNode.size).toBe(3);
      expect(castleNode.type).toBe('castle');

      // House should have size 2 (low importance)
      expect(houseNode.size).toBe(2);
      expect(houseNode.type).toBe('house');

      // Verify boundaries don't overlap
      // Castle boundary radius = 2 × 3 = 6
      // House boundary radius = 2 × 2 = 4
      // Minimum safe distance = 6 + 4 + 0.5 (spacing) = 10.5
      const distance = Math.sqrt(
        Math.pow(castleNode.gridX - houseNode.gridX, 2) +
        Math.pow(castleNode.gridY - houseNode.gridY, 2)
      );

      expect(distance).toBeGreaterThanOrEqual(10.5 - 0.01); // Small epsilon for float precision
    });

    it('should respect explicit node sizes', () => {
      const nodes: GenericNode[] = [
        {
          id: 'custom1',
          name: 'Custom 1',
          size: 2.5, // Explicit size
        },
        {
          id: 'custom2',
          name: 'Custom 2',
          size: 3.5, // Explicit size
        },
      ];

      const map = nodesToUnifiedOverworldMap(nodes);

      const node1 = map.nodes.find(n => n.id === 'custom1')!;
      const node2 = map.nodes.find(n => n.id === 'custom2')!;

      // Should use explicit sizes
      expect(node1.size).toBe(2.5);
      expect(node2.size).toBe(3.5);

      // Verify boundaries don't overlap
      // node1 radius = 5, node2 radius = 7
      // Minimum distance = 5 + 7 + 0.5 = 12.5
      const distance = Math.sqrt(
        Math.pow(node1.gridX - node2.gridX, 2) +
        Math.pow(node1.gridY - node2.gridY, 2)
      );

      expect(distance).toBeGreaterThanOrEqual(12.5 - 0.01);
    });

    it('should handle mixed explicit and implicit sizes', () => {
      const nodes: GenericNode[] = [
        {
          id: 'explicit',
          name: 'Explicit Size',
          size: 3.0, // Explicit
          importance: 90,
        },
        {
          id: 'implicit',
          name: 'Implicit Size',
          // No size - will be determined from importance (fortress = 2)
          importance: 90,
        },
      ];

      const map = nodesToUnifiedOverworldMap(nodes);

      const explicitNode = map.nodes.find(n => n.id === 'explicit')!;
      const implicitNode = map.nodes.find(n => n.id === 'implicit')!;

      expect(explicitNode.size).toBe(3.0);
      expect(implicitNode.size).toBe(2); // fortress type

      // Verify no overlap
      // explicit radius = 6, implicit radius = 4
      // Minimum distance = 6 + 4 + 0.5 = 10.5
      const distance = Math.sqrt(
        Math.pow(explicitNode.gridX - implicitNode.gridX, 2) +
        Math.pow(explicitNode.gridY - implicitNode.gridY, 2)
      );

      expect(distance).toBeGreaterThanOrEqual(10.5 - 0.01);
    });

    it('should create multiple regions when nodes overflow', () => {
      // Create many nodes that won't fit in one region
      const nodes: GenericNode[] = Array.from({ length: 25 }, (_, i) => ({
        id: `node${i}`,
        name: `Node ${i}`,
        size: 2.0,
        importance: 50,
      }));

      const map = nodesToUnifiedOverworldMap(nodes);

      // Should create multiple regions
      expect(map.regions.length).toBeGreaterThan(1);

      // All nodes should be placed
      expect(map.nodes).toHaveLength(25);

      // Verify no overlaps across all nodes
      // Note: Layout engine uses 0.5 tile grid step, so some rounding occurs
      for (let i = 0; i < map.nodes.length; i++) {
        for (let j = i + 1; j < map.nodes.length; j++) {
          const n1 = map.nodes[i];
          const n2 = map.nodes[j];

          const distance = Math.sqrt(
            Math.pow(n1.gridX - n2.gridX, 2) +
            Math.pow(n1.gridY - n2.gridY, 2)
          );

          // Boundaries should not overlap (radius = 2 × size)
          const radius1 = 2 * n1.size;
          const radius2 = 2 * n2.size;
          const minDistance = radius1 + radius2;

          // Allow small tolerance due to 0.5 tile grid quantization
          expect(distance).toBeGreaterThanOrEqual(minDistance - 0.51);
        }
      }
    });

    it('should handle empty node list', () => {
      const nodes: GenericNode[] = [];
      const map = nodesToUnifiedOverworldMap(nodes);

      expect(map.nodes).toHaveLength(0);
      expect(map.paths).toHaveLength(0);
      expect(map.regions).toHaveLength(0);
    });

    it('should create dependency paths', () => {
      const nodes: GenericNode[] = [
        {
          id: 'app',
          name: 'App',
          size: 2.0,
          dependencies: ['lib'],
        },
        {
          id: 'lib',
          name: 'Library',
          size: 1.5,
        },
      ];

      const map = nodesToUnifiedOverworldMap(nodes, {
        includeDevDependencies: false,
      });

      expect(map.nodes).toHaveLength(2);
      expect(map.paths).toHaveLength(1);

      const path = map.paths[0];
      expect(path.from).toBe('app');
      expect(path.to).toBe('lib');
      expect(path.type).toBe('dependency');
    });

    it('should place all sprites at whole-tile positions for full-square boundaries', () => {
      const nodes: GenericNode[] = [
        { id: 'node1', name: 'Node 1', size: 1.5 },
        { id: 'node2', name: 'Node 2', size: 2.0 },
        { id: 'node3', name: 'Node 3', size: 2.5 },
        { id: 'node4', name: 'Node 4', size: 3.0 },
      ];

      const map = nodesToUnifiedOverworldMap(nodes);

      expect(map.nodes).toHaveLength(4);

      // All sprites should be at whole-tile positions
      for (const node of map.nodes) {
        expect(node.gridX).toBe(Math.round(node.gridX));
        expect(node.gridY).toBe(Math.round(node.gridY));

        // Verify boundaries extend to whole tiles
        const boundaryRadius = 2 * node.size;
        const minX = node.gridX - boundaryRadius;
        const maxX = node.gridX + boundaryRadius;
        const minY = node.gridY - boundaryRadius;
        const maxY = node.gridY + boundaryRadius;

        // Boundaries should align to whole tiles
        expect(minX).toBe(Math.round(minX));
        expect(maxX).toBe(Math.round(maxX));
        expect(minY).toBe(Math.round(minY));
        expect(maxY).toBe(Math.round(maxY));
      }
    });
  });
});
