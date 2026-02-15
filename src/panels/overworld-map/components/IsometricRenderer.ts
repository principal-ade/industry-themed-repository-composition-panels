/**
 * IsometricRenderer - Unified rendering for all map elements
 *
 * This component handles:
 * - Grid rendering with region boundaries
 * - Terrain tile rendering with z-index sorting
 * - Path rendering with arrows and styling
 * - Sprite rendering with scaling, aging, and weathering effects
 * - Dynamic updates for dragging
 */

import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import type { Viewport } from 'pixi-viewport';
import type {
  OverworldMap,
  Tile,
  PathConnection,
  LocationNode,
  GridPoint,
} from '../types';
import { gridToScreen, getIsometricZIndex } from '../isometricUtils';

// Isometric tile constants (must match isometricUtils.ts)
const ISO_TILE_WIDTH = 64;
const ISO_TILE_HEIGHT = 32;

export interface SpriteInstance {
  sprite: Sprite;
  highlight: Graphics;
  label: Text;
  weathering?: Graphics;
  gridPosition: { gridX: number; gridY: number };
  size: number; // Size multiplier for boundary calculations

  update(gridX: number, gridY: number): void;
  destroy(): void;
}

export interface SceneContainers {
  background: Container;
  tiles: Container;
  bridges: Container;
  paths: Container;
  nodes: Container;
  spriteInstances: Map<string, SpriteInstance>;
  pathGraphics: Map<string, Graphics>;
}

export interface IsometricRendererConfig {
  viewport: Viewport;
  atlas: Record<string, Texture>;
  tileWidth?: number;
  tileHeight?: number;
  gridColor?: number;
  regionColor?: number;
}

export class IsometricRenderer {
  private viewport: Viewport;
  private atlas: Record<string, Texture>;
  private tileWidth: number;
  private tileHeight: number;
  private gridColor: number;
  private regionColor: number;

  constructor(config: IsometricRendererConfig) {
    this.viewport = config.viewport;
    this.atlas = config.atlas;
    this.tileWidth = config.tileWidth ?? ISO_TILE_WIDTH;
    this.tileHeight = config.tileHeight ?? ISO_TILE_HEIGHT;
    this.gridColor = config.gridColor ?? 0x333333;
    this.regionColor = config.regionColor ?? 0xff6600;
  }

  /**
   * Main rendering method - creates all scene elements
   */
  renderScene(mapData: OverworldMap, showGrid = true): SceneContainers {
    const background = new Container();
    const tiles = new Container();
    const bridges = new Container();
    const paths = new Container();
    const nodes = new Container();

    // Render grid if enabled
    if (showGrid) {
      const grid = this.renderGrid(mapData.width, mapData.height, 25);
      background.addChild(grid);
    }

    // Render terrain tiles
    const terrainContainer = this.renderTerrain(mapData.tiles);
    tiles.addChild(terrainContainer);

    // Create node position map for path rendering
    const nodePositions = new Map<string, GridPoint>();
    for (const node of mapData.nodes) {
      nodePositions.set(node.id, { gridX: node.gridX, gridY: node.gridY });
    }

    // Render paths
    const pathGraphics = this.renderPaths(mapData.paths, nodePositions);
    for (const graphics of pathGraphics.values()) {
      paths.addChild(graphics);
    }

    // Render sprites
    const spriteInstances = this.renderSprites(mapData.nodes);
    for (const instance of spriteInstances.values()) {
      // Add in render order (bottom to top)
      nodes.addChild(instance.highlight);      // Background: yellow diamond
      nodes.addChild(instance.sprite);         // Middle: building/sprite
      if (instance.weathering) {
        nodes.addChild(instance.weathering);   // Top: weathering overlay
      }
      nodes.addChild(instance.label);          // Top: text label
    }

    return {
      background,
      tiles,
      bridges,
      paths,
      nodes,
      spriteInstances,
      pathGraphics,
    };
  }

