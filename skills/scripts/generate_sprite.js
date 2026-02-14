#!/usr/bin/env node
/**
 * Repository Sprite Generator
 * Generates isometric 8-bit pixel art sprites for repositories
 *
 * Usage:
 *   node generate_sprite.js <metadata.json> <output.png>
 *
 * Metadata format:
 * {
 *   "repositoryName": "my-repo",
 *   "repositoryType": "git-repo", // git-repo, monorepo, castle, fortress, tower, house, pipe
 *   "theme": "grass",              // grass, desert, water, volcano, ice
 *   "size": 2,                     // 2 or 3 (determines sprite dimensions)
 *   "features": ["windows", "antenna", "flag"]  // visual features to include
 * }
 */

import { createCanvas } from 'canvas';
import fs from 'fs';

// Isometric tile constants
const ISO_TILE_WIDTH = 64;
const ISO_TILE_HEIGHT = 32;

// Color palettes for each biome theme
const BIOME_COLORS = {
  grass: { primary: '#22c55e', secondary: '#16a34a', accent: '#86efac' },
  desert: { primary: '#fbbf24', secondary: '#f59e0b', accent: '#fde68a' },
  water: { primary: '#06b6d4', secondary: '#0891b2', accent: '#67e8f9' },
  volcano: { primary: '#ef4444', secondary: '#dc2626', accent: '#fca5a5' },
  ice: { primary: '#3b82f6', secondary: '#2563eb', accent: '#dbeafe' }
};

/**
 * Draw an isometric diamond (base tile)
 */
function drawIsometricDiamond(ctx, x, y, width, height, color) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - halfHeight);          // Top
  ctx.lineTo(x + halfWidth, y);           // Right
  ctx.lineTo(x, y + halfHeight);          // Bottom
  ctx.lineTo(x - halfWidth, y);           // Left
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw an isometric box (for building blocks)
 */
function drawIsometricBox(ctx, x, y, width, depth, height, colors) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  // Top face (lightest)
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.moveTo(x, y - height);
  ctx.lineTo(x + halfWidth, y - height + halfDepth);
  ctx.lineTo(x, y - height + depth);
  ctx.lineTo(x - halfWidth, y - height + halfDepth);
  ctx.closePath();
  ctx.fill();

  // Right face (medium)
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.moveTo(x, y - height);
  ctx.lineTo(x + halfWidth, y - height + halfDepth);
  ctx.lineTo(x + halfWidth, y + halfDepth);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();

  // Left face (darkest)
  ctx.fillStyle = colors.secondary;
  ctx.beginPath();
  ctx.moveTo(x, y - height);
  ctx.lineTo(x - halfWidth, y - height + halfDepth);
  ctx.lineTo(x - halfWidth, y + halfDepth);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw windows on a building face
 */
function drawWindows(ctx, x, y, width, height, rows, cols, windowColor) {
  const windowWidth = 4;
  const windowHeight = 6;
  const spacingX = width / (cols + 1);
  const spacingY = height / (rows + 1);

  ctx.fillStyle = windowColor;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const wx = x - width / 2 + spacingX * (col + 1);
      const wy = y - height + spacingY * (row + 1);
      ctx.fillRect(wx - windowWidth / 2, wy - windowHeight / 2, windowWidth, windowHeight);
    }
  }
}

/**
 * Generate a git-repo sprite (modern office building)
 */
function generateGitRepoSprite(ctx, centerX, centerY, colors, features) {
  const buildingHeight = 36;
  const buildingWidth = 40;

  // Main building structure
  drawIsometricBox(ctx, centerX, centerY, buildingWidth, 32, buildingHeight, {
    primary: '#3b82f6',
    secondary: '#2563eb',
    accent: '#93c5fd'
  });

  // Windows
  if (features.includes('windows')) {
    drawWindows(ctx, centerX + 10, centerY, 20, buildingHeight - 8, 4, 3, '#dbeafe');
    drawWindows(ctx, centerX - 10, centerY, 20, buildingHeight - 8, 4, 3, '#bfdbfe');
  }

  // Roof accent
  ctx.fillStyle = '#f97316';
  ctx.fillRect(centerX - 20, centerY - buildingHeight - 4, 40, 4);

  // Features
  if (features.includes('antenna')) {
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - buildingHeight - 4);
    ctx.lineTo(centerX, centerY - buildingHeight - 16);
    ctx.stroke();

    // Antenna tip
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(centerX - 2, centerY - buildingHeight - 18, 4, 4);
  }
}

/**
 * Generate a monorepo sprite (cluster of connected buildings)
 */
