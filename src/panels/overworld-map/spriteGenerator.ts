/**
 * Procedural pixel art sprite generator for placeholder graphics
 * Creates simple isometric tiles and buildings using Canvas API
 */

import {
  TILE_SIZE,
  ISO_TILE_WIDTH,
  ISO_TILE_HEIGHT,
} from './isometricUtils';
import type { BiomeTheme, LocationNodeType, TileType } from './types';

/**
 * Color palettes for different biomes (NES-style limited colors)
 */
export const BIOME_COLORS: Record<BiomeTheme, { primary: string; secondary: string; accent: string }> = {
  grass: {
    primary: '#22c55e',   // Green
    secondary: '#16a34a', // Dark green
    accent: '#86efac',    // Light green
  },
  desert: {
    primary: '#fbbf24',   // Yellow
    secondary: '#f59e0b', // Orange
    accent: '#fde68a',    // Light yellow
  },
  water: {
    primary: '#06b6d4',   // Cyan
    secondary: '#0891b2', // Dark cyan
    accent: '#67e8f9',    // Light cyan
  },
  volcano: {
    primary: '#ef4444',   // Red
    secondary: '#dc2626', // Dark red
    accent: '#fca5a5',    // Light red
  },
  ice: {
    primary: '#3b82f6',   // Blue
    secondary: '#2563eb', // Dark blue
    accent: '#dbeafe',    // Light blue
  },
};

/**
 * Create a canvas element with specified dimensions
 */
function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Generate an isometric grass tile
 */
export function generateGrassTile(theme: BiomeTheme = 'grass'): HTMLCanvasElement {
  const canvas = createCanvas(ISO_TILE_WIDTH, ISO_TILE_HEIGHT);
  const ctx = canvas.getContext('2d')!;
  const colors = BIOME_COLORS[theme];

  // Draw isometric diamond shape
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.moveTo(ISO_TILE_WIDTH / 2, 0); // Top
  ctx.lineTo(ISO_TILE_WIDTH, ISO_TILE_HEIGHT / 2); // Right
  ctx.lineTo(ISO_TILE_WIDTH / 2, ISO_TILE_HEIGHT); // Bottom
  ctx.lineTo(0, ISO_TILE_HEIGHT / 2); // Left
  ctx.closePath();
  ctx.fill();

  // Add some texture/detail
  ctx.fillStyle = colors.secondary;
  ctx.fillRect(ISO_TILE_WIDTH / 2 - 2, ISO_TILE_HEIGHT / 2 - 2, 4, 4);
  ctx.fillRect(ISO_TILE_WIDTH / 2 + 8, ISO_TILE_HEIGHT / 2 + 4, 3, 3);
  ctx.fillRect(ISO_TILE_WIDTH / 2 - 10, ISO_TILE_HEIGHT / 2 + 2, 3, 3);

  return canvas;
}

/**
 * Generate an isometric path tile
 */
