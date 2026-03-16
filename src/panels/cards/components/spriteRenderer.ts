/**
 * Sprite Renderer - Utility to render PixiJS sprites to static images
 *
 * Renders RepoSprite configurations to PNG data URLs for use in contexts
 * where multiple WebGL contexts would be problematic (e.g., carousels).
 *
 * Uses a single shared PixiJS Application and a render queue to avoid
 * WebGL context limits.
 */

import { Application, Container, Graphics } from 'pixi.js';
import { generateBuildingSprite } from '../../overworld-map/components/buildingSpriteGenerator';
import {
  generateFlagSprite,
  generateTrophySprite,
  generateStatueSprite,
} from '../../overworld-map/components/starDecorationSprites';
import {
  generateBenchSprite,
  generatePavilionSprite,
  generateGazeboSprite,
  generateBandstandSprite,
} from '../../overworld-map/components/collaboratorDecorationSprites';
import {
  getStarTier,
  getStarScaleFactor,
} from '../../overworld-map/starDecoration';
import {
  getCollaboratorTier,
  getCollaboratorScaleFactor,
} from '../../overworld-map/collaboratorDecoration';
import {
  generateLicenseSign,
  generateLicenseGround,
  generateNeutralGround,
  type LicenseType,
} from '../../overworld-map/components/licenseSignSprites';
import type { RepoSpritePackage } from './RepoSprite';

// Isometric tile dimensions (must match IsometricRenderer)
const ISO_TILE_WIDTH = 64;
const ISO_TILE_HEIGHT = 32;

// Shared PixiJS application instance (singleton)
let sharedApp: Application | null = null;
let sharedAppPromise: Promise<Application> | null = null;
let isAppDestroyed = false;

// Render queue for serializing render operations
interface RenderTask {
  resolve: (dataUrl: string) => void;
  reject: (error: Error) => void;
  options: SpriteRenderOptions;
}

const renderQueue: RenderTask[] = [];
let isProcessingQueue = false;

export interface SpriteRenderOptions {
  /** Size multiplier (1.0 - 4.0) */
  size?: number;
  /** Building color as hex number or string */
  color?: number | string;
  /** Packages for monorepo */
  packages?: RepoSpritePackage[];
  /** GitHub star count */
  stars?: number;
  /** Collaborator count */
  collaborators?: number;
  /** SPDX license identifier */
  license?: string;
  /** Repository name */
  label?: string;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Show boundary diamond */
  showBoundary?: boolean;
  /** Boundary color */
  boundaryColor?: number;
}

/**
 * Parse color from string or number to number
 */