function generateMonorepoSprite(ctx, centerX, centerY, colors, features) {
  // Main building (tallest)
  const mainHeight = 40;
  drawIsometricBox(ctx, centerX, centerY, 36, 28, mainHeight, {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#c4b5fd'
  });

  // Left building
  const leftHeight = 28;
  drawIsometricBox(ctx, centerX - 28, centerY + 8, 28, 24, leftHeight, {
    primary: '#a78bfa',
    secondary: '#8b5cf6',
    accent: '#ddd6fe'
  });

  // Right building
  const rightHeight = 24;
  drawIsometricBox(ctx, centerX + 28, centerY + 8, 24, 20, rightHeight, {
    primary: '#a78bfa',
    secondary: '#8b5cf6',
    accent: '#ddd6fe'
  });

  // Connecting bridges
  ctx.fillStyle = '#6d28d9';
  ctx.fillRect(centerX - 14, centerY - 12, 28, 4);
  ctx.fillRect(centerX + 7, centerY - 8, 21, 4);

  // Package indicators (3 dots on main roof)
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(centerX - 8, centerY - mainHeight - 2, 4, 4);
  ctx.fillRect(centerX, centerY - mainHeight - 2, 4, 4);
  ctx.fillRect(centerX + 8, centerY - mainHeight - 2, 4, 4);

  if (features.includes('windows')) {
    drawWindows(ctx, centerX + 9, centerY, 18, mainHeight - 8, 4, 2, '#ede9fe');
    drawWindows(ctx, centerX - 28 + 7, centerY + 8, 14, leftHeight - 8, 3, 2, '#ede9fe');
    drawWindows(ctx, centerX + 28 + 6, centerY + 8, 12, rightHeight - 8, 3, 2, '#ede9fe');
  }
}

/**
 * Generate a castle sprite (large fortress with towers)
 */
function generateCastleSprite(ctx, centerX, centerY, colors, features) {
  const wallHeight = 44;

  // Main walls
  drawIsometricBox(ctx, centerX, centerY, 48, 40, wallHeight, colors);

  // Towers (corners)
  const towerHeight = 52;
  const towerSize = 16;
  drawIsometricBox(ctx, centerX - 24, centerY - 12, towerSize, towerSize, towerHeight, {
    primary: colors.secondary,
    secondary: colors.secondary,
    accent: colors.primary
  });
  drawIsometricBox(ctx, centerX + 24, centerY - 12, towerSize, towerSize, towerHeight, {
    primary: colors.secondary,
    secondary: colors.secondary,
    accent: colors.primary
  });

  // Battlements (crenellations)
  ctx.fillStyle = colors.accent;
  for (let i = -20; i <= 20; i += 8) {
    ctx.fillRect(centerX + i - 3, centerY - wallHeight - 6, 6, 6);
  }

  if (features.includes('flag')) {
    // Flag pole
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - towerHeight);
    ctx.lineTo(centerX, centerY - towerHeight - 16);
    ctx.stroke();

    // Flag
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - towerHeight - 16);
    ctx.lineTo(centerX + 12, centerY - towerHeight - 12);
    ctx.lineTo(centerX, centerY - towerHeight - 8);
    ctx.fill();
  }
}

/**
 * Generate a house sprite (small building)
 */
function generateHouseSprite(ctx, centerX, centerY, colors, features) {
  const buildingHeight = 24;
  const buildingWidth = 30;

  drawIsometricBox(ctx, centerX, centerY, buildingWidth, 26, buildingHeight, colors);

  // Roof (peaked)
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - buildingHeight - 12);
  ctx.lineTo(centerX + buildingWidth / 2, centerY - buildingHeight + 2);
  ctx.lineTo(centerX, centerY - buildingHeight + 16);
  ctx.lineTo(centerX - buildingWidth / 2, centerY - buildingHeight + 2);
  ctx.closePath();
  ctx.fill();

  // Door
  ctx.fillStyle = '#78716c';
  ctx.fillRect(centerX - 4, centerY - 8, 8, 12);

  if (features.includes('windows')) {
    ctx.fillStyle = colors.accent;
    ctx.fillRect(centerX - 12, centerY - 16, 6, 6);
    ctx.fillRect(centerX + 6, centerY - 16, 6, 6);
  }
}

/**
 * Main sprite generation function
 */
function generateSprite(metadata) {
  const { repositoryType, theme, size, features = [] } = metadata;
  const colors = BIOME_COLORS[theme] || BIOME_COLORS.grass;

  // Calculate canvas size based on sprite size
  const canvasWidth = ISO_TILE_WIDTH * size;
  const canvasHeight = ISO_TILE_HEIGHT * size + 64;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // Disable anti-aliasing for pixel-perfect rendering
  ctx.imageSmoothingEnabled = false;

  // Clear background (transparent)
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Center point
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight - 32;

  // Generate based on repository type
  switch (repositoryType) {
    case 'git-repo':
      generateGitRepoSprite(ctx, centerX, centerY, colors, features);
      break;
    case 'monorepo':
      generateMonorepoSprite(ctx, centerX, centerY, colors, features);
      break;
    case 'castle':
      generateCastleSprite(ctx, centerX, centerY, colors, features);
      break;
    case 'house':
      generateHouseSprite(ctx, centerX, centerY, colors, features);
      break;
    default:
      // Default to simple building
      drawIsometricBox(ctx, centerX, centerY, 32, 28, 24, colors);
  }

  return canvas;
}

// CLI entry point
if (process.argv.length < 4) {
  console.error('Usage: node generate_sprite.js <metadata.json> <output.png>');
  process.exit(1);
}

const metadataFile = process.argv[2];
const outputFile = process.argv[3];

try {
  const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
  const canvas = generateSprite(metadata);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputFile, buffer);
  console.log(`✅ Sprite generated successfully: ${outputFile}`);
  console.log(`   Type: ${metadata.repositoryType}, Theme: ${metadata.theme}, Size: ${metadata.size}`);
} catch (error) {
  console.error('❌ Error generating sprite:', error.message);
  process.exit(1);
}