  /**
   * Render isometric grid with region boundaries
   * Extracted from IsometricGridTest.tsx lines 56-128
   */
  renderGrid(gridWidth: number, gridHeight: number, regionSize: number): Graphics {
    const grid = new Graphics();

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        // Convert grid coordinates to isometric screen position
        const screenX = (x - y) * (this.tileWidth / 2);
        const screenY = (x + y) * (this.tileHeight / 2);

        // Determine if this is a region boundary
        const isRegionBoundaryX = x % regionSize === 0;
        const isRegionBoundaryY = y % regionSize === 0;
        const isRegionBoundary = isRegionBoundaryX || isRegionBoundaryY;

        // Draw isometric diamond tile
        grid.strokeStyle = {
          width: isRegionBoundary ? 2 : 1,
          color: isRegionBoundary ? this.regionColor : this.gridColor,
        };
        grid.beginPath();
        grid.moveTo(screenX, screenY); // Top
        grid.lineTo(screenX + this.tileWidth / 2, screenY + this.tileHeight / 2); // Right
        grid.lineTo(screenX, screenY + this.tileHeight); // Bottom
        grid.lineTo(screenX - this.tileWidth / 2, screenY + this.tileHeight / 2); // Left
        grid.closePath();
        grid.stroke();
      }
    }

    return grid;
  }

  /**
   * Render terrain tiles with z-index sorting
   * Extracted from OverworldMapPanel.tsx lines 223-393
   */
  renderTerrain(tiles: Tile[]): Container {
    const container = new Container();

    for (const tile of tiles) {
      const texture = this.atlas[`${tile.type}-tile`];
      if (!texture) continue;

      const tileSprite = new Sprite(texture);
      const { screenX, screenY } = gridToScreen(tile.x, tile.y);

      tileSprite.x = screenX;
      tileSprite.y = screenY;
      tileSprite.anchor.set(0.5, 0.5);

      // Set z-index for proper layering (painter's algorithm)
      tileSprite.zIndex = getIsometricZIndex(tile.x, tile.y);

      container.addChild(tileSprite);
    }

    // Enable sorting by zIndex
    container.sortableChildren = true;

    return container;
  }

  /**
   * Render paths with arrows and styling
   * Extracted from OverworldMapPanel.tsx lines 395-455
   */
  renderPaths(
    paths: PathConnection[],
    nodePositions: Map<string, GridPoint>
  ): Map<string, Graphics> {
    const pathGraphics = new Map<string, Graphics>();

    for (const path of paths) {
      const fromPos = nodePositions.get(path.from);
      const toPos = nodePositions.get(path.to);

      if (!fromPos || !toPos) continue;

      const graphics = new Graphics();
      this.drawPath(graphics, fromPos, toPos, path.type === 'dev-dependency');
      pathGraphics.set(path.id, graphics);
    }

    return pathGraphics;
  }

  /**
   * Draw a path between two points
   * @param graphics Graphics object to draw on
   * @param fromPos Starting grid position
   * @param toPos Ending grid position
   * @param isDev Whether this is a dev dependency
   */
  private drawPath(
    graphics: Graphics,
    fromPos: GridPoint,
    toPos: GridPoint,
    isDev: boolean
  ): void {
    const from = gridToScreen(fromPos.gridX, fromPos.gridY);
    const to = gridToScreen(toPos.gridX, toPos.gridY);

    const roadColor = isDev ? 0x8b7355 : 0xd2b48c; // Gray-brown for dev, tan for production
    const roadWidth = isDev ? 4 : 6;

    // Draw border (darker)
    graphics.strokeStyle = {
      width: roadWidth + 2,
      color: 0x654321,
    };
    graphics.moveTo(from.screenX, from.screenY);
    graphics.lineTo(to.screenX, to.screenY);
    graphics.stroke();

    // Draw surface
    graphics.strokeStyle = {
      width: roadWidth,
      color: roadColor,
    };
    graphics.moveTo(from.screenX, from.screenY);
    graphics.lineTo(to.screenX, to.screenY);
    graphics.stroke();

    // Draw dashed center line
    graphics.strokeStyle = {
      width: 1,
      color: 0xffffff,
      alpha: 0.3,
    };

    const dashLength = 8;
    const gapLength = 4;
    const totalLength = Math.sqrt(
      Math.pow(to.screenX - from.screenX, 2) + Math.pow(to.screenY - from.screenY, 2)
    );
    const angle = Math.atan2(to.screenY - from.screenY, to.screenX - from.screenX);

    let currentLength = 0;
    while (currentLength < totalLength) {
      const startX = from.screenX + Math.cos(angle) * currentLength;
      const startY = from.screenY + Math.sin(angle) * currentLength;
      const endX = from.screenX + Math.cos(angle) * Math.min(currentLength + dashLength, totalLength);
      const endY = from.screenY + Math.sin(angle) * Math.min(currentLength + dashLength, totalLength);

      graphics.moveTo(startX, startY);
      graphics.lineTo(endX, endY);

      currentLength += dashLength + gapLength;
    }
  }

  /**
   * Render sprites with scaling, aging, and weathering effects
   * Extracted from OverworldMapPanel.tsx lines 457-507
   */
  renderSprites(nodes: LocationNode[]): Map<string, SpriteInstance> {
    const spriteInstances = new Map<string, SpriteInstance>();

    for (const node of nodes) {
      const texture = this.atlas[node.sprite];
      if (!texture) continue;

      const sprite = new Sprite(texture);
      const { screenX, screenY } = gridToScreen(node.gridX, node.gridY);

      // Calculate scale to fit sprite within its boundary
      const sizeMultiplier = node.size || 1.0;

      // Boundary is 4 × size (in tiles)
      const boundarySize = 4 * sizeMultiplier;
      const boundaryWidth = boundarySize * this.tileWidth;
      const boundaryHeight = boundarySize * this.tileHeight;

      // Scale texture to fit within boundary (with some padding)
      const padding = 0.8; // Use 80% of boundary to leave some space
      const baseScale = Math.min(
        (boundaryWidth * padding) / texture.width,
        (boundaryHeight * padding) / texture.height
      );
      const finalScale = baseScale;

      sprite.scale.set(finalScale);
      sprite.x = screenX;
      sprite.y = screenY;
      // Anchor at bottom-center (0.5, 1.0) so buildings "stand" on the ground
      // This works for both flat sprites (circles) and 3D isometric buildings
      sprite.anchor.set(0.5, 0.85);

      // Apply aging color fade
      if (node.aging && node.aging.colorFade > 0) {
        const fadeAmount = node.aging.colorFade;
        const grayValue = Math.floor((1 - fadeAmount + fadeAmount * 0.6) * 255);
        sprite.tint = (grayValue << 16) | (grayValue << 8) | grayValue;
      }

      // Set z-index for proper layering
      sprite.zIndex = getIsometricZIndex(node.gridX, node.gridY);

      // Create highlight boundary (4 × size formula)
      const highlight = this.createHighlight(node.gridX, node.gridY, sizeMultiplier);
      highlight.visible = false; // Hidden by default, shown on hover by interaction manager
      highlight.zIndex = sprite.zIndex;

      // Create weathering overlay if needed
      let weathering: Graphics | undefined;
      if (node.aging && node.aging.weatheringLevel > 0.3) {
        weathering = this.createWeathering(
          screenX,
          screenY,
          sprite.width,
          sprite.height,
          node.aging.weatheringLevel
        );
        weathering.zIndex = sprite.zIndex + 0.1;
      }

      // Create label with high resolution for crisp text
      const label = new Text({
        text: node.label,
        style: {
          fontSize: 12,
          fill: 0xffffff,
          fontFamily: 'Arial',
          fontWeight: '500',
        },
        resolution: 2, // Render at 2x for crisp text on high-DPI screens
      });
      label.x = screenX;
      // Position label just below the sprite base (anchor is at 0.85, so base is ~15% from bottom)
      label.y = screenY + sprite.height * 0.15 + 8;
      label.anchor.set(0.5, 0);
      label.zIndex = sprite.zIndex + 0.2;

      // Create sprite instance
      const instance: SpriteInstance = {
        sprite,
        highlight,
        label,
        weathering,
        gridPosition: { gridX: node.gridX, gridY: node.gridY },
        size: sizeMultiplier,
        update: (gridX: number, gridY: number) => {
          const pos = gridToScreen(gridX, gridY);
          sprite.x = pos.screenX;
          sprite.y = pos.screenY;
          label.x = pos.screenX;
          label.y = pos.screenY + sprite.height * 0.15 + 8;

          // Update highlight - redraw it at new position
          highlight.clear();
          const hoverSize = 4 * sizeMultiplier;
          const tileWidth = hoverSize * this.tileWidth;
          const tileHeight = hoverSize * this.tileHeight;

          highlight.strokeStyle = { width: 3, color: 0xffff00 };
          highlight.fillStyle = { color: 0xffff00, alpha: 0.1 };
          highlight.beginPath();
          highlight.moveTo(pos.screenX, pos.screenY - tileHeight / 2); // Top
          highlight.lineTo(pos.screenX + tileWidth / 2, pos.screenY); // Right
          highlight.lineTo(pos.screenX, pos.screenY + tileHeight / 2); // Bottom
          highlight.lineTo(pos.screenX - tileWidth / 2, pos.screenY); // Left
          highlight.closePath();
          highlight.fill();
          highlight.stroke();

          if (weathering) {
            weathering.x = pos.screenX;
            weathering.y = pos.screenY;
          }

          instance.gridPosition = { gridX, gridY };
        },
        destroy: () => {
          sprite.destroy();
          highlight.destroy();
          label.destroy();
          weathering?.destroy();
        },
      };

      spriteInstances.set(node.id, instance);
    }

    return spriteInstances;
  }

  /**
   * Create highlight boundary for a sprite
   * Extracted from IsometricGridTest.tsx lines 144-158
   */
  private createHighlight(gridX: number, gridY: number, sizeMultiplier: number): Graphics {
    const highlight = new Graphics();
    const { screenX, screenY } = gridToScreen(gridX, gridY);

    const hoverSize = 4 * sizeMultiplier; // Boundary is 4x the sprite size
    const tileWidth = hoverSize * this.tileWidth;
    const tileHeight = hoverSize * this.tileHeight;

    highlight.strokeStyle = { width: 3, color: 0xffff00 }; // Yellow boundary
    highlight.fillStyle = { color: 0xffff00, alpha: 0.1 };
    highlight.beginPath();
    highlight.moveTo(screenX, screenY - tileHeight / 2); // Top
    highlight.lineTo(screenX + tileWidth / 2, screenY); // Right
    highlight.lineTo(screenX, screenY + tileHeight / 2); // Bottom
    highlight.lineTo(screenX - tileWidth / 2, screenY); // Left
    highlight.closePath();
    highlight.fill();
    highlight.stroke();

    return highlight;
  }

  /**
   * Create weathering overlay for aged sprites
   * Extracted from OverworldMapPanel.tsx lines 478-498
   */
  private createWeathering(
    x: number,
    y: number,
    width: number,
    height: number,
    weatheringLevel: number
  ): Graphics {
    const weathering = new Graphics();
    weathering.x = x;
    weathering.y = y;

    // Draw random dark spots for weathering effect
    const spotCount = Math.floor(weatheringLevel * 20);
    const alpha = weatheringLevel * 0.3;

    for (let i = 0; i < spotCount; i++) {
      const spotX = (Math.random() - 0.5) * width;
      const spotY = (Math.random() - 0.5) * height;
      const spotRadius = Math.random() * 3 + 1;

      weathering.circle(spotX, spotY, spotRadius);
      weathering.fillStyle = { color: 0x000000, alpha };
      weathering.fill();
    }

    return weathering;
  }

  /**
   * Update a path between two positions
   * Used during sprite dragging
   */
  updatePath(pathGraphics: Graphics, fromPos: GridPoint, toPos: GridPoint): void {
    pathGraphics.clear();
    this.drawPath(pathGraphics, fromPos, toPos, false);
  }

  /**
   * Update sprite position
   */
  updateSpritePosition(instance: SpriteInstance, gridX: number, gridY: number): void {
    instance.update(gridX, gridY);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Renderer doesn't own the atlas or viewport, so no cleanup needed
  }
}
