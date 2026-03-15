/**
 * RepoSprite - Standalone component for rendering a single repository sprite
 * Uses the same rendering logic as the overworld map for visual consistency
 */

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { Application, Container, Graphics } from 'pixi.js';
import { generateBuildingSprite } from './buildingSpriteGenerator';
import {
  generateFlagSprite,
  generateTrophySprite,
  generateStatueSprite,
} from './starDecorationSprites';
import {
  generateBenchSprite,
  generatePavilionSprite,
  generateGazeboSprite,
  generateBandstandSprite,
} from './collaboratorDecorationSprites';
import { getStarTier, getStarScaleFactor } from '../starDecoration';
import {
  getCollaboratorTier,
  getCollaboratorScaleFactor,
} from '../collaboratorDecoration';
import {
  generateLicenseSign,
  generateLicenseGround,
  generateNeutralGround,
  type LicenseType,
} from './licenseSignSprites';
import { cardThemes, parseColor, type CardTheme } from './cardThemes';
import { CardLayout } from './CardLayout';

// Re-export CardTheme for consumers
export type { CardTheme };

// Isometric tile dimensions (must match IsometricRenderer)
const ISO_TILE_WIDTH = 64;
const ISO_TILE_HEIGHT = 32;

/** Display variant for the sprite */
export type RepoSpriteVariant = 'default' | 'card';

/** Package definition for monorepos */
export interface RepoSpritePackage {
  name: string;
  color?: number | string;
  size?: number; // Relative size (default: 1.0)
}

export interface RepoSpriteProps {
  /** Size multiplier (1.0 - 4.0) */
  size?: number;
  /** Building color as hex number (e.g., 0xd2691e) or hex string (e.g., "#d2691e") - used for single package */
  color?: number | string;
  /** Packages for monorepo (renders multiple buildings) */
  packages?: RepoSpritePackage[];
  /** Number of files in the repository */
  files?: number;
  /** GitHub star count for decoration tier */
  stars?: number;
  /** Collaborator count for decoration tier */
  collaborators?: number;
  /** SPDX license identifier (e.g., 'MIT', 'Apache-2.0', 'GPL-3.0') */
  license?: string;
  /** Repository/package name (shown on license sign and card) */
  label?: string;
  /** Repository owner (GitHub username/org, used for avatar URL) */
  owner?: string;
  /** Owner display name (shown in UI, falls back to owner if not provided) */
  ownerDisplayName?: string | null;
  /** Primary language (shown on card) */
  language?: string;
  /** ISO timestamp when repo was created on GitHub */
  createdAt?: string;
  /** Display variant: 'default' | 'card' */
  variant?: RepoSpriteVariant;
  /** Card color theme (only applies to card variant) */
  cardTheme?: CardTheme;
  /** Width of the canvas */
  width?: number;
  /** Height of the canvas */
  height?: number;
  /** Background color (transparent if not set) */
  backgroundColor?: number;
  /** Show the isometric diamond boundary */
  showBoundary?: boolean;
  /** Boundary color (default: yellow) */
  boundaryColor?: number;
  /** Show debug outline */
  debug?: boolean;
  /** Callback when hovering over a package in a monorepo */
  onPackageHover?: (packageName: string) => void;
  /** Callback when hover ends on a package in a monorepo */
  onPackageHoverEnd?: (packageName: string) => void;
}

/**
 * Calculate positions for sub-packages in a monorepo
 */
function getPackagePositions(
  count: number,
  footprintWidth: number,
  footprintHeight: number
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const spacing = 0.18; // Tighter spacing towards center
  const yOffset = -footprintHeight * 0.15; // Shift towards back of diamond

  if (count === 2) {
    positions.push(
      { x: -footprintWidth * spacing, y: yOffset },
      { x: footprintWidth * spacing, y: yOffset }
    );
  } else if (count === 3) {
    positions.push(
      {
        x: -footprintWidth * spacing * 0.8,
        y: -footprintHeight * spacing * 0.8 + yOffset,
      },
      {
        x: footprintWidth * spacing * 0.8,
        y: -footprintHeight * spacing * 0.8 + yOffset,
      },
      { x: 0, y: footprintHeight * spacing * 1.0 + yOffset }
    );
  } else if (count === 4) {
    positions.push(
      { x: 0, y: -footprintHeight * spacing + yOffset },
      { x: -footprintWidth * spacing, y: yOffset },
      { x: footprintWidth * spacing, y: yOffset },
      { x: 0, y: footprintHeight * spacing + yOffset }
    );
  } else {
    // Grid layout for 5+
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const cellWidth = (footprintWidth * 0.7) / cols;
    const cellHeight = (footprintHeight * 0.7) / rows;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = (col - (cols - 1) / 2) * cellWidth;
      const y = (row - (rows - 1) / 2) * cellHeight;
      positions.push({ x, y });
    }
  }

  return positions;
}