export function generatePathTile(): HTMLCanvasElement {
  const canvas = createCanvas(ISO_TILE_WIDTH, ISO_TILE_HEIGHT);
  const ctx = canvas.getContext('2d')!;

  // Draw diamond shape in brown/gray
  ctx.fillStyle = '#a8a29e'; // Gray stone
  ctx.beginPath();
  ctx.moveTo(ISO_TILE_WIDTH / 2, 0);
  ctx.lineTo(ISO_TILE_WIDTH, ISO_TILE_HEIGHT / 2);
  ctx.lineTo(ISO_TILE_WIDTH / 2, ISO_TILE_HEIGHT);
  ctx.lineTo(0, ISO_TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();

  // Add stone texture
  ctx.fillStyle = '#78716c';
  ctx.fillRect(ISO_TILE_WIDTH / 2 - 4, 4, 8, 4);
  ctx.fillRect(ISO_TILE_WIDTH / 2 + 6, ISO_TILE_HEIGHT / 2, 6, 3);
  ctx.fillRect(ISO_TILE_WIDTH / 2 - 12, ISO_TILE_HEIGHT / 2 + 4, 6, 3);

  return canvas;
}

/**
 * Generate a simple isometric building/location sprite
 */
export function generateLocationSprite(
  type: LocationNodeType,
  theme: BiomeTheme,
  size: number = 2
): HTMLCanvasElement {
  const width = ISO_TILE_WIDTH * size;
  const height = ISO_TILE_HEIGHT * size + 32; // Extra height for building
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  const colors = BIOME_COLORS[theme];

  // Base position
  const baseY = height - ISO_TILE_HEIGHT * size;

  // Draw base platform (isometric diamond)
  ctx.fillStyle = colors.secondary;
  ctx.beginPath();
  ctx.moveTo(width / 2, baseY);
  ctx.lineTo(width, baseY + ISO_TILE_HEIGHT * size / 2);
  ctx.lineTo(width / 2, baseY + ISO_TILE_HEIGHT * size);
  ctx.lineTo(0, baseY + ISO_TILE_HEIGHT * size / 2);
  ctx.closePath();
  ctx.fill();

  // Draw building based on type
  switch (type) {
    case 'castle': {
      // Large castle with towers
      const buildingHeight = 48;
      const buildingY = baseY - buildingHeight;

      // Main building (front face)
      ctx.fillStyle = colors.primary;
      ctx.fillRect(width / 4, buildingY, width / 2, buildingHeight);

      // Side face (darker)
      ctx.fillStyle = colors.secondary;
      ctx.beginPath();
      ctx.moveTo(width / 2 + width / 4, buildingY);
      ctx.lineTo(width - 4, buildingY + 12);
      ctx.lineTo(width - 4, buildingY + buildingHeight + 12);
      ctx.lineTo(width / 2 + width / 4, buildingY + buildingHeight);
      ctx.closePath();
      ctx.fill();

      // Roof
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(width / 4 - 4, buildingY);
      ctx.lineTo(width / 2, buildingY - 12);
      ctx.lineTo(width - 4, buildingY + 12);
      ctx.lineTo(width / 2 + width / 4, buildingY);
      ctx.closePath();
      ctx.fill();

      // Windows
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(width / 2 - 8, buildingY + 16, 6, 8);
      ctx.fillRect(width / 2 + 2, buildingY + 16, 6, 8);
      break;
    }

    case 'fortress':
    case 'tower': {
      // Tower/fortress
      const buildingHeight = 32;
      const buildingY = baseY - buildingHeight;

      ctx.fillStyle = colors.primary;
      ctx.fillRect(width / 3, buildingY, width / 3, buildingHeight);

      // Side
      ctx.fillStyle = colors.secondary;
      ctx.beginPath();
      ctx.moveTo(width / 3 + width / 3, buildingY);
      ctx.lineTo(width - 8, buildingY + 8);
      ctx.lineTo(width - 8, buildingY + buildingHeight + 8);
      ctx.lineTo(width / 3 + width / 3, buildingY + buildingHeight);
      ctx.closePath();
      ctx.fill();

      // Roof
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.moveTo(width / 3 - 2, buildingY);
      ctx.lineTo(width / 2, buildingY - 8);
      ctx.lineTo(width - 8, buildingY + 8);
      ctx.lineTo(width / 3 + width / 3, buildingY);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'house': {
      // Simple house
      const buildingHeight = 24;
      const buildingY = baseY - buildingHeight;

      ctx.fillStyle = colors.primary;
      ctx.fillRect(width / 3, buildingY, width / 3, buildingHeight);

      // Side
      ctx.fillStyle = colors.secondary;
      ctx.beginPath();
      ctx.moveTo(width / 3 + width / 3, buildingY);
      ctx.lineTo(width - 10, buildingY + 6);
      ctx.lineTo(width - 10, buildingY + buildingHeight + 6);
      ctx.lineTo(width / 3 + width / 3, buildingY + buildingHeight);
      ctx.closePath();
      ctx.fill();

      // Roof
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.moveTo(width / 3 - 3, buildingY);
      ctx.lineTo(width / 2, buildingY - 10);
      ctx.lineTo(width - 10, buildingY + 6);
      ctx.lineTo(width / 3 + width / 3, buildingY);
      ctx.closePath();
      ctx.fill();

      // Door
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(width / 2 - 4, buildingY + buildingHeight - 10, 8, 10);
      break;
    }

    case 'pipe': {
      // Warp pipe (Mario style!)
      const pipeHeight = 28;
      const pipeY = baseY - pipeHeight;

      // Pipe body
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(width / 3, pipeY, width / 3, pipeHeight);

      // Side
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(width / 3 + width / 3, pipeY);
      ctx.lineTo(width - 10, pipeY + 6);
      ctx.lineTo(width - 10, pipeY + pipeHeight + 6);
      ctx.lineTo(width / 3 + width / 3, pipeY + pipeHeight);
      ctx.closePath();
      ctx.fill();

      // Pipe top (ellipse)
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(width / 2, pipeY + 4, width / 6, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner shadow
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(width / 2, pipeY + 4, width / 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  return canvas;
}

/**
 * Generate a decorative sprite (cloud, tree, etc.)
 */
export function generateDecorativeSprite(type: 'cloud' | 'tree' | 'bush' | 'rock'): HTMLCanvasElement {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d')!;

  switch (type) {
    case 'cloud':
      // Simple white cloud
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 12, 16, 8);
      ctx.fillRect(12, 8, 8, 12);
      ctx.fillRect(4, 14, 24, 4);
      break;

    case 'tree':
      // Simple tree
      ctx.fillStyle = '#7c2d12'; // Brown trunk
      ctx.fillRect(14, 18, 4, 10);
      ctx.fillStyle = '#22c55e'; // Green foliage
      ctx.fillRect(10, 10, 12, 12);
      ctx.fillRect(12, 8, 8, 4);
      break;

    case 'bush':
      // Simple bush
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(8, 18, 16, 10);
      ctx.fillRect(10, 16, 12, 4);
      break;

    case 'rock':
      // Simple rock
      ctx.fillStyle = '#78716c';
      ctx.fillRect(10, 20, 12, 8);
      ctx.fillRect(12, 18, 8, 4);
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(12, 20, 4, 4);
      break;
  }

  return canvas;
}

/**
 * Generate a complete sprite atlas from all tile types
 * Returns a texture map for PixiJS
 */
export function generateSpriteAtlas(): Record<string, HTMLCanvasElement> {
  const atlas: Record<string, HTMLCanvasElement> = {};

  // Generate terrain tiles for each biome
  for (const biome of Object.keys(BIOME_COLORS) as BiomeTheme[]) {
    atlas[`tile-grass-${biome}`] = generateGrassTile(biome);
  }

  // Path tile
  atlas['tile-path'] = generatePathTile();

  // Location sprites for each type and theme
  const locationTypes: LocationNodeType[] = ['castle', 'fortress', 'tower', 'house', 'pipe'];
  const themes: BiomeTheme[] = ['grass', 'desert', 'water', 'volcano', 'ice'];

  for (const type of locationTypes) {
    for (const theme of themes) {
      atlas[`location-${type}-${theme}`] = generateLocationSprite(type, theme, type === 'castle' ? 3 : 2);
    }
  }

  // Decorative sprites
  atlas['deco-cloud'] = generateDecorativeSprite('cloud');
  atlas['deco-tree'] = generateDecorativeSprite('tree');
  atlas['deco-bush'] = generateDecorativeSprite('bush');
  atlas['deco-rock'] = generateDecorativeSprite('rock');

  return atlas;
}