function parseColor(color: number | string): number {
  if (typeof color === 'number') return color;
  return parseInt(color.replace('#', ''), 16);
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
  const spacing = 0.18;
  const yOffset = -footprintHeight * 0.15;

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

/**
 * Get or create the shared PixiJS application
 */
async function getSharedApp(
  width: number,
  height: number
): Promise<Application> {
  // If destroyed, reset
  if (isAppDestroyed) {
    sharedApp = null;
    sharedAppPromise = null;
    isAppDestroyed = false;
  }

  if (sharedApp) {
    // Resize if needed
    sharedApp.renderer.resize(width, height);
    return sharedApp;
  }

  // If already initializing, wait for it
  if (sharedAppPromise) {
    const app = await sharedAppPromise;
    app.renderer.resize(width, height);
    return app;
  }

  // Create new shared app
  sharedAppPromise = (async () => {
    const app = new Application();
    await app.init({
      width,
      height,
      backgroundAlpha: 0,
      backgroundColor: 0x000000,
      antialias: true,
      resolution: 2,
      autoDensity: true,
    });
    sharedApp = app;
    return app;
  })();

  return sharedAppPromise;
}

/**
 * Render a single sprite using the shared app
 */
async function renderSpriteInternal(
  options: SpriteRenderOptions
): Promise<string> {
  const {
    size = 2.0,
    color = 0xd2691e,
    packages,
    stars,
    collaborators,
    license,
    label,
    width = 200,
    height = 200,
    showBoundary = false,
    boundaryColor = 0xffff00,
  } = options;

  const app = await getSharedApp(width, height);

  // Clear previous content
  app.stage.removeChildren();

  // Calculate boundary dimensions
  const boundarySize = 4 * size;
  const boundaryWidth = boundarySize * ISO_TILE_WIDTH;
  const boundaryHeight = boundarySize * ISO_TILE_HEIGHT;

  // Calculate scale to fit
  const padding = 0.9;
  const scaleX = (width * padding) / boundaryWidth;
  const scaleY = (height * padding) / boundaryHeight;
  const scale = Math.min(scaleX, scaleY);

  // Create main container
  const mainContainer = new Container();
  mainContainer.x = width / 2;
  mainContainer.y = height / 2;
  mainContainer.scale.set(scale);
  app.stage.addChild(mainContainer);

  // Draw boundary if requested
  if (showBoundary) {
    const boundary = new Graphics();
    boundary.strokeStyle = { width: 2, color: boundaryColor };
    boundary.fillStyle = { color: boundaryColor, alpha: 0.1 };
    boundary.beginPath();
    boundary.moveTo(0, -boundaryHeight / 2);
    boundary.lineTo(boundaryWidth / 2, 0);
    boundary.lineTo(0, boundaryHeight / 2);
    boundary.lineTo(-boundaryWidth / 2, 0);
    boundary.closePath();
    boundary.fill();
    boundary.stroke();
    mainContainer.addChild(boundary);
  }

  // Add ground - license-specific or neutral
  const ground = license
    ? generateLicenseGround(license as LicenseType, size)
    : generateNeutralGround(size);
  mainContainer.addChild(ground);

  // Render building(s)
  if (packages && packages.length > 1) {
    const positions = getPackagePositions(
      packages.length,
      boundaryWidth / 2,
      boundaryHeight / 2
    );

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      const pos = positions[i] || { x: 0, y: 0 };

      const pkgColor = pkg.color ? parseColor(pkg.color) : parseColor(color);
      const pkgSize = (pkg.size || 1.0) * size * 0.4;

      const buildingGraphics = generateBuildingSprite({
        size: pkgSize,
        color: pkgColor,
      });

      buildingGraphics.x = pos.x;
      buildingGraphics.y = pos.y;
      mainContainer.addChild(buildingGraphics);
    }
  } else {
    const parsedColor = parseColor(color);
    const buildingGraphics = generateBuildingSprite({
      size,
      color: parsedColor,
    });
    mainContainer.addChild(buildingGraphics);
  }

  // Add license sign
  if (license) {
    const licenseSign = generateLicenseSign(license as LicenseType, {
      name: label || '',
      sizeMultiplier: size,
    });
    const footprintHeight = boundaryHeight / 2;
    licenseSign.y = footprintHeight * 0.75;
    mainContainer.addChild(licenseSign);
  }

  // Add star decoration
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
      const dim = { w: 8, h: 12 };
      starDecoration.pivot.set(dim.w, dim.h);
      starDecoration.scale.set(1.5 * scaleFactor);
      starDecoration.x = -boundaryWidth / 4;
      starDecoration.y = 0;
      mainContainer.addChild(starDecoration);
    }
  }

  // Add collaborator decoration
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
      const dim = { w: 12, h: 12 };
      collabDecoration.pivot.set(0, dim.h);
      collabDecoration.scale.set(1.5 * scaleFactor);
      collabDecoration.x = boundaryWidth / 4;
      collabDecoration.y = 0;
      mainContainer.addChild(collabDecoration);
    }
  }

  // Render one frame
  app.render();

  // Extract canvas as data URL
  const canvas = app.canvas as HTMLCanvasElement;
  const dataUrl = canvas.toDataURL('image/png');

  return dataUrl;
}

/**
 * Process the render queue sequentially
 */
async function processRenderQueue(): Promise<void> {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (renderQueue.length > 0) {
    const task = renderQueue.shift();
    if (task) {
      try {
        const dataUrl = await renderSpriteInternal(task.options);
        task.resolve(dataUrl);
      } catch (error) {
        task.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
    // Small delay between renders to let browser breathe
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  isProcessingQueue = false;
}

/**
 * Render a sprite configuration to a PNG data URL
 *
 * Uses a shared PixiJS application and queues renders to avoid
 * WebGL context limits.
 */
export async function renderSpriteToDataUrl(
  options: SpriteRenderOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    renderQueue.push({ resolve, reject, options });
    processRenderQueue();
  });
}

// Cache for rendered sprites
const spriteCache = new Map<string, string>();

/**
 * Generate a cache key for sprite options
 */
function getCacheKey(options: SpriteRenderOptions): string {
  return JSON.stringify({
    size: options.size,
    color: options.color,
    packages: options.packages?.map((p) => ({ name: p.name, color: p.color })),
    stars: options.stars,
    collaborators: options.collaborators,
    license: options.license,
    label: options.label,
    width: options.width,
    height: options.height,
  });
}

/**
 * Render a sprite to data URL with caching
 *
 * Returns cached result if available, otherwise renders and caches.
 */
export async function renderSpriteToDataUrlCached(
  options: SpriteRenderOptions
): Promise<string> {
  const cacheKey = getCacheKey(options);

  const cached = spriteCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const dataUrl = await renderSpriteToDataUrl(options);
  spriteCache.set(cacheKey, dataUrl);

  return dataUrl;
}

/**
 * Clear the sprite cache
 */
export function clearSpriteCache(): void {
  spriteCache.clear();
}

/**
 * Get the current cache size
 */
export function getSpriteCacheSize(): number {
  return spriteCache.size;
}

/**
 * Destroy the shared PixiJS application
 * Call this when you're done with sprite rendering to free resources
 */
export function destroySharedApp(): void {
  if (sharedApp) {
    sharedApp.destroy(true, { children: true });
    sharedApp = null;
    sharedAppPromise = null;
    isAppDestroyed = true;
  }
}