export const RepoSprite: React.FC<RepoSpriteProps> = ({
  size = 2.0,
  color = 0xd2691e,
  packages,
  files,
  stars,
  collaborators,
  license,
  label,
  owner,
  ownerDisplayName,
  language,
  createdAt,
  variant = 'default',
  cardTheme = 'blue',
  width = 200,
  height = 200,
  backgroundColor,
  showBoundary = true,
  boundaryColor = 0xffff00,
  debug = false,
  onPackageHover,
  onPackageHoverEnd,
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      // Create a minimal PixiJS application
      const app = new Application();
      await app.init({
        width,
        height,
        backgroundAlpha: backgroundColor !== undefined ? 1 : 0,
        backgroundColor: backgroundColor ?? 0x000000,
        antialias: true,
        resolution: 2,
        autoDensity: true,
      });

      containerRef.current?.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      // Calculate boundary dimensions (4x size multiplier, matching IsometricRenderer)
      const boundarySize = 4 * size;
      const boundaryWidth = boundarySize * ISO_TILE_WIDTH;
      const boundaryHeight = boundarySize * ISO_TILE_HEIGHT;

      // Calculate scale to fit boundary within canvas (with padding)
      const padding = 0.9; // Use 90% of canvas
      const scaleX = (width * padding) / boundaryWidth;
      const scaleY = (height * padding) / boundaryHeight;
      const scale = Math.min(scaleX, scaleY);

      // Create main container centered in canvas, scaled to fit
      const mainContainer = new Container();
      mainContainer.x = width / 2;
      mainContainer.y = height / 2;
      mainContainer.scale.set(scale);
      app.stage.addChild(mainContainer);

      // Draw isometric diamond boundary (behind everything)
      if (showBoundary) {
        const boundary = new Graphics();
        boundary.strokeStyle = { width: 2, color: boundaryColor };
        boundary.fillStyle = { color: boundaryColor, alpha: 0.1 };
        boundary.beginPath();
        boundary.moveTo(0, -boundaryHeight / 2); // Top
        boundary.lineTo(boundaryWidth / 2, 0); // Right
        boundary.lineTo(0, boundaryHeight / 2); // Bottom
        boundary.lineTo(-boundaryWidth / 2, 0); // Left
        boundary.closePath();
        boundary.fill();
        boundary.stroke();
        mainContainer.addChild(boundary);
      }

      // Add ground (behind building) - license-specific or neutral
      const ground = license
        ? generateLicenseGround(license as LicenseType, size)
        : generateNeutralGround(size);
      mainContainer.addChild(ground);

      // Render building(s)
      if (packages && packages.length > 1) {
        // Monorepo: render multiple smaller buildings
        const positions = getPackagePositions(
          packages.length,
          boundaryWidth / 2,
          boundaryHeight / 2
        );

        for (let i = 0; i < packages.length; i++) {
          const pkg = packages[i];
          const pos = positions[i] || { x: 0, y: 0 };

          const pkgColor = pkg.color
            ? parseColor(pkg.color)
            : parseColor(color);
          const pkgSize = (pkg.size || 1.0) * size * 0.4; // Scale down for cluster

          const buildingGraphics = generateBuildingSprite({
            size: pkgSize,
            color: pkgColor,
          });

          buildingGraphics.x = pos.x;
          buildingGraphics.y = pos.y;

          // Make package interactive for hover events
          buildingGraphics.eventMode = 'static';
          buildingGraphics.cursor = 'pointer';
          const originalTint = buildingGraphics.tint;
          const packageName = pkg.name;

          buildingGraphics.on('pointerover', () => {
            buildingGraphics.tint = 0x88ccff;
            onPackageHover?.(packageName);
          });

          buildingGraphics.on('pointerout', () => {
            buildingGraphics.tint = originalTint;
            onPackageHoverEnd?.(packageName);
          });

          mainContainer.addChild(buildingGraphics);
        }
      } else {
        // Single package
        const parsedColor = parseColor(color);
        const buildingGraphics = generateBuildingSprite({
          size,
          color: parsedColor,
        });

        // Position building at center of boundary
        mainContainer.addChild(buildingGraphics);
      }

      // Add license sign (in front of building)
      if (license) {
        const licenseSign = generateLicenseSign(license as LicenseType, {
          name: label || '',
          sizeMultiplier: size,
        });
        // Position at front edge of diamond (y = footprint.height * 0.75)
        const footprintHeight = boundaryHeight / 2;
        licenseSign.y = footprintHeight * 0.75;
        mainContainer.addChild(licenseSign);
      }

      // Add star decoration if stars provided
      if (stars && stars > 0) {
        const tier = getStarTier(stars);
        const scaleFactor = getStarScaleFactor(stars);
        let starDecoration: Container | null = null;

        if (tier) {
          const decorationColor = tier.color;
          if (tier.decorationType === 'flag') {
            starDecoration = generateFlagSprite(decorationColor);
          } else if (tier.decorationType === 'trophy') {
            starDecoration = generateTrophySprite(decorationColor);
          } else if (tier.decorationType === 'statue') {
            starDecoration = generateStatueSprite(decorationColor);
          }
        }

        if (starDecoration) {
          // Pivot at right edge, bottom (matches IsometricRenderer)
          const dim = { w: 8, h: 12 };
          starDecoration.pivot.set(dim.w, dim.h);
          // Scale matches IsometricRenderer: 1.5 * scaleFactor
          starDecoration.scale.set(1.5 * scaleFactor);
          // Position on horizontal center line, halfway to left corner
          starDecoration.x = -boundaryWidth / 4;
          starDecoration.y = 0;
          mainContainer.addChild(starDecoration);
        }
      }

      // Add collaborator decoration if collaborators provided
      if (collaborators && collaborators > 0) {
        const tier = getCollaboratorTier(collaborators);
        const scaleFactor = getCollaboratorScaleFactor(collaborators);
        let collabDecoration: Container | null = null;

        if (tier) {
          const decorationColor = tier.color;
          if (tier.decorationType === 'bench') {
            collabDecoration = generateBenchSprite(decorationColor);
          } else if (tier.decorationType === 'pavilion') {
            collabDecoration = generatePavilionSprite(decorationColor);
          } else if (tier.decorationType === 'gazebo') {
            collabDecoration = generateGazeboSprite(decorationColor);
          } else if (tier.decorationType === 'bandstand') {
            collabDecoration = generateBandstandSprite(decorationColor);
          }
        }

        if (collabDecoration) {
          // Pivot at left edge, bottom (matches IsometricRenderer)
          const dim = { w: 12, h: 12 };
          collabDecoration.pivot.set(0, dim.h);
          // Scale matches IsometricRenderer: 1.5 * scaleFactor
          collabDecoration.scale.set(1.5 * scaleFactor);
          // Position on horizontal center line, halfway to right corner
          collabDecoration.x = boundaryWidth / 4;
          collabDecoration.y = 0;
          mainContainer.addChild(collabDecoration);
        }
      }

      // Debug outline
      if (debug) {
        const { Graphics } = await import('pixi.js');
        const debugRect = new Graphics();
        debugRect.rect(-width / 2, -height / 2, width, height);
        debugRect.stroke({ width: 1, color: 0xff0000 });
        mainContainer.addChild(debugRect);
      }
    };

    init();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [
    size,
    color,
    packages,
    files,
    stars,
    collaborators,
    license,
    label,
    variant,
    width,
    height,
    backgroundColor,
    showBoundary,
    boundaryColor,
    debug,
    onPackageHover,
    onPackageHoverEnd,
  ]);

  // Card variant wraps the sprite in a styled card (Pokemon card style)
  if (variant === 'card') {
    return (
      <CardLayout
        color={color}
        owner={owner}
        ownerDisplayName={ownerDisplayName}
        stars={stars}
        label={label}
        files={files}
        language={language}
        license={license}
        packages={packages}
        createdAt={createdAt}
      >
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </CardLayout>
    );
  }

  // Default and terrain variants
  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        display: 'inline-block',
      }}
    />
  );
};
