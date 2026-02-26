/**
 * License Sign Sprite Generators
 * Creates pixel art sign/archway sprites to display repository names
 * with visual treatment based on license type
 *
 * Dimensions are based on the footprint formula from IsometricRenderer:
 * - footprintTiles = 4 * sizeMultiplier
 * - footprintWidth = (footprintTiles * TILE_WIDTH) / 2  (TILE_WIDTH = 64)
 * - footprintHeight = (footprintTiles * TILE_HEIGHT) / 2 (TILE_HEIGHT = 32)
 *
 * For size 1.0: tiles = 4, width = 128px (half), height = 64px (half)
 * Full diamond footprint is 256px wide × 128px tall
 */

import { Graphics, Text, Container } from 'pixi.js';
import {
  generateBuildingSprite,
  type BuildingSpriteConfig,
} from './buildingSpriteGenerator';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from '../isometricUtils';

/** Standard tile dimensions - imported from isometricUtils for consistency */
const TILE_WIDTH = ISO_TILE_WIDTH; // 64px
const TILE_HEIGHT = ISO_TILE_HEIGHT; // 32px

/**
 * Calculate footprint dimensions from size multiplier
 * Matches the formula in IsometricRenderer.ts:405-407
 *
 * @returns tiles - Total tiles across (e.g., 4 for size 1.0)
 * @returns width - Half-width in pixels (center to edge), use for positioning
 * @returns height - Half-height in pixels (center to edge), use for positioning
 *
 * Example for size 1.0:
 *   tiles = 4, width = 128px, height = 64px
 *   Full diamond is 256px wide × 128px tall
 */
export function calculateFootprint(sizeMultiplier: number): {
  tiles: number;
  width: number; // Half-width (center to edge)
  height: number; // Half-height (center to edge)
} {
  const tiles = 4 * sizeMultiplier;
  return {
    tiles,
    width: (tiles * TILE_WIDTH) / 2,
    height: (tiles * TILE_HEIGHT) / 2,
  };
}

/**
 * Color palette for license signs
 */
const COLORS = {
  // Wood colors
  woodDark: 0x5d4037,
  woodMedium: 0x795548,
  woodLight: 0x8d6e63,

  // Flower/vine colors (MIT - welcoming, open)
  flowerPink: 0xff69b4,
  flowerPinkDark: 0xdb7093,
  flowerYellow: 0xffd700,
  leafGreen: 0x228b22,
  leafGreenLight: 0x32cd32,
  vineGreen: 0x2e8b57,

  // Grass colors
  grassLight: 0x90ee90,
  grassMedium: 0x32cd32,
  grassDark: 0x228b22,
};

export interface LicenseSignConfig {
  /** Repository name to display */
  name: string;
  /** Size multiplier matching the building (1.0 - 4.0) */
  sizeMultiplier: number;
  /** Optional: override arch width (defaults to 50% of footprint width) */
  archWidth?: number;
}

/**
 * Generate a MIT license sign - wooden flower arch
 * Welcoming, open feel with climbing flowers and vines
 *
 * The arch is positioned to span the front edge of the diamond footprint,
 * with posts at 25% from the bottom corner on each side.
 *
 * @returns Container with origin at (0, 0) - caller should position at
 *          (screenX, screenY + footprint.height * 0.75) to align with diamond
 */
