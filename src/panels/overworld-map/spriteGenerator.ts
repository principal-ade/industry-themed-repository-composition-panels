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
 * Generate a simple grass background texture (for tiling)
 */
export function generateGrassBackgroundTile(): HTMLCanvasElement {
  const size = 32; // Small tile for efficient tiling
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d')!;

  // Dark grass base color
  ctx.fillStyle = '#3d5a27';
  ctx.fillRect(0, 0, size, size);

  // Add random grass blade pixels for texture
  const bladeColor = '#4a6b2f';
  const darkBladeColor = '#2f4520';

  // Random grass blades scattered across the tile
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    ctx.fillStyle = Math.random() > 0.5 ? bladeColor : darkBladeColor;
    ctx.fillRect(x, y, 1, 1);
  }

  // Add some 2-pixel vertical grass blades
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * (size - 1));
    ctx.fillStyle = bladeColor;
    ctx.fillRect(x, y, 1, 2);
  }

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
 * Generate an isometric bridge tile (wooden planks over water)
 */
export function generateBridgeTile(): HTMLCanvasElement {
  const canvas = createCanvas(ISO_TILE_WIDTH, ISO_TILE_HEIGHT);
  const ctx = canvas.getContext('2d')!;

  // Draw diamond shape in brown wood
  ctx.fillStyle = '#92400e'; // Dark brown wood
  ctx.beginPath();
  ctx.moveTo(ISO_TILE_WIDTH / 2, 0);
  ctx.lineTo(ISO_TILE_WIDTH, ISO_TILE_HEIGHT / 2);
  ctx.lineTo(ISO_TILE_WIDTH / 2, ISO_TILE_HEIGHT);
  ctx.lineTo(0, ISO_TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();

  // Add wooden plank texture with horizontal lines
  ctx.strokeStyle = '#78350f'; // Darker brown for planks
  ctx.lineWidth = 2;

  // Draw 3 horizontal planks across the diamond
  const plankY = [ISO_TILE_HEIGHT * 0.25, ISO_TILE_HEIGHT * 0.5, ISO_TILE_HEIGHT * 0.75];

  for (const y of plankY) {
    // Calculate the width of the diamond at this Y position
    const widthAtY = y <= ISO_TILE_HEIGHT / 2
      ? (y / (ISO_TILE_HEIGHT / 2)) * (ISO_TILE_WIDTH / 2)
      : ((ISO_TILE_HEIGHT - y) / (ISO_TILE_HEIGHT / 2)) * (ISO_TILE_WIDTH / 2);

    ctx.beginPath();
    ctx.moveTo(ISO_TILE_WIDTH / 2 - widthAtY, y);
    ctx.lineTo(ISO_TILE_WIDTH / 2 + widthAtY, y);
    ctx.stroke();
  }

  // Add wood grain detail
  ctx.fillStyle = '#a16207'; // Lighter brown highlight
  ctx.fillRect(ISO_TILE_WIDTH / 2 - 3, ISO_TILE_HEIGHT / 2 - 1, 6, 2);
  ctx.fillRect(ISO_TILE_WIDTH / 2 + 10, ISO_TILE_HEIGHT / 2 + 3, 4, 2);
  ctx.fillRect(ISO_TILE_WIDTH / 2 - 14, ISO_TILE_HEIGHT / 2 + 3, 4, 2);

  return canvas;
}

/**
 * Draw the isometric base diamond that buildings sit on
 */
function drawIsometricBase(
  ctx: CanvasRenderingContext2D,
  width: number,
  baseY: number,
  size: number,
  colors: { primary: string; secondary: string; accent: string }
): void {
  const tileHeight = ISO_TILE_HEIGHT * size;

  // Base platform (isometric diamond)
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.moveTo(width / 2, baseY);
  ctx.lineTo(width, baseY + tileHeight / 2);
  ctx.lineTo(width / 2, baseY + tileHeight);
  ctx.lineTo(0, baseY + tileHeight / 2);
  ctx.closePath();
  ctx.fill();
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
  const height = ISO_TILE_HEIGHT * size + 64; // Height for building above base
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  const colors = BIOME_COLORS[theme];

  // No base diamond - building only
  // Center the building in the canvas
  const buildingAnchorY = height / 2;

  // Draw building based on type
  switch (type) {
    case 'castle': {
      // Large castle with towers
      const buildingHeight = 48;
      const buildingY = buildingAnchorY - buildingHeight;

      // Main building (front face) - sits directly on the base
      ctx.fillStyle = colors.primary;
      ctx.fillRect(width / 4, buildingY, width / 2, buildingHeight);

      // Side face (darker) - proper isometric angle going UP-RIGHT
      ctx.fillStyle = colors.secondary;
      ctx.beginPath();
      ctx.moveTo(width / 2 + width / 4, buildingY);
      ctx.lineTo(width - 4, buildingY - 8);
      ctx.lineTo(width - 4, buildingY + buildingHeight - 8);
      ctx.lineTo(width / 2 + width / 4, buildingY + buildingHeight);
      ctx.closePath();
      ctx.fill();

      // Roof - isometric pyramid going UP
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(width / 4 - 4, buildingY);
      ctx.lineTo(width / 2, buildingY - 12);
      ctx.lineTo(width - 4, buildingY - 8);
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
      const buildingY = buildingAnchorY - buildingHeight;

      ctx.fillStyle = colors.primary;
      ctx.fillRect(width / 3, buildingY, width / 3, buildingHeight);

      // Side - proper isometric angle going UP-RIGHT
      ctx.fillStyle = colors.secondary;
      ctx.beginPath();
      ctx.moveTo(width / 3 + width / 3, buildingY);
      ctx.lineTo(width - 8, buildingY - 6);
      ctx.lineTo(width - 8, buildingY + buildingHeight - 6);
      ctx.lineTo(width / 3 + width / 3, buildingY + buildingHeight);
      ctx.closePath();
      ctx.fill();

      // Roof - isometric pyramid going UP
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.moveTo(width / 3 - 2, buildingY);
      ctx.lineTo(width / 2, buildingY - 8);
      ctx.lineTo(width - 8, buildingY - 6);
      ctx.lineTo(width / 3 + width / 3, buildingY);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'house': {
      // Simple house
      const buildingHeight = 24;
      const buildingY = buildingAnchorY - buildingHeight;

      ctx.fillStyle = colors.primary;
      ctx.fillRect(width / 3, buildingY, width / 3, buildingHeight);

      // Side - proper isometric angle going UP-RIGHT
      ctx.fillStyle = colors.secondary;
      ctx.beginPath();
      ctx.moveTo(width / 3 + width / 3, buildingY);
      ctx.lineTo(width - 10, buildingY - 5);
      ctx.lineTo(width - 10, buildingY + buildingHeight - 5);
      ctx.lineTo(width / 3 + width / 3, buildingY + buildingHeight);
      ctx.closePath();
      ctx.fill();

      // Roof - isometric pyramid going UP
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.moveTo(width / 3 - 3, buildingY);
      ctx.lineTo(width / 2, buildingY - 10);
      ctx.lineTo(width - 10, buildingY - 5);
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
      const pipeY = buildingAnchorY - pipeHeight;

      // Pipe body
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(width / 3, pipeY, width / 3, pipeHeight);

      // Side - proper isometric angle going UP-RIGHT
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(width / 3 + width / 3, pipeY);
      ctx.lineTo(width - 10, pipeY - 5);
      ctx.lineTo(width - 10, pipeY + pipeHeight - 5);
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

    case 'git-repo': {
      // Single package git repository - modern office building
      const buildingHeight = 36;
      const buildingY = buildingAnchorY - buildingHeight;

      // Main building body (front face) - modern glass building
      ctx.fillStyle = '#3b82f6'; // Blue glass
      ctx.fillRect(width / 4, buildingY, width / 2, buildingHeight);

      // Side face (darker) - proper isometric angle going UP-RIGHT
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(width / 2 + width / 4, buildingY);
      ctx.lineTo(width - 4, buildingY - 6);
      ctx.lineTo(width - 4, buildingY + buildingHeight - 6);
      ctx.lineTo(width / 2 + width / 4, buildingY + buildingHeight);
      ctx.closePath();
      ctx.fill();

      // Window grid (3x4 grid of windows)
      ctx.fillStyle = '#dbeafe'; // Light blue windows
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 2; col++) {
          const winX = width / 4 + 6 + col * 10;
          const winY = buildingY + 6 + row * 8;
          ctx.fillRect(winX, winY, 6, 5);
        }
      }

      // Roof - isometric pyramid
      ctx.fillStyle = '#1e40af'; // Dark blue
      ctx.beginPath();
      ctx.moveTo(width / 4 - 2, buildingY);
      ctx.lineTo(width / 2, buildingY - 8);
      ctx.lineTo(width - 4, buildingY - 6);
      ctx.lineTo(width / 2 + width / 4, buildingY);
      ctx.closePath();
      ctx.fill();

      // Git logo indicator (simple "G" or branch icon on roof)
      ctx.fillStyle = '#f97316'; // Orange accent
      ctx.fillRect(width / 2 - 3, buildingY - 10, 6, 6);
      break;
    }

    case 'monorepo': {
      // Multi-package monorepo - cluster of connected buildings
      const buildingHeight = 40;
      const buildingY = buildingAnchorY - buildingHeight;

      // Main central building (tallest)
      ctx.fillStyle = '#8b5cf6'; // Purple
      ctx.fillRect(width / 3, buildingY, width / 3, buildingHeight);

      // Side face of main building - proper isometric angle going UP-RIGHT
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.moveTo(width / 3 + width / 3, buildingY);
      ctx.lineTo(width - 4, buildingY - 6);
      ctx.lineTo(width - 4, buildingY + buildingHeight - 6);
      ctx.lineTo(width / 3 + width / 3, buildingY + buildingHeight);
      ctx.closePath();
      ctx.fill();

      // Left smaller building
      const leftHeight = 28;
      const leftY = buildingY + (buildingHeight - leftHeight);
      ctx.fillStyle = '#a78bfa';
      ctx.fillRect(width / 6, leftY, width / 6, leftHeight);

      // Left building side face - proper isometric angle going UP-RIGHT
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.moveTo(width / 6 + width / 6, leftY);
      ctx.lineTo(width / 3 + 4, leftY - 3);
      ctx.lineTo(width / 3 + 4, leftY + leftHeight - 3);
      ctx.lineTo(width / 6 + width / 6, leftY + leftHeight);
      ctx.closePath();
      ctx.fill();

      // Right smaller building
      const rightHeight = 24;
      const rightY = buildingY + (buildingHeight - rightHeight);
      const rightX = width - width / 6 - width / 6;
      ctx.fillStyle = '#a78bfa';
      ctx.fillRect(rightX, rightY, width / 6, rightHeight);

      // Right building side face - proper isometric angle going UP-RIGHT
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.moveTo(rightX + width / 6, rightY);
      ctx.lineTo(width - width / 6 + 2, rightY - 3);
      ctx.lineTo(width - width / 6 + 2, rightY + rightHeight - 3);
      ctx.lineTo(rightX + width / 6, rightY + rightHeight);
      ctx.closePath();
      ctx.fill();

      // Windows on main building
      ctx.fillStyle = '#ede9fe'; // Light purple windows
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 2; col++) {
          const winX = width / 3 + 4 + col * 8;
          const winY = buildingY + 4 + row * 7;
          ctx.fillRect(winX, winY, 5, 4);
        }
      }

      // Windows on left building
      for (let row = 0; row < 3; row++) {
        const winX = width / 6 + 3;
        const winY = leftY + 4 + row * 8;
        ctx.fillRect(winX, winY, 4, 4);
      }

      // Connecting bridges/walkways between buildings
      ctx.fillStyle = '#6d28d9';
      ctx.fillRect(width / 6 + width / 6, buildingY + 15, width / 6, 3);
      ctx.fillRect(width / 3 + width / 3, buildingY + 20, width / 6, 3);

      // Roofs - isometric pyramids for each building
      ctx.fillStyle = '#5b21b6'; // Dark purple

      // Main building roof
      ctx.beginPath();
      ctx.moveTo(width / 3 - 2, buildingY);
      ctx.lineTo(width / 2, buildingY - 10);
      ctx.lineTo(width - 4, buildingY - 6);
      ctx.lineTo(width / 3 + width / 3, buildingY);
      ctx.closePath();
      ctx.fill();

      // Left building roof
      ctx.beginPath();
      ctx.moveTo(width / 6 - 1, leftY);
      ctx.lineTo(width / 6 + width / 12, leftY - 6);
      ctx.lineTo(width / 3 + 4, leftY - 3);
      ctx.lineTo(width / 6 + width / 6, leftY);
      ctx.closePath();
      ctx.fill();

      // Right building roof
      ctx.beginPath();
      ctx.moveTo(rightX - 1, rightY);
      ctx.lineTo(rightX + width / 12, rightY - 6);
      ctx.lineTo(width - width / 6 + 2, rightY - 3);
      ctx.lineTo(rightX + width / 6, rightY);
      ctx.closePath();
      ctx.fill();

      // Monorepo indicator - multiple dots representing packages (on top of roof)
      ctx.fillStyle = '#fbbf24'; // Gold
      ctx.fillRect(width / 2 - 6, buildingY - 12, 3, 3);
      ctx.fillRect(width / 2, buildingY - 12, 3, 3);
      ctx.fillRect(width / 2 + 6, buildingY - 12, 3, 3);
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

  // Background texture
  atlas['bg-grass'] = generateGrassBackgroundTile();

  // Generate terrain tiles for each biome
  for (const biome of Object.keys(BIOME_COLORS) as BiomeTheme[]) {
    atlas[`tile-grass-${biome}`] = generateGrassTile(biome);
  }

  // Path tile
  atlas['tile-path'] = generatePathTile();

  // Bridge tile
  atlas['tile-bridge'] = generateBridgeTile();

  // Location sprites for each type and theme
  const locationTypes: LocationNodeType[] = ['castle', 'fortress', 'tower', 'house', 'pipe', 'git-repo', 'monorepo'];
  const themes: BiomeTheme[] = ['grass', 'desert', 'water', 'volcano', 'ice'];

  for (const type of locationTypes) {
    for (const theme of themes) {
      const size = type === 'castle' ? 3 : type === 'monorepo' ? 3 : 2;
      atlas[`location-${type}-${theme}`] = generateLocationSprite(type, theme, size);
    }
  }

  // Decorative sprites
  atlas['deco-cloud'] = generateDecorativeSprite('cloud');
  atlas['deco-tree'] = generateDecorativeSprite('tree');
  atlas['deco-bush'] = generateDecorativeSprite('bush');
  atlas['deco-rock'] = generateDecorativeSprite('rock');

  return atlas;
}
