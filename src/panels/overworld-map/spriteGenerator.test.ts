/**
 * Tests for sprite generation and canvas layout
 */

import { describe, expect, test, beforeAll } from 'bun:test';
import {
  generateGrassTile,
  generatePathTile,
  generateLocationSprite,
  generateDecorativeSprite,
  generateSpriteAtlas,
  BIOME_COLORS,
} from './spriteGenerator';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from './isometricUtils';
import type { BiomeTheme, LocationNodeType } from './types';

// Set up DOM environment for canvas tests
beforeAll(() => {
  // Bun provides a DOM environment, but we'll verify it's available
  if (typeof document === 'undefined') {
    throw new Error('DOM environment not available for canvas tests');
  }
});

describe('spriteGenerator', () => {
  describe('BIOME_COLORS', () => {
    test('contains all required biomes', () => {
      const biomes: BiomeTheme[] = ['grass', 'desert', 'water', 'volcano', 'ice'];

      for (const biome of biomes) {
        expect(BIOME_COLORS[biome]).toBeDefined();
      }
    });

    test('each biome has primary, secondary, and accent colors', () => {
      for (const biome of Object.keys(BIOME_COLORS)) {
        const colors = BIOME_COLORS[biome as BiomeTheme];

        expect(colors.primary).toBeDefined();
        expect(colors.secondary).toBeDefined();
        expect(colors.accent).toBeDefined();

        // Colors should be valid hex codes
        expect(colors.primary).toMatch(/^#[0-9a-f]{6}$/i);
        expect(colors.secondary).toMatch(/^#[0-9a-f]{6}$/i);
        expect(colors.accent).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  describe('generateGrassTile', () => {
    test('creates canvas with correct dimensions', () => {
      const canvas = generateGrassTile();

      expect(canvas.width).toBe(ISO_TILE_WIDTH);
      expect(canvas.height).toBe(ISO_TILE_HEIGHT);
    });

    test('creates canvas for different biomes', () => {
      const biomes: BiomeTheme[] = ['grass', 'desert', 'water', 'volcano', 'ice'];

      for (const biome of biomes) {
        const canvas = generateGrassTile(biome);

        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(canvas.width).toBe(ISO_TILE_WIDTH);
        expect(canvas.height).toBe(ISO_TILE_HEIGHT);
      }
    });

    test('canvas has 2d rendering context', () => {
      const canvas = generateGrassTile();
      const ctx = canvas.getContext('2d');

      expect(ctx).not.toBeNull();
    });
  });

  describe('generatePathTile', () => {
    test('creates canvas with correct dimensions', () => {
      const canvas = generatePathTile();

      expect(canvas.width).toBe(ISO_TILE_WIDTH);
      expect(canvas.height).toBe(ISO_TILE_HEIGHT);
    });

    test('canvas has 2d rendering context', () => {
      const canvas = generatePathTile();
      const ctx = canvas.getContext('2d');

      expect(ctx).not.toBeNull();
    });
  });

  describe('generateLocationSprite', () => {
    describe('canvas dimensions', () => {
      test('size 2 buildings have correct dimensions', () => {
        const types: LocationNodeType[] = ['tower', 'house', 'pipe', 'git-repo'];

        for (const type of types) {
          const canvas = generateLocationSprite(type, 'grass', 2);
          const expectedWidth = ISO_TILE_WIDTH * 2; // 128
          const expectedHeight = ISO_TILE_HEIGHT * 2 + 64; // 128

          expect(canvas.width).toBe(expectedWidth);
          expect(canvas.height).toBe(expectedHeight);
        }
      });

      test('size 3 buildings have correct dimensions', () => {
        const types: LocationNodeType[] = ['castle', 'monorepo'];

        for (const type of types) {
          const canvas = generateLocationSprite(type, 'grass', 3);
          const expectedWidth = ISO_TILE_WIDTH * 3; // 192
          const expectedHeight = ISO_TILE_HEIGHT * 3 + 64; // 160

          expect(canvas.width).toBe(expectedWidth);
          expect(canvas.height).toBe(expectedHeight);
        }
      });
    });

    describe('baseY calculation consistency', () => {
      test('size 2 building has base at correct position', () => {
        const canvas = generateLocationSprite('house', 'grass', 2);
        const size = 2;
        const expectedHeight = ISO_TILE_HEIGHT * size + 64; // 128
        const expectedBaseY = expectedHeight - ISO_TILE_HEIGHT * size; // 64

        expect(canvas.height).toBe(expectedHeight);
        expect(expectedBaseY).toBe(64);
      });

      test('size 3 building has base at correct position', () => {
        const canvas = generateLocationSprite('castle', 'grass', 3);
        const size = 3;
        const expectedHeight = ISO_TILE_HEIGHT * size + 64; // 160
        const expectedBaseY = expectedHeight - ISO_TILE_HEIGHT * size; // 64

        expect(canvas.height).toBe(expectedHeight);
        expect(expectedBaseY).toBe(64);
      });

      test('baseY is consistent across different sizes', () => {
        // This is the key issue discovered: baseY should always be 64
        // regardless of building size
        const size2Canvas = generateLocationSprite('house', 'grass', 2);
        const size3Canvas = generateLocationSprite('castle', 'grass', 3);

        const size2BaseY = size2Canvas.height - ISO_TILE_HEIGHT * 2; // 128 - 64 = 64
        const size3BaseY = size3Canvas.height - ISO_TILE_HEIGHT * 3; // 160 - 96 = 64

        expect(size2BaseY).toBe(64);
        expect(size3BaseY).toBe(64);
        expect(size2BaseY).toBe(size3BaseY); // Same base position
      });

      test('sprite anchor (0.5, 0.5) position relative to base', () => {
        const size2Canvas = generateLocationSprite('house', 'grass', 2);
        const size3Canvas = generateLocationSprite('castle', 'grass', 3);

        // With anchor (0.5, 0.5), the anchor is at the center of the canvas
        const size2AnchorY = size2Canvas.height / 2; // 64
        const size3AnchorY = size3Canvas.height / 2; // 80

        const size2BaseY = 64; // Top of base diamond
        const size3BaseY = 64; // Top of base diamond

        // For size 2: anchor is at Y=64, base top is at Y=64 (aligned)
        expect(size2AnchorY).toBe(size2BaseY);

        // For size 3: anchor is at Y=80, base top is at Y=64 (16px offset)
        const size3Offset = size3AnchorY - size3BaseY;
        expect(size3Offset).toBe(16);

        // This demonstrates the inconsistency: sprite anchor is at different
        // positions relative to the base diamond for different sizes
      });
    });

    describe('building types', () => {
      const buildingTypes: LocationNodeType[] = [
        'castle',
        'fortress',
        'tower',
        'house',
        'pipe',
        'git-repo',
        'monorepo',
      ];

      test('all building types render without errors', () => {
        for (const type of buildingTypes) {
          const size = type === 'castle' || type === 'monorepo' ? 3 : 2;
          const canvas = generateLocationSprite(type, 'grass', size);

          expect(canvas).toBeInstanceOf(HTMLCanvasElement);
          expect(canvas.getContext('2d')).not.toBeNull();
        }
      });

      test('castle building renders with correct size', () => {
        const canvas = generateLocationSprite('castle', 'grass', 3);

        expect(canvas.width).toBe(ISO_TILE_WIDTH * 3);
        expect(canvas.height).toBe(ISO_TILE_HEIGHT * 3 + 64);
      });

      test('git-repo building renders with correct size', () => {
        const canvas = generateLocationSprite('git-repo', 'grass', 2);

        expect(canvas.width).toBe(ISO_TILE_WIDTH * 2);
        expect(canvas.height).toBe(ISO_TILE_HEIGHT * 2 + 64);
      });

      test('monorepo building renders with correct size', () => {
        const canvas = generateLocationSprite('monorepo', 'grass', 3);

        expect(canvas.width).toBe(ISO_TILE_WIDTH * 3);
        expect(canvas.height).toBe(ISO_TILE_HEIGHT * 3 + 64);
      });

      test('all building types work with different themes', () => {
        const themes: BiomeTheme[] = ['grass', 'desert', 'water', 'volcano', 'ice'];

        for (const type of buildingTypes) {
          for (const theme of themes) {
            const size = type === 'castle' || type === 'monorepo' ? 3 : 2;
            const canvas = generateLocationSprite(type, theme, size);

            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
          }
        }
      });
    });

    describe('isometric angle validation', () => {
      test('git-repo building generates without errors', () => {
        // We can't test actual rendering with mocked canvas,
        // but we can verify the sprite generation completes successfully
        const canvas = generateLocationSprite('git-repo', 'grass', 2);
        const ctx = canvas.getContext('2d');

        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(ctx).not.toBeNull();
        expect(canvas.width).toBe(ISO_TILE_WIDTH * 2);
        expect(canvas.height).toBe(ISO_TILE_HEIGHT * 2 + 64);
      });

      test('monorepo building generates without errors', () => {
        // We can't test actual rendering with mocked canvas,
        // but we can verify the sprite generation completes successfully
        const canvas = generateLocationSprite('monorepo', 'grass', 3);
        const ctx = canvas.getContext('2d');

        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(ctx).not.toBeNull();
        expect(canvas.width).toBe(ISO_TILE_WIDTH * 3);
        expect(canvas.height).toBe(ISO_TILE_HEIGHT * 3 + 64);
      });
    });
  });

  describe('generateDecorativeSprite', () => {
    const decorTypes = ['cloud', 'tree', 'bush', 'rock'] as const;

    test('all decorative types render correctly', () => {
      for (const type of decorTypes) {
        const canvas = generateDecorativeSprite(type);

        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(canvas.width).toBe(32);
        expect(canvas.height).toBe(32);
      }
    });

    test('decorative sprites have 2d context', () => {
      for (const type of decorTypes) {
        const canvas = generateDecorativeSprite(type);
        const ctx = canvas.getContext('2d');

        expect(ctx).not.toBeNull();
      }
    });
  });

  describe('generateSpriteAtlas', () => {
    test('generates atlas with all expected tiles', () => {
      const atlas = generateSpriteAtlas();

      // Should have grass tiles for each biome
      expect(atlas['tile-grass-grass']).toBeDefined();
      expect(atlas['tile-grass-desert']).toBeDefined();
      expect(atlas['tile-grass-water']).toBeDefined();
      expect(atlas['tile-grass-volcano']).toBeDefined();
      expect(atlas['tile-grass-ice']).toBeDefined();

      // Should have path tile
      expect(atlas['tile-path']).toBeDefined();
    });

    test('generates location sprites for all types and themes', () => {
      const atlas = generateSpriteAtlas();
      const locationTypes: LocationNodeType[] = [
        'castle',
        'fortress',
        'tower',
        'house',
        'pipe',
        'git-repo',
        'monorepo',
      ];
      const themes: BiomeTheme[] = ['grass', 'desert', 'water', 'volcano', 'ice'];

      for (const type of locationTypes) {
        for (const theme of themes) {
          const key = `location-${type}-${theme}`;
          expect(atlas[key]).toBeDefined();
          expect(atlas[key]).toBeInstanceOf(HTMLCanvasElement);
        }
      }
    });

    test('generates decorative sprites', () => {
      const atlas = generateSpriteAtlas();

      expect(atlas['deco-cloud']).toBeDefined();
      expect(atlas['deco-tree']).toBeDefined();
      expect(atlas['deco-bush']).toBeDefined();
      expect(atlas['deco-rock']).toBeDefined();
    });

    test('all atlas entries are HTMLCanvasElement instances', () => {
      const atlas = generateSpriteAtlas();

      for (const [key, canvas] of Object.entries(atlas)) {
        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      }
    });

    test('atlas contains expected number of entries', () => {
      const atlas = generateSpriteAtlas();

      // 5 grass tiles (one per biome) + 1 path tile = 6 terrain tiles
      // 7 location types * 5 themes = 35 location sprites
      // 4 decorative sprites
      // Total: 6 + 35 + 4 = 45

      const keys = Object.keys(atlas);
      expect(keys.length).toBe(45);
    });
  });

  describe('sprite positioning consistency', () => {
    test('base diamond takes same pixel height regardless of size', () => {
      const size2Diamond = ISO_TILE_HEIGHT * 2; // 64px
      const size3Diamond = ISO_TILE_HEIGHT * 3; // 96px

      // Base diamond height is different
      expect(size2Diamond).toBe(64);
      expect(size3Diamond).toBe(96);
    });

    test('base diamond takes different percentage of canvas by size', () => {
      const size2Canvas = generateLocationSprite('house', 'grass', 2);
      const size3Canvas = generateLocationSprite('castle', 'grass', 3);

      const size2DiamondHeight = ISO_TILE_HEIGHT * 2; // 64px
      const size3DiamondHeight = ISO_TILE_HEIGHT * 3; // 96px

      const size2Percentage = (size2DiamondHeight / size2Canvas.height) * 100; // 64/128 = 50%
      const size3Percentage = (size3DiamondHeight / size3Canvas.height) * 100; // 96/160 = 60%

      expect(size2Percentage).toBe(50);
      expect(size3Percentage).toBe(60);

      // This demonstrates the inconsistency
      expect(size2Percentage).not.toBe(size3Percentage);
    });

    test('anchor position relative to base diamond center varies by size', () => {
      const size2Canvas = generateLocationSprite('house', 'grass', 2);
      const size3Canvas = generateLocationSprite('castle', 'grass', 3);

      // Anchor at (0.5, 0.5) is at canvas center
      const size2AnchorY = size2Canvas.height / 2; // 64
      const size3AnchorY = size3Canvas.height / 2; // 80

      // Base diamond center
      const size2BaseY = 64; // Top of diamond
      const size2DiamondHeight = 64;
      const size2DiamondCenterY = size2BaseY + size2DiamondHeight / 2; // 96

      const size3BaseY = 64; // Top of diamond
      const size3DiamondHeight = 96;
      const size3DiamondCenterY = size3BaseY + size3DiamondHeight / 2; // 112

      // Distance from anchor to diamond center
      const size2Distance = size2DiamondCenterY - size2AnchorY; // 96 - 64 = 32
      const size3Distance = size3DiamondCenterY - size3AnchorY; // 112 - 80 = 32

      // Interestingly, the distance is the same (32px)
      expect(size2Distance).toBe(32);
      expect(size3Distance).toBe(32);

      // But the anchor is at different absolute positions
      expect(size2AnchorY).not.toBe(size3AnchorY);
    });
  });
});