export function generateMITFlowerArch(config: LicenseSignConfig): Container {
  const { name, sizeMultiplier, archWidth: customArchWidth } = config;
  const container = new Container();

  // Calculate footprint-based dimensions
  const footprint = calculateFootprint(sizeMultiplier);

  // Arch width spans 25% from bottom on each side of the diamond front edge
  // That's 0.5 * footprint.width total (0.25 on each side from center)
  const archWidth = customArchWidth ?? footprint.width * 0.5;

  // Scale other dimensions proportionally
  const scale = archWidth / 80; // 80 was the original base width

  // Scaled dimensions for posts and crossbar
  const postWidth = Math.max(3, 4 * scale);
  const postHeight = Math.max(25, 35 * scale); // Taller posts
  const archHeight = postHeight + 4 * scale; // Crossbar sits on top of posts

  const graphics = new Graphics();

  // Left post (wooden)
  graphics.rect(-archWidth / 2, -postHeight, postWidth, postHeight);
  graphics.fill(COLORS.woodMedium);
  // Post highlight
  graphics.rect(-archWidth / 2, -postHeight, Math.max(1, scale), postHeight);
  graphics.fill(COLORS.woodLight);
  // Post shadow
  graphics.rect(
    -archWidth / 2 + postWidth - Math.max(1, scale),
    -postHeight,
    Math.max(1, scale),
    postHeight
  );
  graphics.fill(COLORS.woodDark);

  // Right post (wooden)
  graphics.rect(archWidth / 2 - postWidth, -postHeight, postWidth, postHeight);
  graphics.fill(COLORS.woodMedium);
  // Post highlight
  graphics.rect(
    archWidth / 2 - postWidth,
    -postHeight,
    Math.max(1, scale),
    postHeight
  );
  graphics.fill(COLORS.woodLight);
  // Post shadow
  graphics.rect(
    archWidth / 2 - Math.max(1, scale),
    -postHeight,
    Math.max(1, scale),
    postHeight
  );
  graphics.fill(COLORS.woodDark);

  // Top crossbar (wooden arch)
  const crossbarHeight = Math.max(3, 4 * scale);
  graphics.rect(-archWidth / 2, -archHeight, archWidth, crossbarHeight);
  graphics.fill(COLORS.woodMedium);
  // Crossbar highlight
  graphics.rect(-archWidth / 2, -archHeight, archWidth, Math.max(1, scale));
  graphics.fill(COLORS.woodLight);
  // Crossbar shadow
  graphics.rect(
    -archWidth / 2,
    -archHeight + crossbarHeight - Math.max(1, scale),
    archWidth,
    Math.max(1, scale)
  );
  graphics.fill(COLORS.woodDark);

  // Green flag with "MIT" text hanging from crossbar
  const flagWidth = archWidth * 0.5;
  const flagHeight = Math.max(18, 24 * scale);
  const flagTop = -postHeight + 2 * scale;

  // Flag background (light green - welcoming)
  graphics.rect(-flagWidth / 2, flagTop, flagWidth, flagHeight);
  graphics.fill(0x90ee90); // Light green
  // Flag border
  graphics.rect(-flagWidth / 2, flagTop, flagWidth, Math.max(1, scale));
  graphics.fill(0x7dcc7d);
  graphics.rect(
    -flagWidth / 2,
    flagTop + flagHeight - Math.max(1, scale),
    flagWidth,
    Math.max(1, scale)
  );
  graphics.fill(0x6bb86b);
  graphics.rect(-flagWidth / 2, flagTop, Math.max(1, scale), flagHeight);
  graphics.fill(0x7dcc7d);
  graphics.rect(
    flagWidth / 2 - Math.max(1, scale),
    flagTop,
    Math.max(1, scale),
    flagHeight
  );
  graphics.fill(0x6bb86b);

  // Climbing vines on left post (scale positions)
  const vineSize = Math.max(2, 3 * scale);
  const vinePositions = [
    { x: -archWidth / 2 - 2 * scale, y: -postHeight * 0.9 },
    { x: -archWidth / 2 - 1 * scale, y: -postHeight * 0.6 },
    { x: -archWidth / 2 + 1 * scale, y: -postHeight * 0.4 },
    { x: -archWidth / 2 - 2 * scale, y: -postHeight * 0.2 },
  ];
  for (const pos of vinePositions) {
    graphics.rect(pos.x, pos.y, vineSize, vineSize * 0.66);
    graphics.fill(COLORS.vineGreen);
  }

  // Climbing vines on right post
  const rightVinePositions = [
    { x: archWidth / 2 - 1 * scale, y: -postHeight * 0.8 },
    { x: archWidth / 2 + 1 * scale, y: -postHeight * 0.5 },
    { x: archWidth / 2 - 2 * scale, y: -postHeight * 0.3 },
    { x: archWidth / 2, y: -postHeight * 0.1 },
  ];
  for (const pos of rightVinePositions) {
    graphics.rect(pos.x, pos.y, vineSize, vineSize * 0.66);
    graphics.fill(COLORS.vineGreen);
  }

  // Flowers along the bottom of the sign (at the base)
  const flowerCount = Math.max(4, Math.floor(6 * scale));
  const flowerSpacing = archWidth / (flowerCount + 1);
  const flowerSize = Math.max(3, 4 * scale);

  for (let i = 0; i < flowerCount; i++) {
    const fx = -archWidth / 2 + flowerSpacing * (i + 1);
    const flowerColor = i % 2 === 0 ? COLORS.flowerPink : COLORS.flowerYellow;

    // Leaf behind flower
    graphics.rect(
      fx - flowerSize * 0.5,
      -flowerSize - 2 * scale,
      flowerSize * 0.5,
      flowerSize * 0.5
    );
    graphics.fill(COLORS.leafGreen);
    graphics.rect(
      fx + flowerSize * 0.25,
      -flowerSize - 1 * scale,
      flowerSize * 0.5,
      flowerSize * 0.5
    );
    graphics.fill(COLORS.leafGreenLight);

    // Flower petals (at ground level, y = 0)
    graphics.rect(fx - flowerSize * 0.5, -flowerSize, flowerSize, flowerSize);
    graphics.fill(flowerColor);
    // Flower center
    graphics.rect(
      fx - flowerSize * 0.25,
      -flowerSize * 0.75,
      flowerSize * 0.5,
      flowerSize * 0.5
    );
    graphics.fill(COLORS.flowerYellow);
  }

  // Corner flowers (larger, at base of posts)
  const cornerFlowerSize = Math.max(4, 5 * scale);

  // Left corner flower
  graphics.rect(
    -archWidth / 2 - cornerFlowerSize * 0.3,
    -cornerFlowerSize,
    cornerFlowerSize,
    cornerFlowerSize
  );
  graphics.fill(COLORS.flowerPink);
  graphics.rect(
    -archWidth / 2 - cornerFlowerSize * 0.1,
    -cornerFlowerSize * 0.8,
    cornerFlowerSize * 0.6,
    cornerFlowerSize * 0.6
  );
  graphics.fill(COLORS.flowerPinkDark);

  // Right corner flower
  graphics.rect(
    archWidth / 2 - cornerFlowerSize * 0.7,
    -cornerFlowerSize,
    cornerFlowerSize,
    cornerFlowerSize
  );
  graphics.fill(COLORS.flowerPink);
  graphics.rect(
    archWidth / 2 - cornerFlowerSize * 0.5,
    -cornerFlowerSize * 0.8,
    cornerFlowerSize * 0.6,
    cornerFlowerSize * 0.6
  );
  graphics.fill(COLORS.flowerPinkDark);

  container.addChild(graphics);

  // "MIT" text on flag
  const mitFontSize = Math.max(10, 14 * scale);
  const mitText = new Text({
    text: 'MIT',
    style: {
      fontSize: mitFontSize,
      fill: 0x228b22, // Forest green text
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    resolution: 2,
  });
  mitText.anchor.set(0.5, 0.5);
  mitText.y = flagTop + flagHeight * 0.5;
  container.addChild(mitText);

  // Add the name text on a wooden sign board
  const signBoard = new Graphics();
  const fontSize = Math.max(8, 9 * scale);
  const estimatedTextWidth = name.length * fontSize * 0.6;
  const signWidth = Math.min(
    estimatedTextWidth + 16 * scale,
    archWidth - 8 * scale
  );
  const signHeight = Math.max(8, 10 * scale);

  // Sign board background - positioned above the crossbar
  const signBoardY = -archHeight - signHeight - 2 * scale;
  signBoard.rect(-signWidth / 2, signBoardY, signWidth, signHeight);
  signBoard.fill(COLORS.woodLight);
  // Sign board border top
  signBoard.rect(-signWidth / 2, signBoardY, signWidth, Math.max(1, scale));
  signBoard.fill(COLORS.woodMedium);
  // Sign board border bottom
  signBoard.rect(
    -signWidth / 2,
    signBoardY + signHeight - Math.max(1, scale),
    signWidth,
    Math.max(1, scale)
  );
  signBoard.fill(COLORS.woodDark);

  container.addChild(signBoard);

  // Name text
  const nameText = new Text({
    text: name,
    style: {
      fontSize,
      fill: 0x3e2723, // Dark brown text
      fontFamily: 'Arial',
      fontWeight: '600',
    },
    resolution: 2,
  });
  nameText.anchor.set(0.5, 0.5);
  nameText.y = signBoardY + signHeight / 2;
  container.addChild(nameText);

  return container;
}

/**
 * Generate open grass ground treatment (for permissive licenses)
 * Returns a graphics object to render beneath the building
 * Dimensions match the building's footprint (highlight area)
 */
export function generateOpenGrassGround(sizeMultiplier: number): Graphics {
  const footprint = calculateFootprint(sizeMultiplier);
  const grass = new Graphics();

  // footprint.width/height are already half-dimensions (distance from center to edge)
  const halfW = footprint.width;
  const halfH = footprint.height;

  // Draw isometric grass patch (diamond shape matching footprint)
  grass.moveTo(0, -halfH);
  grass.lineTo(halfW, 0);
  grass.lineTo(0, halfH);
  grass.lineTo(-halfW, 0);
  grass.closePath();
  grass.fill(COLORS.grassMedium);

  // Add grass texture variation - scale count with size
  const textureCount = Math.max(6, Math.floor(8 * sizeMultiplier));
  // Use deterministic positions based on index for consistency
  for (let i = 0; i < textureCount; i++) {
    const angle = (i / textureCount) * Math.PI * 2;
    const radius = 0.3 + (i % 3) * 0.15;
    const x = Math.cos(angle) * halfW * radius;
    const y = Math.sin(angle) * halfH * radius;
    const dotSize = Math.max(1.5, 2 * sizeMultiplier);
    grass.circle(x, y, dotSize);
    grass.fill(i % 2 === 0 ? COLORS.grassLight : COLORS.grassDark);
  }

  // Small flower accents - scale with size
  const flowerSize = Math.max(1, 1.5 * sizeMultiplier);
  const flowerSpots = [
    { x: -halfW * 0.5, y: -halfH * 0.2 },
    { x: halfW * 0.4, y: halfH * 0.3 },
    { x: -halfW * 0.2, y: halfH * 0.4 },
    { x: halfW * 0.3, y: -halfH * 0.35 },
  ];
  for (const spot of flowerSpots) {
    grass.circle(spot.x, spot.y, flowerSize);
    grass.fill(COLORS.flowerPink);
  }

  return grass;
}

/**
 * Generate an Apache 2.0 license sign - two posts with shield emblem in center
 * More formal/official feel than MIT, but still welcoming
 * Features a shield emblem with a feather (Apache logo reference)
 * Same width as MIT sign (spans 25% from bottom corner on each side)
 */
export function generateApacheSign(config: LicenseSignConfig): Container {
  const { name, sizeMultiplier, archWidth: customArchWidth } = config;
  const container = new Container();

  const footprint = calculateFootprint(sizeMultiplier);
  // Same width calculation as MIT - 50% of footprint width
  const archWidth = customArchWidth ?? footprint.width * 0.5;
  const scale = archWidth / 80;

  const graphics = new Graphics();

  // Post dimensions (same style as MIT)
  const postWidth = Math.max(3, 4 * scale);
  const postHeight = Math.max(25, 35 * scale);

  // Left post
  graphics.rect(-archWidth / 2, -postHeight, postWidth, postHeight);
  graphics.fill(COLORS.woodMedium);
  graphics.rect(-archWidth / 2, -postHeight, Math.max(1, scale), postHeight);
  graphics.fill(COLORS.woodLight);
  graphics.rect(
    -archWidth / 2 + postWidth - Math.max(1, scale),
    -postHeight,
    Math.max(1, scale),
    postHeight
  );
  graphics.fill(COLORS.woodDark);

  // Right post
  graphics.rect(archWidth / 2 - postWidth, -postHeight, postWidth, postHeight);
  graphics.fill(COLORS.woodMedium);
  graphics.rect(
    archWidth / 2 - postWidth,
    -postHeight,
    Math.max(1, scale),
    postHeight
  );
  graphics.fill(COLORS.woodLight);
  graphics.rect(
    archWidth / 2 - Math.max(1, scale),
    -postHeight,
    Math.max(1, scale),
    postHeight
  );
  graphics.fill(COLORS.woodDark);

  // Top crossbar
  const crossbarHeight = Math.max(3, 4 * scale);
  graphics.rect(
    -archWidth / 2,
    -postHeight - crossbarHeight,
    archWidth,
    crossbarHeight
  );
  graphics.fill(COLORS.woodMedium);
  graphics.rect(
    -archWidth / 2,
    -postHeight - crossbarHeight,
    archWidth,
    Math.max(1, scale)
  );
  graphics.fill(COLORS.woodLight);

  // White flag hanging from crossbar
  const flagWidth = archWidth * 0.5;
  const flagHeight = Math.max(18, 24 * scale);
  const flagTop = -postHeight + 2 * scale;

  // Flag background (white)
  graphics.rect(-flagWidth / 2, flagTop, flagWidth, flagHeight);
  graphics.fill(0xffffff);
  // Flag border
  graphics.rect(-flagWidth / 2, flagTop, flagWidth, Math.max(1, scale));
  graphics.fill(0xdddddd);
  graphics.rect(
    -flagWidth / 2,
    flagTop + flagHeight - Math.max(1, scale),
    flagWidth,
    Math.max(1, scale)
  );
  graphics.fill(0xcccccc);
  graphics.rect(-flagWidth / 2, flagTop, Math.max(1, scale), flagHeight);
  graphics.fill(0xdddddd);
  graphics.rect(
    flagWidth / 2 - Math.max(1, scale),
    flagTop,
    Math.max(1, scale),
    flagHeight
  );
  graphics.fill(0xcccccc);

  // Red leaf (simplified maple/feather leaf shape)
  // Positioned lower in the flag and tilted to the right
  const leafCenterY = flagTop + flagHeight * 0.55; // Moved down
  const leafSize = Math.min(flagWidth, flagHeight) * 0.35;
  const leafColor = 0xcc0000; // Red

  // Create leaf in separate graphics so we can rotate it
  const leafGraphics = new Graphics();

  // Leaf stem (drawn at origin, will be positioned by container)
  leafGraphics.rect(-scale * 0.5, 0, scale, leafSize * 0.6);
  leafGraphics.fill(0x8b0000);

  // Main leaf body (drawn centered at origin)
  leafGraphics.beginPath();
  leafGraphics.moveTo(0, -leafSize * 0.8); // Top point
  leafGraphics.lineTo(leafSize * 0.3, -leafSize * 0.4); // Upper right
  leafGraphics.lineTo(leafSize * 0.6, -leafSize * 0.3); // Right point
  leafGraphics.lineTo(leafSize * 0.3, -leafSize * 0.1); // Mid right
  leafGraphics.lineTo(leafSize * 0.4, leafSize * 0.2); // Lower right point
  leafGraphics.lineTo(leafSize * 0.15, leafSize * 0.15); // Lower right inner
  leafGraphics.lineTo(0, leafSize * 0.4); // Bottom point
  leafGraphics.lineTo(-leafSize * 0.15, leafSize * 0.15); // Lower left inner
  leafGraphics.lineTo(-leafSize * 0.4, leafSize * 0.2); // Lower left point
  leafGraphics.lineTo(-leafSize * 0.3, -leafSize * 0.1); // Mid left
  leafGraphics.lineTo(-leafSize * 0.6, -leafSize * 0.3); // Left point
  leafGraphics.lineTo(-leafSize * 0.3, -leafSize * 0.4); // Upper left
  leafGraphics.closePath();
  leafGraphics.fill(leafColor);

  // Position and tilt the leaf
  leafGraphics.x = 0;
  leafGraphics.y = leafCenterY;
  leafGraphics.rotation = 0.3; // Tilt to the right (~17 degrees)

  graphics.addChild(leafGraphics);

  container.addChild(graphics);

  // Name text on sign board (at top, below crossbar)
  const signBoard = new Graphics();
  const fontSize = Math.max(8, 9 * scale);
  const estimatedTextWidth = name.length * fontSize * 0.6;
  const signBoardWidth = Math.min(
    estimatedTextWidth + 16 * scale,
    archWidth - 8 * scale
  );
  const signBoardHeight = Math.max(8, 10 * scale);
  const signBoardY = -postHeight - crossbarHeight + 2 * scale;

  signBoard.rect(
    -signBoardWidth / 2,
    signBoardY,
    signBoardWidth,
    signBoardHeight
  );
  signBoard.fill(COLORS.woodLight);
  signBoard.rect(
    -signBoardWidth / 2,
    signBoardY,
    signBoardWidth,
    Math.max(1, scale)
  );
  signBoard.fill(COLORS.woodMedium);
  signBoard.rect(
    -signBoardWidth / 2,
    signBoardY + signBoardHeight - Math.max(1, scale),
    signBoardWidth,
    Math.max(1, scale)
  );
  signBoard.fill(COLORS.woodDark);

  container.addChild(signBoard);

  const nameText = new Text({
    text: name,
    style: {
      fontSize,
      fill: 0x3e2723,
      fontFamily: 'Arial',
      fontWeight: '600',
    },
    resolution: 2,
  });
  nameText.anchor.set(0.5, 0.5);
  nameText.y = signBoardY + signBoardHeight / 2;
  container.addChild(nameText);

  return container;
}

/**
 * Generate a GPL license sign - iron/wrought iron arch
 * More formal and sturdy looking, represents "freedom with responsibility"
 * Features dark iron posts and a flag with GPL text
 */
export function generateGPLSign(config: LicenseSignConfig): Container {
  const { name, sizeMultiplier, archWidth: customArchWidth } = config;
  const container = new Container();

  const footprint = calculateFootprint(sizeMultiplier);
  const archWidth = customArchWidth ?? footprint.width * 0.5;
  const scale = archWidth / 80;

  const graphics = new Graphics();

  // Iron color palette
  const ironDark = 0x2a2a2a;
  const ironMedium = 0x3a3a3a;
  const ironLight = 0x4a4a4a;
  const ironHighlight = 0x5a5a5a;

  // Post dimensions
  const postWidth = Math.max(4, 5 * scale);
  const postHeight = Math.max(25, 35 * scale);

  // Left iron post
  graphics.rect(-archWidth / 2, -postHeight, postWidth, postHeight);
  graphics.fill(ironMedium);
  graphics.rect(-archWidth / 2, -postHeight, Math.max(1, scale), postHeight);
  graphics.fill(ironHighlight);
  graphics.rect(
    -archWidth / 2 + postWidth - Math.max(1, scale),
    -postHeight,
    Math.max(1, scale),
    postHeight
  );
  graphics.fill(ironDark);

  // Left post decorative cap (ball finial)
  const finialSize = postWidth * 1.2;
  graphics.circle(
    -archWidth / 2 + postWidth / 2,
    -postHeight - finialSize / 2,
    finialSize / 2
  );
  graphics.fill(ironMedium);
  graphics.circle(
    -archWidth / 2 + postWidth / 2 - finialSize * 0.15,
    -postHeight - finialSize * 0.65,
    finialSize * 0.15
  );
  graphics.fill(ironHighlight);

  // Right iron post
  graphics.rect(archWidth / 2 - postWidth, -postHeight, postWidth, postHeight);
  graphics.fill(ironMedium);
  graphics.rect(
    archWidth / 2 - postWidth,
    -postHeight,
    Math.max(1, scale),
    postHeight
  );
  graphics.fill(ironHighlight);
  graphics.rect(
    archWidth / 2 - Math.max(1, scale),
    -postHeight,
    Math.max(1, scale),
    postHeight
  );
  graphics.fill(ironDark);

  // Right post decorative cap
  graphics.circle(
    archWidth / 2 - postWidth / 2,
    -postHeight - finialSize / 2,
    finialSize / 2
  );
  graphics.fill(ironMedium);
  graphics.circle(
    archWidth / 2 - postWidth / 2 - finialSize * 0.15,
    -postHeight - finialSize * 0.65,
    finialSize * 0.15
  );
  graphics.fill(ironHighlight);

  // Top crossbar (iron)
  const crossbarHeight = Math.max(4, 5 * scale);
  graphics.rect(
    -archWidth / 2,
    -postHeight - crossbarHeight,
    archWidth,
    crossbarHeight
  );
  graphics.fill(ironMedium);
  graphics.rect(
    -archWidth / 2,
    -postHeight - crossbarHeight,
    archWidth,
    Math.max(1, scale)
  );
  graphics.fill(ironHighlight);
  graphics.rect(
    -archWidth / 2,
    -postHeight - Math.max(1, scale),
    archWidth,
    Math.max(1, scale)
  );
  graphics.fill(ironDark);

  // Decorative iron scrollwork under crossbar (simple curved lines)
  const scrollY = -postHeight + 3 * scale;
  const scrollWidth = archWidth * 0.15;
  // Left scroll
  graphics.circle(-archWidth / 4, scrollY, scrollWidth);
  graphics.stroke({ width: Math.max(2, 2 * scale), color: ironMedium });
  // Right scroll
  graphics.circle(archWidth / 4, scrollY, scrollWidth);
  graphics.stroke({ width: Math.max(2, 2 * scale), color: ironMedium });

  // Blue flag with GPL text (GNU blue)
  const flagWidth = archWidth * 0.5;
  const flagHeight = Math.max(18, 24 * scale);
  const flagTop = -postHeight + 8 * scale;

  // Flag background (blue - GNU/GPL color)
  graphics.rect(-flagWidth / 2, flagTop, flagWidth, flagHeight);
  graphics.fill(0x2255aa);
  // Flag border
  graphics.rect(-flagWidth / 2, flagTop, flagWidth, Math.max(1, scale));
  graphics.fill(0x3366bb);
  graphics.rect(
    -flagWidth / 2,
    flagTop + flagHeight - Math.max(1, scale),
    flagWidth,
    Math.max(1, scale)
  );
  graphics.fill(0x1144aa);
  graphics.rect(-flagWidth / 2, flagTop, Math.max(1, scale), flagHeight);
  graphics.fill(0x3366bb);
  graphics.rect(
    flagWidth / 2 - Math.max(1, scale),
    flagTop,
    Math.max(1, scale),
    flagHeight
  );
  graphics.fill(0x1144aa);

  container.addChild(graphics);

  // "GPL" text on flag
  const gplFontSize = Math.max(10, 14 * scale);
  const gplText = new Text({
    text: 'GPL',
    style: {
      fontSize: gplFontSize,
      fill: 0xffffff,
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
    resolution: 2,
  });
  gplText.anchor.set(0.5, 0.5);
  gplText.y = flagTop + flagHeight * 0.5;
  container.addChild(gplText);

  // Name text on sign board (at top, above crossbar)
  const signBoard = new Graphics();
  const fontSize = Math.max(8, 9 * scale);
  const estimatedTextWidth = name.length * fontSize * 0.6;
  const signBoardWidth = Math.min(
    estimatedTextWidth + 16 * scale,
    archWidth - 8 * scale
  );
  const signBoardHeight = Math.max(8, 10 * scale);
  const signBoardY = -postHeight - crossbarHeight - signBoardHeight - 2 * scale;

  signBoard.rect(
    -signBoardWidth / 2,
    signBoardY,
    signBoardWidth,
    signBoardHeight
  );
  signBoard.fill(ironLight);
  signBoard.rect(
    -signBoardWidth / 2,
    signBoardY,
    signBoardWidth,
    Math.max(1, scale)
  );
  signBoard.fill(ironHighlight);
  signBoard.rect(
    -signBoardWidth / 2,
    signBoardY + signBoardHeight - Math.max(1, scale),
    signBoardWidth,
    Math.max(1, scale)
  );
  signBoard.fill(ironDark);

  container.addChild(signBoard);

  const nameText = new Text({
    text: name,
    style: {
      fontSize,
      fill: 0xffffff,
      fontFamily: 'Arial',
      fontWeight: '600',
    },
    resolution: 2,
  });
  nameText.anchor.set(0.5, 0.5);
  nameText.y = signBoardY + signBoardHeight / 2;
  container.addChild(nameText);

  return container;
}

/**
 * Generate picket fence ground treatment (for GPL license)
 * Grass with a white picket fence around the perimeter
 * Represents "open but with clear boundaries/rules"
 */
export function generatePicketFenceGround(sizeMultiplier: number): Graphics {
  const footprint = calculateFootprint(sizeMultiplier);
  const ground = new Graphics();

  const halfW = footprint.width;
  const halfH = footprint.height;

  // Base grass
  ground.moveTo(0, -halfH);
  ground.lineTo(halfW, 0);
  ground.lineTo(0, halfH);
  ground.lineTo(-halfW, 0);
  ground.closePath();
  ground.fill(COLORS.grassMedium);

  // Grass texture
  const textureCount = Math.max(6, Math.floor(8 * sizeMultiplier));
  for (let i = 0; i < textureCount; i++) {
    const angle = (i / textureCount) * Math.PI * 2;
    const radius = 0.3 + (i % 3) * 0.1;
    const x = Math.cos(angle) * halfW * radius;
    const y = Math.sin(angle) * halfH * radius;
    const dotSize = Math.max(1.5, 2 * sizeMultiplier);
    ground.circle(x, y, dotSize);
    ground.fill(i % 2 === 0 ? COLORS.grassLight : COLORS.grassDark);
  }

  // Picket fence colors
  const fenceWhite = 0xf5f5f5;
  const fenceHighlight = 0xffffff;

  // Fence dimensions
  const picketWidth = Math.max(2, 3 * sizeMultiplier);
  const picketHeight = Math.max(8, 12 * sizeMultiplier);
  const picketSpacing = Math.max(4, 6 * sizeMultiplier);

  // Draw fence along all four edges of the diamond
  const edgeLength = Math.sqrt(halfW * halfW + halfH * halfH);
  const picketCount = Math.floor(edgeLength / picketSpacing);

  // Isometric edge slope for 2:1 ratio
  // Edge direction: for every 2 units horizontal, 1 unit vertical
  // We'll skew the picket along this slope
  const slopeRatio = 0.5; // dy/dx for the isometric edge

  // Helper to draw an isometric picket aligned with edge
  // edgeDir: -1 for edges going left (top-left, bottom-right), +1 for edges going right (top-right, bottom-left)
  const drawPicket = (px: number, py: number, edgeDir: number) => {
    // Picket "width" follows the edge direction
    // Half-width offset along the edge
    const halfW = picketWidth / 2;
    const dx = halfW * edgeDir; // Horizontal component
    const dy = halfW * slopeRatio; // Vertical component (always positive, going "down" along edge)

    // Four corners of the picket parallelogram
    // Bottom edge follows the isometric edge slope
    const bottomLeftX = px - dx;
    const bottomLeftY = py - dy;
    const bottomRightX = px + dx;
    const bottomRightY = py + dy;

    // Top edge is directly above bottom edge (vertical picket)
    const topLeftX = bottomLeftX;
    const topLeftY = bottomLeftY - picketHeight;
    const topRightX = bottomRightX;
    const topRightY = bottomRightY - picketHeight;

    // Picket body
    ground.beginPath();
    ground.moveTo(bottomLeftX, bottomLeftY);
    ground.lineTo(bottomRightX, bottomRightY);
    ground.lineTo(topRightX, topRightY);
    ground.lineTo(topLeftX, topLeftY);
    ground.closePath();
    ground.fill(fenceWhite);

    // Highlight on the "upper" edge (the one closer to viewer)
    const highlightWidth = Math.max(1, sizeMultiplier * 0.5);
    ground.beginPath();
    if (edgeDir > 0) {
      // Edge going right: highlight on left side
      ground.moveTo(bottomLeftX, bottomLeftY);
      ground.lineTo(
        bottomLeftX + highlightWidth * 0.5,
        bottomLeftY + highlightWidth * 0.25
      );
      ground.lineTo(
        topLeftX + highlightWidth * 0.5,
        topLeftY + highlightWidth * 0.25
      );
      ground.lineTo(topLeftX, topLeftY);
    } else {
      // Edge going left: highlight on right side
      ground.moveTo(bottomRightX, bottomRightY);
      ground.lineTo(
        bottomRightX - highlightWidth * 0.5,
        bottomRightY + highlightWidth * 0.25
      );
      ground.lineTo(
        topRightX - highlightWidth * 0.5,
        topRightY + highlightWidth * 0.25
      );
      ground.lineTo(topRightX, topRightY);
    }
    ground.closePath();
    ground.fill(fenceHighlight);

    // Pointed top (triangle following the edge slope)
    ground.beginPath();
    ground.moveTo(topLeftX, topLeftY);
    ground.lineTo(px, py - dy * 0 - picketHeight - picketWidth); // Peak centered above
    ground.lineTo(topRightX, topRightY);
    ground.closePath();
    ground.fill(fenceWhite);
  };

  // Top-left edge: from (0, -halfH) to (-halfW, 0)
  for (let i = 1; i < picketCount; i++) {
    const t = i / picketCount;
    const px = -halfW * t;
    const py = -halfH * (1 - t);
    drawPicket(px, py, -1);
  }

  // Top-right edge: from (0, -halfH) to (halfW, 0)
  for (let i = 1; i < picketCount; i++) {
    const t = i / picketCount;
    const px = halfW * t;
    const py = -halfH * (1 - t);
    drawPicket(px, py, 1);
  }

  // Bottom-left edge: from (-halfW, 0) to (0, halfH)
  // Only draw first 75%, leave 25% open for gate
  for (let i = 1; i < picketCount * 0.75; i++) {
    const t = i / picketCount;
    const px = -halfW * (1 - t);
    const py = halfH * t;
    drawPicket(px, py, 1);
  }

  // Bottom-right edge: from (halfW, 0) to (0, halfH)
  // Only draw first 75%, leave 25% open for gate
  for (let i = 1; i < picketCount * 0.75; i++) {
    const t = i / picketCount;
    const px = halfW * (1 - t);
    const py = halfH * t;
    drawPicket(px, py, -1);
  }

  // Corner posts (slightly larger)
  const cornerPostWidth = picketWidth * 1.5;
  const cornerPostHeight = picketHeight * 1.2;

  // Top corner
  ground.rect(
    -cornerPostWidth / 2,
    -halfH - cornerPostHeight,
    cornerPostWidth,
    cornerPostHeight
  );
  ground.fill(fenceWhite);
  // Left corner
  ground.rect(
    -halfW - cornerPostWidth / 2,
    -cornerPostHeight,
    cornerPostWidth,
    cornerPostHeight
  );
  ground.fill(fenceWhite);
  // Right corner
  ground.rect(
    halfW - cornerPostWidth / 2,
    -cornerPostHeight,
    cornerPostWidth,
    cornerPostHeight
  );
  ground.fill(fenceWhite);
  // Gate posts (at the 75% mark on each front edge, where fence ends)
  const gatePostT = 0.75;
  const gatePostLeftX = -halfW * (1 - gatePostT);
  const gatePostLeftY = halfH * gatePostT;
  const gatePostRightX = halfW * (1 - gatePostT);
  const gatePostRightY = halfH * gatePostT;

  ground.rect(
    gatePostLeftX - cornerPostWidth / 2,
    gatePostLeftY - cornerPostHeight,
    cornerPostWidth,
    cornerPostHeight
  );
  ground.fill(fenceWhite);
  ground.rect(
    gatePostRightX - cornerPostWidth / 2,
    gatePostRightY - cornerPostHeight,
    cornerPostWidth,
    cornerPostHeight
  );
  ground.fill(fenceWhite);

  return ground;
}

/**
 * Generate cobblestone path ground treatment (for Apache license)
 * Grass with a cobblestone path leading to the building - welcoming but defined
 */
export function generateCobblestoneGround(sizeMultiplier: number): Graphics {
  const footprint = calculateFootprint(sizeMultiplier);
  const ground = new Graphics();

  const halfW = footprint.width;
  const halfH = footprint.height;

  // Base grass (same as open grass)
  ground.moveTo(0, -halfH);
  ground.lineTo(halfW, 0);
  ground.lineTo(0, halfH);
  ground.lineTo(-halfW, 0);
  ground.closePath();
  ground.fill(COLORS.grassMedium);

  // Add grass texture
  const textureCount = Math.max(6, Math.floor(8 * sizeMultiplier));
  for (let i = 0; i < textureCount; i++) {
    const angle = (i / textureCount) * Math.PI * 2;
    const radius = 0.4 + (i % 3) * 0.15;
    const x = Math.cos(angle) * halfW * radius;
    const y = Math.sin(angle) * halfH * radius;
    // Skip center area where path will be
    if (Math.abs(x) > halfW * 0.15 || Math.abs(y) < halfH * 0.3) {
      const dotSize = Math.max(1.5, 2 * sizeMultiplier);
      ground.circle(x, y, dotSize);
      ground.fill(i % 2 === 0 ? COLORS.grassLight : COLORS.grassDark);
    }
  }

  // Cobblestone path from back to front (isometric)
  const stoneSize = Math.max(3, 5 * sizeMultiplier);
  const stoneColors = [0x808080, 0x909090, 0x707070, 0x888888];

  // Draw stones along the center path
  const pathSteps = Math.max(4, Math.floor(6 * sizeMultiplier));
  for (let i = 0; i < pathSteps; i++) {
    const progress = i / (pathSteps - 1); // 0 to 1
    const y = -halfH * 0.5 + progress * halfH * 1.2; // From back to front

    // Two stones side by side with slight offset
    for (let j = -1; j <= 1; j += 2) {
      const offsetX = j * stoneSize * 0.6;
      const offsetY = (i % 2) * stoneSize * 0.3;
      const color = stoneColors[(i + j + 10) % stoneColors.length];

      ground.roundRect(
        offsetX - stoneSize / 2,
        y + offsetY - stoneSize / 2,
        stoneSize,
        stoneSize * 0.7,
        stoneSize * 0.2
      );
      ground.fill(color);
    }

    // Center stone (offset row)
    if (i < pathSteps - 1) {
      const centerY = y + stoneSize * 0.5;
      const color = stoneColors[(i + 2) % stoneColors.length];
      ground.roundRect(
        -stoneSize / 2,
        centerY - stoneSize / 2,
        stoneSize,
        stoneSize * 0.7,
        stoneSize * 0.2
      );
      ground.fill(color);
    }
  }

  return ground;
}

/**
 * License type enum for future expansion
 */
export type LicenseType =
  | 'MIT'
  | 'BSD'
  | 'ISC'
  | 'Apache-2.0'
  | 'GPL-3.0'
  | 'LGPL-3.0'
  | 'MPL-2.0'
  | 'Unlicense'
  | 'Proprietary'
  | 'Unknown';

/**
 * Get the appropriate sign generator for a license type
 */
export function generateLicenseSign(
  license: LicenseType,
  config: LicenseSignConfig
): Container {
  switch (license) {
    case 'MIT':
    case 'BSD':
    case 'ISC':
    case 'Unlicense':
      return generateMITFlowerArch(config);
    case 'Apache-2.0':
      return generateApacheSign(config);
    case 'GPL-3.0':
    case 'LGPL-3.0':
      return generateGPLSign(config);
    default:
      // Fallback to MIT style until other styles are implemented
      return generateMITFlowerArch(config);
  }
}

/**
 * Get the appropriate ground treatment for a license type
 */
export function generateLicenseGround(
  license: LicenseType,
  sizeMultiplier: number
): Graphics {
  switch (license) {
    case 'MIT':
    case 'BSD':
    case 'ISC':
    case 'Unlicense':
      return generateOpenGrassGround(sizeMultiplier);
    case 'Apache-2.0':
      return generateCobblestoneGround(sizeMultiplier);
    case 'GPL-3.0':
    case 'LGPL-3.0':
      return generatePicketFenceGround(sizeMultiplier);
    default:
      return generateOpenGrassGround(sizeMultiplier);
  }
}

/**
 * Configuration for generating a complete licensed building
 */
export interface LicensedBuildingConfig {
  /** Repository name to display on sign */
  name: string;
  /** Size multiplier (1.0 - 4.0) */
  size: number;
  /** License type */
  license: LicenseType;
  /** Building color (optional) */
  color?: number;
  /** GitHub star count (optional) */
  stars?: number;
  /** Contributor count (optional) */
  collaborators?: number;
}

/**
 * Generate a complete licensed building with ground treatment and sign
 * All elements are combined into a single Container that moves together
 *
 * The container is positioned with origin at (0, 0) which corresponds to
 * the isometric grid position. The ground is centered at origin, the building
 * is positioned at origin (its natural anchor point), and the sign is at the
 * front edge of the diamond.
 *
 * @returns Container with ground, building, and sign as children
 */
export function generateLicensedBuilding(
  config: LicensedBuildingConfig
): Container {
  const { name, size, license, color, stars, collaborators } = config;

  const container = new Container();
  container.sortableChildren = true;

  const footprint = calculateFootprint(size);

  // 1. Ground treatment (at the base, behind everything)
  const ground = generateLicenseGround(license, size);
  ground.zIndex = 0;
  container.addChild(ground);

  // 2. Building sprite (centered at origin)
  const buildingConfig: BuildingSpriteConfig = {
    size,
    color,
    stars,
    collaborators,
  };
  const building = generateBuildingSprite(buildingConfig);
  building.zIndex = 1;
  container.addChild(building);

  // 3. License sign (at front edge of diamond)
  const sign = generateLicenseSign(license, {
    name,
    sizeMultiplier: size,
  });
  sign.y = footprint.height * 0.75; // Position at front of diamond
  sign.zIndex = 2;
  container.addChild(sign);

  return container;
}
