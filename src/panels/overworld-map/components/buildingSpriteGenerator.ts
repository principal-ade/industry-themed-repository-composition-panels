/**
 * Building Sprite Generator
 * Creates isometric building sprites for repository visualization
 */

import { Graphics, Text } from 'pixi.js';
import { getStarTier, formatStarCount } from '../starDecoration';
import {
  generateFlagSprite,
  generateTrophySprite,
  generateStatueSprite,
} from './starDecorationSprites';
import {
  getCollaboratorTier,
  formatCollaboratorCount,
} from '../collaboratorDecoration';
import {
  generateBenchSprite,
  generatePavilionSprite,
  generateGazeboSprite,
  generateBandstandSprite,
} from './collaboratorDecorationSprites';

export interface BuildingSpriteConfig {
  size: number; // Size multiplier (1.0 - 4.0)
  color?: number; // Optional color override (default: tan/brown)
  stars?: number; // GitHub star count for decoration
  collaborators?: number; // Contributor count for community space decoration
}

/**
 * Generate a simple isometric building sprite
 * Based on the cuboid building from IsometricGridTest
 *
 * @param config Building configuration
 * @returns Graphics object ready for texture generation
 */
export function generateBuildingSprite(config: BuildingSpriteConfig): Graphics {
  const { size, color = 0xd2691e, stars, collaborators } = config;

  const building = new Graphics();

  // Base dimensions scale with size multiplier
  // Base size is 40x40 at 1.0x, scaled by multiplier
  const baseWidth = 40 * size; // Direct scaling from 1.0x baseline
  const baseDepth = 40 * size;
  const baseHeight = 50 * size;

  const width = baseWidth;
  const depth = baseDepth;
  const height = baseHeight;

  // Isometric conversion to match grid's 2:1 ratio
  const isoWidth = width;
  const isoDepthY = depth * 0.25; // Vertical: quarter the depth for 2:1 ratio

  // Color variations for shading (darker to lighter)
  const darkColor = adjustBrightness(color, 0.6); // Bottom/left
  const mediumColor = adjustBrightness(color, 0.75); // Left side
  const baseColor = color; // Right/front
  const lightColor = adjustBrightness(color, 1.2); // Top/roof

  // Bottom face (base - darkest)
  building.fillStyle = { color: darkColor };
  building.beginPath();
  building.moveTo(-isoWidth / 2, 0); // Left
  building.lineTo(0, -isoDepthY); // Back
  building.lineTo(isoWidth / 2, 0); // Right
  building.lineTo(0, isoDepthY); // Front
  building.closePath();
  building.fill();

  // Left face (darker side)
  building.fillStyle = { color: mediumColor };
  building.beginPath();
  building.moveTo(-isoWidth / 2, 0); // Bottom left
  building.lineTo(-isoWidth / 2, -height); // Top left
  building.lineTo(0, -height - isoDepthY); // Top back
  building.lineTo(0, -isoDepthY); // Bottom back
  building.closePath();
  building.fill();

  // Right face (lighter front)
  building.fillStyle = { color: baseColor };
  building.beginPath();
  building.moveTo(0, -isoDepthY); // Bottom back
  building.lineTo(0, -height - isoDepthY); // Top back
  building.lineTo(isoWidth / 2, -height); // Top right
  building.lineTo(isoWidth / 2, 0); // Bottom right
  building.closePath();
  building.fill();

  // Top face (roof - lightest)
  building.fillStyle = { color: lightColor };
  building.beginPath();
  building.moveTo(-isoWidth / 2, -height); // Left
  building.lineTo(0, -height - isoDepthY); // Back
  building.lineTo(isoWidth / 2, -height); // Right
  building.lineTo(0, -height + isoDepthY); // Front
  building.closePath();
  building.fill();

  // Outline for definition
  building.strokeStyle = { width: 2, color: 0x000000, alpha: 0.3 };
  building.beginPath();
  // Left edge
  building.moveTo(-isoWidth / 2, 0);
  building.lineTo(-isoWidth / 2, -height);
  building.lineTo(0, -height - isoDepthY);
  // Top edge
  building.lineTo(isoWidth / 2, -height);
  // Right edge
  building.lineTo(isoWidth / 2, 0);
  building.stroke();

  // Add star decoration if stars are provided
  if (stars && stars > 0) {
    const tier = getStarTier(stars);
    if (tier) {
      // Generate decoration graphic based on type
      let decoration: Graphics;
      switch (tier.decorationType) {
        case 'flag':
          decoration = generateFlagSprite(tier.color);
          break;
        case 'trophy':
          decoration = generateTrophySprite(tier.color);
          break;
        case 'statue':
          decoration = generateStatueSprite(tier.color);
          break;
      }

      // Position decoration to the right side of the building
      // Position at ground level (y=0) and offset to the right
      const decorationX = isoWidth * 0.4; // 40% to the right from center
      const decorationY = -10; // Slightly above ground
      decoration.x = decorationX;
      decoration.y = decorationY;
      decoration.scale.set(2.5); // Scale up for visibility

      building.addChild(decoration);

      // Add star count text
      const countText = new Text({
        text: formatStarCount(stars),
        style: {
          fontSize: 11,
          fill: 0xffffff,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          stroke: { color: 0x000000, width: 3 },
        },
        resolution: 2,
      });
      countText.x = decorationX;
      countText.y = decorationY + 20; // Below the decoration
      countText.anchor.set(0.5, 0);

      building.addChild(countText);
    }
  }

  // Add collaborator decoration if collaborators are provided
  if (collaborators && collaborators > 0) {
    const tier = getCollaboratorTier(collaborators);
    if (tier) {
      // Generate decoration graphic based on type
      let decoration: Graphics;
      switch (tier.decorationType) {
        case 'bench':
          decoration = generateBenchSprite(tier.color);
          break;
        case 'pavilion':
          decoration = generatePavilionSprite(tier.color);
          break;
        case 'gazebo':
          decoration = generateGazeboSprite(tier.color);
          break;
        case 'bandstand':
          decoration = generateBandstandSprite(tier.color);
          break;
      }

      // Position decoration to the left side of the building (opposite of stars)
      const decorationX = -isoWidth * 0.4; // 40% to the left from center
      const decorationY = -10; // Slightly above ground
      decoration.x = decorationX;
      decoration.y = decorationY;
      decoration.scale.set(2.5); // Scale up for visibility

      building.addChild(decoration);

      // Add collaborator count text
      const countText = new Text({
        text: formatCollaboratorCount(collaborators),
        style: {
          fontSize: 11,
          fill: 0xffffff,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          stroke: { color: 0x000000, width: 3 },
        },
        resolution: 2,
      });
      countText.x = decorationX;
      countText.y = decorationY + 20; // Below the decoration
      countText.anchor.set(0.5, 0);

      building.addChild(countText);
    }
  }

  return building;
}

/**
 * Adjust color brightness
 * @param color Hex color number
 * @param factor Brightness factor (1.0 = no change, <1.0 = darker, >1.0 = lighter)
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
