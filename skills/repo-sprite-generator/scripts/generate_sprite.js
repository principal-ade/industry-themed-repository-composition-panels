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
 * Draw a 2.5D isometric building (matching the existing sprite style)
 * This draws front face + side face + roof
 */
function drawIsometricBuilding(ctx, centerX, baseY, width, height, colors) {
  const frontWidth = width;
  const sideDepth = 12; // Fixed side depth for consistent perspective

  // Front face (main rectangle) - centered
  ctx.fillStyle = colors.primary;
  ctx.fillRect(centerX - frontWidth / 2, baseY - height, frontWidth, height);

  // Side face (right parallelogram) - going UP-RIGHT
  ctx.fillStyle = colors.secondary;
  ctx.beginPath();
  ctx.moveTo(centerX + frontWidth / 2, baseY - height);
  ctx.lineTo(centerX + frontWidth / 2 + sideDepth, baseY - height - sideDepth / 2);
  ctx.lineTo(centerX + frontWidth / 2 + sideDepth, baseY - sideDepth / 2);
  ctx.lineTo(centerX + frontWidth / 2, baseY);
  ctx.closePath();
  ctx.fill();

  // Roof edge (top accent line)
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - frontWidth / 2, baseY - height);
  ctx.lineTo(centerX + frontWidth / 2, baseY - height);
  ctx.lineTo(centerX + frontWidth / 2 + sideDepth, baseY - height - sideDepth / 2);
  ctx.stroke();
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
  const buildingWidth = 36;

  // Main building structure (blue office building)
  drawIsometricBuilding(ctx, centerX, centerY, buildingWidth, buildingHeight, {
    primary: '#3b82f6',
    secondary: '#2563eb',
    accent: '#93c5fd'
  });

  // Windows grid (3x4 windows on front face)
  if (features.includes('windows')) {
    ctx.fillStyle = '#dbeafe';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const x = centerX - 12 + col * 12;
        const y = centerY - 6 - row * 9;
        ctx.fillRect(x - 2, y, 4, 6);
      }
    }
  }

  // Roof accent (orange stripe)
  ctx.fillStyle = '#f97316';
  ctx.fillRect(centerX - buildingWidth / 2, centerY - buildingHeight - 2, buildingWidth, 3);

  // Optional antenna
  if (features.includes('antenna')) {
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - buildingHeight - 2);
    ctx.lineTo(centerX, centerY - buildingHeight - 12);
    ctx.stroke();

    // Antenna tip
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(centerX - 2, centerY - buildingHeight - 14, 4, 4);
  }
}

/**
 * Generate a monorepo sprite (cluster of connected buildings)
 */
function generateMonorepoSprite(ctx, centerX, centerY, colors, features) {
  // Main building (tallest, purple)
  const mainHeight = 40;
  const mainWidth = 32;
  drawIsometricBuilding(ctx, centerX, centerY, mainWidth, mainHeight, {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#c4b5fd'
  });

  // Left building (medium height)
  const leftHeight = 28;
  const leftWidth = 24;
  drawIsometricBuilding(ctx, centerX - 24, centerY, leftWidth, leftHeight, {
    primary: '#a78bfa',
    secondary: '#8b5cf6',
    accent: '#ddd6fe'
  });

  // Right building (shorter)
  const rightHeight = 24;
  const rightWidth = 20;
  drawIsometricBuilding(ctx, centerX + 24, centerY, rightWidth, rightHeight, {
    primary: '#a78bfa',
    secondary: '#8b5cf6',
    accent: '#ddd6fe'
  });

  // Package indicators (3 gold dots on main building roof)
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(centerX - 8, centerY - mainHeight - 4, 4, 4);
  ctx.fillRect(centerX, centerY - mainHeight - 4, 4, 4);
  ctx.fillRect(centerX + 8, centerY - mainHeight - 4, 4, 4);

  if (features.includes('windows')) {
    // Windows on main building
    ctx.fillStyle = '#ede9fe';
    for (let row = 0; row < 4; row++) {
      const y = centerY - 6 - row * 9;
      ctx.fillRect(centerX - 8, y, 4, 6);
      ctx.fillRect(centerX + 4, y, 4, 6);
    }

    // Windows on side buildings (smaller)
    for (let row = 0; row < 3; row++) {
      const y = centerY - 6 - row * 8;
      ctx.fillRect(centerX - 24 - 4, y, 3, 5);
      ctx.fillRect(centerX + 24 + 1, y, 3, 5);
    }
  }
}

/**
 * Generate a castle sprite (large fortress with towers)
 */
