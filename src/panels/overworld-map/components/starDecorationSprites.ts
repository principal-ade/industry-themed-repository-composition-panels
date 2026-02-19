/**
 * Star Decoration Sprite Generators
 * Creates pixel art sprites for flags, trophies, and statues based on GitHub stars
 */

import { Graphics } from 'pixi.js';

/**
 * Generate a pixel art flag sprite
 */
export function generateFlagSprite(color: number): Graphics {
  const flag = new Graphics();

  // Pole (2px wide, 12px tall)
  flag.rect(0, 0, 2, 12);
  flag.fill(0x8b4513); // Brown pole

  // Flag cloth (6x4 pixels)
  flag.rect(2, 0, 6, 4);
  flag.fill(color);

  // Flag border (darker)
  flag.rect(2, 0, 6, 1);
  flag.fill(multiplyColor(color, 0.7));
  flag.rect(2, 3, 6, 1);
  flag.fill(multiplyColor(color, 0.7));

  return flag;
}

/**
 * Generate a pixel art trophy sprite
 */
export function generateTrophySprite(color: number): Graphics {
  const trophy = new Graphics();

  // Cup body (6x6 pixels)
  trophy.rect(1, 2, 6, 6);
  trophy.fill(color);

  // Handles (left and right)
  trophy.rect(0, 3, 1, 3);
  trophy.fill(color);
  trophy.rect(7, 3, 1, 3);
  trophy.fill(color);

  // Base (8x2 pixels)
  trophy.rect(0, 8, 8, 2);
  trophy.fill(multiplyColor(color, 0.8));

  // Top rim highlight
  trophy.rect(1, 2, 6, 1);
  trophy.fill(multiplyColor(color, 1.3));

  return trophy;
}

/**
 * Generate a pixel art statue sprite
 */
export function generateStatueSprite(color: number): Graphics {
  const statue = new Graphics();

  // Base pedestal (10x3 pixels)
  statue.rect(0, 12, 10, 3);
  statue.fill(0x808080); // Gray base

  // Middle pedestal (8x2 pixels)
  statue.rect(1, 10, 8, 2);
  statue.fill(0x909090);

  // Statue body (6x8 pixels)
  statue.rect(2, 2, 6, 8);
  statue.fill(color);

  // Head (4x3 pixels)
  statue.rect(3, 0, 4, 3);
  statue.fill(color);

  // Arms (small rectangles on sides)
  statue.rect(1, 4, 1, 3);
  statue.fill(color);
  statue.rect(8, 4, 1, 3);
  statue.fill(color);

  // Highlight on head (lighter)
  statue.rect(3, 0, 4, 1);
  statue.fill(multiplyColor(color, 1.3));

  return statue;
}

/**
 * Multiply a hex color by a factor (for shading)
 */
function multiplyColor(color: number, factor: number): number {
  const r = Math.min(255, Math.floor(((color >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.floor(((color >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.floor((color & 0xff) * factor));
  return (r << 16) | (g << 8) | b;
}
