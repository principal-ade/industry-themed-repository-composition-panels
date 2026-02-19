/**
 * Collaborator Decoration Sprites
 * Pixel art generators for community space decorations
 */

import { Graphics } from 'pixi.js';

/**
 * Generate a simple bench sprite (1-10 collaborators)
 */
export function generateBenchSprite(color: number): Graphics {
  const bench = new Graphics();

  // Bench legs (dark brown)
  bench.rect(1, 6, 1, 3);
  bench.fill(0x654321);
  bench.rect(6, 6, 1, 3);
  bench.fill(0x654321);

  // Bench seat
  bench.rect(0, 5, 8, 2);
  bench.fill(color);

  // Backrest
  bench.rect(0, 2, 8, 1);
  bench.fill(color);

  // Backrest supports
  bench.rect(1, 3, 1, 2);
  bench.fill(0x654321);
  bench.rect(6, 3, 1, 2);
  bench.fill(0x654321);

  return bench;
}

/**
 * Generate a pavilion sprite (11-50 collaborators)
 * Simple covered structure with posts
 */
export function generatePavilionSprite(color: number): Graphics {
  const pavilion = new Graphics();

  // Posts (4 corner posts)
  pavilion.rect(1, 6, 1, 6);
  pavilion.fill(0x8b4513);
  pavilion.rect(10, 6, 1, 6);
  pavilion.fill(0x8b4513);
  pavilion.rect(1, 10, 1, 2);
  pavilion.fill(0x8b4513);
  pavilion.rect(10, 10, 1, 2);
  pavilion.fill(0x8b4513);

  // Roof base (darker shade)
  pavilion.beginPath();
  pavilion.moveTo(0, 6);
  pavilion.lineTo(6, 3);
  pavilion.lineTo(12, 6);
  pavilion.lineTo(6, 7);
  pavilion.closePath();
  pavilion.fill(adjustBrightness(color, 0.7));

  // Roof top (lighter)
  pavilion.beginPath();
  pavilion.moveTo(1, 5);
  pavilion.lineTo(6, 2);
  pavilion.lineTo(11, 5);
  pavilion.lineTo(6, 6);
  pavilion.closePath();
  pavilion.fill(color);

  // Floor/platform
  pavilion.rect(2, 11, 8, 1);
  pavilion.fill(0x654321);

  return pavilion;
}

/**
 * Generate a gazebo sprite (51-250 collaborators)
 * Octagonal structure with detailed roof
 */
export function generateGazeboSprite(color: number): Graphics {
  const gazebo = new Graphics();

  // Base platform (octagonal shape simplified)
  gazebo.beginPath();
  gazebo.moveTo(5, 14);
  gazebo.lineTo(9, 14);
  gazebo.lineTo(11, 12);
  gazebo.lineTo(11, 10);
  gazebo.lineTo(9, 8);
  gazebo.lineTo(5, 8);
  gazebo.lineTo(3, 10);
  gazebo.lineTo(3, 12);
  gazebo.closePath();
  gazebo.fill(0x8b7355);

  // Support posts
  gazebo.rect(4, 8, 1, 6);
  gazebo.fill(0x654321);
  gazebo.rect(9, 8, 1, 6);
  gazebo.fill(0x654321);

  // Roof layers (from bottom to top)
  // Bottom layer
  gazebo.beginPath();
  gazebo.moveTo(2, 8);
  gazebo.lineTo(7, 4);
  gazebo.lineTo(12, 8);
  gazebo.lineTo(7, 9);
  gazebo.closePath();
  gazebo.fill(adjustBrightness(color, 0.6));

  // Middle layer
  gazebo.beginPath();
  gazebo.moveTo(3, 6);
  gazebo.lineTo(7, 3);
  gazebo.lineTo(11, 6);
  gazebo.lineTo(7, 7);
  gazebo.closePath();
  gazebo.fill(adjustBrightness(color, 0.8));

  // Top layer
  gazebo.beginPath();
  gazebo.moveTo(4, 4);
  gazebo.lineTo(7, 2);
  gazebo.lineTo(10, 4);
  gazebo.lineTo(7, 5);
  gazebo.closePath();
  gazebo.fill(color);

  // Peak finial
  gazebo.rect(6, 0, 2, 2);
  gazebo.fill(0xffd700); // Gold accent

  return gazebo;
}

/**
 * Generate a bandstand sprite (251+ collaborators)
 * Large performance structure
 */
export function generateBandstandSprite(color: number): Graphics {
  const bandstand = new Graphics();

  // Large platform base
  bandstand.beginPath();
  bandstand.moveTo(2, 16);
  bandstand.lineTo(14, 16);
  bandstand.lineTo(16, 14);
  bandstand.lineTo(16, 11);
  bandstand.lineTo(14, 9);
  bandstand.lineTo(2, 9);
  bandstand.lineTo(0, 11);
  bandstand.lineTo(0, 14);
  bandstand.closePath();
  bandstand.fill(0x8b7355);

  // Platform edge (darker)
  bandstand.rect(2, 15, 12, 1);
  bandstand.fill(0x654321);

  // Support columns (thicker)
  bandstand.rect(3, 9, 2, 6);
  bandstand.fill(0x8b4513);
  bandstand.rect(11, 9, 2, 6);
  bandstand.fill(0x8b4513);

  // Large roof (multi-tiered)
  // Bottom tier
  bandstand.beginPath();
  bandstand.moveTo(0, 9);
  bandstand.lineTo(8, 3);
  bandstand.lineTo(16, 9);
  bandstand.lineTo(8, 11);
  bandstand.closePath();
  bandstand.fill(adjustBrightness(color, 0.6));

  // Middle tier
  bandstand.beginPath();
  bandstand.moveTo(2, 7);
  bandstand.lineTo(8, 2);
  bandstand.lineTo(14, 7);
  bandstand.lineTo(8, 9);
  bandstand.closePath();
  bandstand.fill(adjustBrightness(color, 0.8));

  // Top tier
  bandstand.beginPath();
  bandstand.moveTo(4, 5);
  bandstand.lineTo(8, 1);
  bandstand.lineTo(12, 5);
  bandstand.lineTo(8, 7);
  bandstand.closePath();
  bandstand.fill(color);

  // Decorative top
  bandstand.circle(8, 0, 2);
  bandstand.fill(0xffd700); // Gold dome

  // Railing details
  bandstand.rect(3, 9, 10, 1);
  bandstand.fill(adjustBrightness(color, 1.2));

  return bandstand;
}

/**
 * Adjust color brightness
 */
function adjustBrightness(color: number, factor: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;

  const newR = Math.min(255, Math.floor(r * factor));
  const newG = Math.min(255, Math.floor(g * factor));
  const newB = Math.min(255, Math.floor(b * factor));

  return (newR << 16) | (newG << 8) | newB;
}