function generateCastleSprite(ctx, centerX, centerY, colors, features) {
  const wallHeight = 44;
  const wallWidth = 44;

  // Main walls
  drawIsometricBuilding(ctx, centerX, centerY, wallWidth, wallHeight, colors);

  // Left tower
  const towerHeight = 52;
  const towerWidth = 14;
  drawIsometricBuilding(ctx, centerX - 28, centerY, towerWidth, towerHeight, {
    primary: colors.secondary,
    secondary: colors.secondary,
    accent: colors.primary
  });

  // Right tower
  drawIsometricBuilding(ctx, centerX + 28, centerY, towerWidth, towerHeight, {
    primary: colors.secondary,
    secondary: colors.secondary,
    accent: colors.primary
  });

  // Battlements (crenellations) on main wall
  ctx.fillStyle = colors.accent;
  for (let i = -16; i <= 16; i += 8) {
    ctx.fillRect(centerX + i - 2, centerY - wallHeight - 4, 4, 4);
  }

  // Battlements on towers
  ctx.fillRect(centerX - 28 - 4, centerY - towerHeight - 4, 4, 4);
  ctx.fillRect(centerX - 28 + 4, centerY - towerHeight - 4, 4, 4);
  ctx.fillRect(centerX + 28 - 4, centerY - towerHeight - 4, 4, 4);
  ctx.fillRect(centerX + 28 + 4, centerY - towerHeight - 4, 4, 4);

  if (features.includes('flag')) {
    // Flag pole on center
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - towerHeight - 4);
    ctx.lineTo(centerX, centerY - towerHeight - 16);
    ctx.stroke();

    // Flag
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - towerHeight - 16);
    ctx.lineTo(centerX + 10, centerY - towerHeight - 12);
    ctx.lineTo(centerX, centerY - towerHeight - 8);
    ctx.fill();
  }
}

/**
 * Generate a tower sprite (tall specialized building)
 */
function generateTowerSprite(ctx, centerX, centerY, colors, features) {
  const towerHeight = 40;
  const towerWidth = 24;

  // Main tower structure (tall and narrow)
  drawIsometricBuilding(ctx, centerX, centerY, towerWidth, towerHeight, colors);

  // Multiple floor indicators (horizontal lines on front face)
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const y = centerY - (towerHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(centerX - towerWidth / 2, y);
    ctx.lineTo(centerX + towerWidth / 2, y);
    ctx.stroke();
  }

  if (features.includes('windows')) {
    // Windows on each floor (front face)
    ctx.fillStyle = '#1f2937';
    for (let floor = 0; floor < 4; floor++) {
      const y = centerY - 6 - (floor * 10);
      // Two windows per floor
      ctx.fillRect(centerX - 10, y, 4, 6);
      ctx.fillRect(centerX + 6, y, 4, 6);
    }
  }

  // Roof cap
  ctx.fillStyle = colors.accent;
  ctx.fillRect(centerX - towerWidth / 2 - 2, centerY - towerHeight - 2, towerWidth + 4, 4);

  // Optional antenna/spire
  if (features.includes('antenna') || features.includes('gears')) {
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - towerHeight - 2);
    ctx.lineTo(centerX, centerY - towerHeight - 12);
    ctx.stroke();

    // Top ornament
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(centerX - 2, centerY - towerHeight - 14, 4, 4);
  }
}

/**
 * Generate a house sprite (small building)
 */
function generateHouseSprite(ctx, centerX, centerY, colors, features) {
  const buildingHeight = 24;
  const buildingWidth = 28;

  // Main house structure
  drawIsometricBuilding(ctx, centerX, centerY, buildingWidth, buildingHeight, colors);

  // Peaked roof (triangle on top)
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - buildingHeight - 10);
  ctx.lineTo(centerX + buildingWidth / 2 + 4, centerY - buildingHeight);
  ctx.lineTo(centerX - buildingWidth / 2 - 4, centerY - buildingHeight);
  ctx.closePath();
  ctx.fill();

  // Roof side face
  ctx.fillStyle = colors.secondary;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - buildingHeight - 10);
  ctx.lineTo(centerX + buildingWidth / 2 + 4, centerY - buildingHeight);
  ctx.lineTo(centerX + buildingWidth / 2 + 16, centerY - buildingHeight - 6);
  ctx.closePath();
  ctx.fill();

  // Door
  ctx.fillStyle = '#78716c';
  ctx.fillRect(centerX - 4, centerY - 10, 8, 10);

  if (features.includes('windows')) {
    // Two windows on front
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(centerX - 12, centerY - 16, 5, 6);
    ctx.fillRect(centerX + 7, centerY - 16, 5, 6);
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
    case 'tower':
      generateTowerSprite(ctx, centerX, centerY, colors, features);
      break;
    case 'house':
      generateHouseSprite(ctx, centerX, centerY, colors, features);
      break;
    case 'fortress':
      // Fortress is similar to castle but shorter and boxier
      drawIsometricBox(ctx, centerX, centerY, 40, 36, 32, colors);
      // Add battlement-like details
      ctx.fillStyle = colors.accent;
      for (let i = -16; i <= 16; i += 8) {
        ctx.fillRect(centerX + i - 3, centerY - 32 - 6, 6, 6);
      }
      break;
    case 'pipe':
      // Simple pipe (Mario-style warp pipe)
      const pipeRadius = 12;
      const pipeHeight = 20;
      // Green pipe body
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(centerX - pipeRadius, centerY - pipeHeight, pipeRadius * 2, pipeHeight);
      // Pipe rim (top)
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(centerX - pipeRadius - 2, centerY - pipeHeight - 4, pipeRadius * 2 + 4, 4);
      // Pipe opening (dark)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - pipeHeight, pipeRadius, 6, 0, 0, Math.PI * 2);
      ctx.fill();
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
