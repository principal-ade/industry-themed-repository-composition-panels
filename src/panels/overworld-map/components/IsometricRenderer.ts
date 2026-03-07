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
import {
  generateLicenseSign,
  generateLicenseGround,
  calculateFootprint,
  type LicenseType,
} from './licenseSignSprites';

// Isometric tile constants (must match isometricUtils.ts)
const ISO_TILE_WIDTH = 64;
const ISO_TILE_HEIGHT = 32;

export interface SpriteInstance {
  sprite: Sprite;
  highlight: Graphics;
  label: Text;
  hoverLabel?: Text; // For showing hovered package name in monorepos
  weathering?: Graphics;
  licenseGround?: Graphics | Container; // License-based ground treatment (grass, cobblestone, fence)
  licenseSign?: Container; // License-based sign/archway
  ownerAvatar?: Container; // Owner avatar at bottom corner
  gridPosition: { gridX: number; gridY: number };
  size: number; // Size multiplier for boundary calculations
  spriteKey: string; // Texture key for diffing (e.g., "building-3-#ff0000-50-10")

  update(gridX: number, gridY: number): void;
  destroy(): void;
}

export interface SceneContainers {
  background: Container;
  tiles: Container;
  licenseGrounds: Container; // License-based ground treatments (behind buildings)
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
  /** Callback when hovering over a package within a monorepo */
  onPackageHover?: (nodeId: string, packageName: string) => void;
  /** Callback when hover ends on a package within a monorepo */
  onPackageHoverEnd?: (nodeId: string, packageName: string) => void;
  /** Callback when clicking on a package within a monorepo */
  onPackageClick?: (nodeId: string, packageName: string) => void;
}

export class IsometricRenderer {
  private viewport: Viewport;
  private atlas: Record<string, Texture>;
  private tileWidth: number;
  private tileHeight: number;
  private gridColor: number;
  private regionColor: number;
  private onPackageHover?: (nodeId: string, packageName: string) => void;
  private onPackageHoverEnd?: (nodeId: string, packageName: string) => void;
  private onPackageClick?: (nodeId: string, packageName: string) => void;

  constructor(config: IsometricRendererConfig) {
    this.viewport = config.viewport;
    this.atlas = config.atlas;
    this.onPackageHover = config.onPackageHover;
    this.onPackageHoverEnd = config.onPackageHoverEnd;
    this.onPackageClick = config.onPackageClick;
    this.tileWidth = config.tileWidth ?? ISO_TILE_WIDTH;
    this.tileHeight = config.tileHeight ?? ISO_TILE_HEIGHT;
    this.gridColor = config.gridColor ?? 0x333333;
    this.regionColor = config.regionColor ?? 0xff6600;
  }

  /**
   * Add a texture to the atlas
   */
  addTexture(key: string, texture: Texture): void {
    this.atlas[key] = texture;
  }

  /**
   * Check if a texture exists in the atlas
   */
  hasTexture(key: string): boolean {
    return key in this.atlas;
  }

  /**
   * Get all texture keys in the atlas
   */
  getTextureKeys(): string[] {
    return Object.keys(this.atlas);
  }

  /**
   * Main rendering method - creates all scene elements
   */
  renderScene(mapData: OverworldMap, showGrid = true): SceneContainers {
    const background = new Container();
    const tiles = new Container();
    const licenseGrounds = new Container();
    const bridges = new Container();
    const paths = new Container();
    const nodes = new Container();

    // Enable sorting for license grounds (z-index based on Y position)
    licenseGrounds.sortableChildren = true;

    // Render grid if enabled
    if (showGrid) {
      const grid = this.renderGrid(
        mapData.width,
        mapData.height,
        mapData.regions
      );
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
      // Add license ground to separate layer (behind buildings)
      if (instance.licenseGround) {
        licenseGrounds.addChild(instance.licenseGround);
      }

      // Add in render order (bottom to top)
      nodes.addChild(instance.highlight); // Background: yellow diamond
      nodes.addChild(instance.sprite); // Middle: building/sprite (with baked decoration)
      if (instance.weathering) {
        nodes.addChild(instance.weathering); // Top: weathering overlay
      }

      // Add license sign after sprite (in front of building)
      if (instance.licenseSign) {
        nodes.addChild(instance.licenseSign);
      }

      // Add owner avatar at bottom corner
      if (instance.ownerAvatar) {
        nodes.addChild(instance.ownerAvatar);
      }

      nodes.addChild(instance.label); // Top: text label
      if (instance.hoverLabel) {
        nodes.addChild(instance.hoverLabel); // Top: hover label for monorepos
      }
    }

    return {
      background,
      tiles,
      licenseGrounds,
      bridges,
      paths,
      nodes,
      spriteInstances,
      pathGraphics,
    };
  }

  /**
   * Render isometric grid with region boundaries
   * Only draws grid cells for existing regions (not the entire world)
   */
  renderGrid(
    gridWidth: number,
    gridHeight: number,
    regions: OverworldMap['regions']
  ): Graphics {
    const grid = new Graphics();

    // Helper to check if a grid coordinate is inside any existing region
    const isInsideRegion = (x: number, y: number): boolean => {
      for (const region of regions) {
        const { x: rx, y: ry, width: rw, height: rh } = region.bounds;
        if (x >= rx && x < rx + rw && y >= ry && y < ry + rh) {
          return true;
        }
      }
      return false;
    };

    // Helper to check if a grid coordinate is on the boundary of an existing region
    const isOnRegionBoundary = (x: number, y: number): boolean => {
      for (const region of regions) {
        const { x: rx, y: ry, width: rw, height: rh } = region.bounds;

        // Check if on left or right edge of this region
        if ((x === rx || x === rx + rw - 1) && y >= ry && y < ry + rh) {
          return true;
        }

        // Check if on top or bottom edge of this region
        if ((y === ry || y === ry + rh - 1) && x >= rx && x < rx + rw) {
          return true;
        }
      }
      return false;
    };

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        // Only draw grid cells that are inside an existing region
        if (!isInsideRegion(x, y)) {
          continue;
        }

        // Convert grid coordinates to isometric screen position
        const screenX = (x - y) * (this.tileWidth / 2);
        const screenY = (x + y) * (this.tileHeight / 2);

        // Determine if this is a region boundary (only for existing regions)
        const isRegionBoundary = isOnRegionBoundary(x, y);

        // Draw isometric diamond tile
        grid.strokeStyle = {
          width: isRegionBoundary ? 2 : 1,
          color: isRegionBoundary ? this.regionColor : this.gridColor,
        };
        grid.beginPath();
        grid.moveTo(screenX, screenY); // Top
        grid.lineTo(
          screenX + this.tileWidth / 2,
          screenY + this.tileHeight / 2
        ); // Right
        grid.lineTo(screenX, screenY + this.tileHeight); // Bottom
        grid.lineTo(
          screenX - this.tileWidth / 2,
          screenY + this.tileHeight / 2
        ); // Left
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
      Math.pow(to.screenX - from.screenX, 2) +
        Math.pow(to.screenY - from.screenY, 2)
    );
    const angle = Math.atan2(
      to.screenY - from.screenY,
      to.screenX - from.screenX
    );

    let currentLength = 0;
    while (currentLength < totalLength) {
      const startX = from.screenX + Math.cos(angle) * currentLength;
      const startY = from.screenY + Math.sin(angle) * currentLength;
      const endX =
        from.screenX +
        Math.cos(angle) * Math.min(currentLength + dashLength, totalLength);
      const endY =
        from.screenY +
        Math.sin(angle) * Math.min(currentLength + dashLength, totalLength);

      graphics.moveTo(startX, startY);
      graphics.lineTo(endX, endY);

      currentLength += dashLength + gapLength;
    }
  }

  /**
   * Render a node with multiple sub-packages as a grouped cluster
   */
  private renderSubdividedNode(node: LocationNode): SpriteInstance {
    const { screenX, screenY } = gridToScreen(node.gridX, node.gridY);
    const sizeMultiplier = node.size || 1.0;

    // Create a container to hold all sub-packages
    const container = new Container();
    container.x = screenX;
    container.y = screenY;

    // Calculate the footprint size in screen space
    const footprintTiles = 4 * sizeMultiplier; // Boundary is 4 × size tiles
    const footprintWidth = (footprintTiles * this.tileWidth) / 2; // Half tile width for screen space
    const footprintHeight = (footprintTiles * this.tileHeight) / 2;

    // Determine arrangement pattern based on package count
    const subCount = node.subdivisions!.length;
    const positions: Array<{ x: number; y: number }> = [];
    const spacing = 0.35; // How much of the footprint to use (35%)

    if (subCount === 2) {
      positions.push(
        { x: -footprintWidth * spacing, y: 0 },
        { x: footprintWidth * spacing, y: 0 }
      );
    } else if (subCount === 3) {
      positions.push(
        {
          x: -footprintWidth * spacing * 0.6,
          y: -footprintHeight * spacing * 0.6,
        },
        {
          x: footprintWidth * spacing * 0.6,
          y: -footprintHeight * spacing * 0.6,
        },
        { x: 0, y: footprintHeight * spacing * 0.8 }
      );
    } else if (subCount === 4) {
      positions.push(
        { x: -footprintWidth * spacing, y: -footprintHeight * spacing },
        { x: footprintWidth * spacing, y: -footprintHeight * spacing },
        { x: -footprintWidth * spacing, y: footprintHeight * spacing },
        { x: footprintWidth * spacing, y: footprintHeight * spacing }
      );
    } else {
      // For larger counts, arrange in compact grid
      const cols = Math.ceil(Math.sqrt(subCount));
      const rows = Math.ceil(subCount / cols);
      for (let i = 0; i < subCount; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const offsetX =
          (col - (cols - 1) / 2) * ((footprintWidth * 2 * spacing) / cols);
        const offsetY =
          (row - (rows - 1) / 2) * ((footprintHeight * 2 * spacing) / rows);
        positions.push({ x: offsetX, y: offsetY });
      }
    }

    // Create hover label for showing currently hovered package (created before loop so handlers can reference it)
    const hoverLabel = new Text({
      text: '',
      style: {
        fontSize: 10,
        fill: 0x88ccff, // Light blue to match hover tint
        fontFamily: 'Arial',
        fontWeight: '500',
      },
      resolution: 2,
    });
    hoverLabel.anchor.set(0.5, 0);
    hoverLabel.visible = false;

    // Render each sub-package
    for (let i = 0; i < node.subdivisions!.length; i++) {
      const sub = node.subdivisions![i];
      const texture = this.atlas[sub.sprite];
      if (!texture) continue;

      const sprite = new Sprite(texture);
      const offset = positions[i] || { x: 0, y: 0 };

      // Scale to fit smaller size
      const padding = 0.7;
      const boundarySize = 4 * sub.size;
      const boundaryWidth = boundarySize * this.tileWidth;
      const boundaryHeight = boundarySize * this.tileHeight;
      const baseScale = Math.min(
        (boundaryWidth * padding) / texture.width,
        (boundaryHeight * padding) / texture.height
      );

      sprite.scale.set(baseScale * 0.5); // Scale down for tighter fit
      sprite.x = offset.x;
      sprite.y = offset.y;
      sprite.anchor.set(0.5, 0.85);

      // Apply aging if present
      if (node.aging && node.aging.colorFade > 0) {
        const fadeAmount = node.aging.colorFade;
        const grayValue = Math.floor((1 - fadeAmount + fadeAmount * 0.6) * 255);
        sprite.tint = (grayValue << 16) | (grayValue << 8) | grayValue;
      }

      // Make sub-sprites interactive for hover/click events
      sprite.eventMode = 'static';
      sprite.cursor = 'pointer';

      // Store original tint for hover effect
      const originalTint = sprite.tint;
      const packageName = sub.name;
      const nodeId = node.id;

      sprite.on('pointerover', () => {
        sprite.tint = 0x88ccff; // Light blue hover
        hoverLabel.text = packageName;
        hoverLabel.visible = true;
        this.onPackageHover?.(nodeId, packageName);
      });

      sprite.on('pointerout', () => {
        sprite.tint = originalTint;
        hoverLabel.visible = false;
        this.onPackageHoverEnd?.(nodeId, packageName);
      });

      sprite.on('pointerdown', () => {
        this.onPackageClick?.(nodeId, packageName);
      });

      container.addChild(sprite);
    }

    // Position decorations at corners of the diamond
    // Stars on the left corner, collaborators on the right corner

    // Add star decoration if node has stars
    if (node.stars && node.stars > 0) {
      const tier = getStarTier(node.stars);
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

        // Position decoration at the left corner of the diamond
        const decorationX = -footprintWidth / 2; // Left side, inside the diamond
        const decorationY = 0; // Left point is at vertical center
        decoration.x = decorationX;
        decoration.y = decorationY;
        decoration.scale.set(1.8);

        container.addChild(decoration);

        // Add star count text
        const countText = new Text({
          text: formatStarCount(node.stars),
          style: {
            fontSize: 10,
            fill: 0xffffff,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 2 },
          },
          resolution: 2,
        });
        countText.x = decorationX;
        countText.y = decorationY + 18;
        countText.anchor.set(0.5, 0);

        container.addChild(countText);
      }
    }

    // Add collaborator decoration if node has collaborators
    if (node.collaborators && node.collaborators > 0) {
      const tier = getCollaboratorTier(node.collaborators);
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

        // Position decoration at the right corner of the diamond
        const decorationX = footprintWidth / 2; // Right side, inside the diamond
        const decorationY = 0; // Right point is at vertical center
        decoration.x = decorationX;
        decoration.y = decorationY;
        decoration.scale.set(1.8);

        container.addChild(decoration);

        // Add collaborator count text
        const countText = new Text({
          text: formatCollaboratorCount(node.collaborators),
          style: {
            fontSize: 10,
            fill: 0xffffff,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 2 },
          },
          resolution: 2,
        });
        countText.x = decorationX;
        countText.y = decorationY + 18;
        countText.anchor.set(0.5, 0);

        container.addChild(countText);
      }
    }

    // Add owner avatar at the bottom corner of the diamond
    if (node.ownerAvatar) {
      try {
        const avatarSize = 24;
        const avatarY = footprintHeight - avatarSize / 2;

        // Create circular background/placeholder
        const background = new Graphics();
        background.circle(0, avatarY, avatarSize / 2);
        background.fill({ color: 0x666666 });
        container.addChild(background);

        // Create circular mask for the avatar
        const mask = new Graphics();
        mask.circle(0, avatarY, avatarSize / 2);
        mask.fill({ color: 0xffffff });
        container.addChild(mask);

        // Load avatar texture and create sprite
        const avatarTexture = Texture.from(node.ownerAvatar);
        if (avatarTexture) {
          const avatar = new Sprite(avatarTexture);
          avatar.anchor.set(0.5, 0.5);
          avatar.x = 0;
          avatar.y = avatarY;
          avatar.mask = mask;

          // Set size - use scale to ensure proper sizing regardless of texture state
          const updateSize = () => {
            const w = avatarTexture.width;
            const h = avatarTexture.height;
            if (w > 0 && h > 0) {
              avatar.scale.set(avatarSize / w, avatarSize / h);
            }
          };
          updateSize();
          if (avatarTexture.source) {
            avatarTexture.source.on('update', updateSize);
          }

          container.addChild(avatar);
        }
      } catch {
        // Failed to load avatar, placeholder will remain
      }
    }

    // Create highlight boundary (for the entire group)
    const highlight = this.createHighlight(
      node.gridX,
      node.gridY,
      sizeMultiplier
    );
    highlight.visible = false;
    highlight.zIndex = getIsometricZIndex(node.gridX, node.gridY);

    // Create main repository label (centered below all packages)
    const label = new Text({
      text: node.label,
      style: {
        fontSize: 11,
        fill: 0xaaaaaa, // Lighter gray to distinguish from package labels
        fontFamily: 'Arial',
        fontWeight: '500',
        fontStyle: 'italic',
      },
      resolution: 2,
    });
    label.x = screenX;
    label.y = screenY + footprintHeight * 0.6 + 12;
    label.anchor.set(0.5, 0);
    label.zIndex = highlight.zIndex + 0.2;

    // Position hover label below the main label
    hoverLabel.x = screenX;
    hoverLabel.y = label.y + 14; // Below the main label
    hoverLabel.zIndex = label.zIndex + 0.1;

    // Set z-index for the container
    container.zIndex = highlight.zIndex;

    // Create weathering if needed
    let weathering: Graphics | undefined;
    if (node.aging && node.aging.weatheringLevel > 0.3) {
      weathering = this.createWeathering(
        screenX,
        screenY,
        80,
        80,
        node.aging.weatheringLevel
      );
      weathering.zIndex = container.zIndex + 0.1;
    }

    // Create license ground and sign if node has license info
    let licenseGround: Graphics | Container | undefined;
    let licenseSign: Container | undefined;

    if (node.license) {
      const licenseType = node.license as LicenseType;
      const footprint = calculateFootprint(sizeMultiplier);

      // Create ground treatment (grass, cobblestone, fence)
      licenseGround = generateLicenseGround(licenseType, sizeMultiplier);
      licenseGround.x = screenX;
      licenseGround.y = screenY;
      licenseGround.zIndex = screenY; // Sort by Y for proper overlap

      // Create license sign/archway (positioned at front of diamond)
      licenseSign = generateLicenseSign(licenseType, {
        name: node.label,
        sizeMultiplier,
      });
      licenseSign.x = screenX;
      licenseSign.y = screenY + footprint.height * 0.75; // Front edge of diamond
      licenseSign.zIndex = container.zIndex + 0.15; // In front of building, behind label

      // Hide the label since the license sign already shows the name
      label.visible = false;
    }

    // Create sprite instance
    const instance: SpriteInstance = {
      sprite: container as unknown as Sprite, // Container acts as the sprite
      highlight,
      label,
      hoverLabel,
      weathering,
      licenseGround,
      licenseSign,
      gridPosition: { gridX: node.gridX, gridY: node.gridY },
      size: sizeMultiplier,
      spriteKey: node.sprite, // Store for diffing - allows detecting visual changes
      update: (gridX: number, gridY: number) => {
        const pos = gridToScreen(gridX, gridY);
        container.x = pos.screenX;
        container.y = pos.screenY;
        label.x = pos.screenX;
        label.y = pos.screenY + footprintHeight * 0.6 + 12;
        hoverLabel.x = pos.screenX;
        hoverLabel.y = label.y + 14;

        // Update highlight
        highlight.clear();
        const hoverSize = 4 * sizeMultiplier;
        const tileWidth = hoverSize * this.tileWidth;
        const tileHeight = hoverSize * this.tileHeight;

        highlight.strokeStyle = { width: 3, color: 0xffff00 };
        highlight.fillStyle = { color: 0xffff00, alpha: 0.1 };
        highlight.beginPath();
        highlight.moveTo(pos.screenX, pos.screenY - tileHeight / 2);
        highlight.lineTo(pos.screenX + tileWidth / 2, pos.screenY);
        highlight.lineTo(pos.screenX, pos.screenY + tileHeight / 2);
        highlight.lineTo(pos.screenX - tileWidth / 2, pos.screenY);
        highlight.closePath();
        highlight.fill();
        highlight.stroke();

        if (weathering) {
          weathering.x = pos.screenX;
          weathering.y = pos.screenY;
        }

        // Update license ground and sign positions
        if (licenseGround) {
          licenseGround.x = pos.screenX;
          licenseGround.y = pos.screenY;
          licenseGround.zIndex = pos.screenY;
        }
        if (licenseSign) {
          const footprint = calculateFootprint(sizeMultiplier);
          licenseSign.x = pos.screenX;
          licenseSign.y = pos.screenY + footprint.height * 0.75;
          licenseSign.zIndex = getIsometricZIndex(gridX, gridY) + 0.15;
        }

        instance.gridPosition = { gridX, gridY };
      },
      destroy: () => {
        container.destroy({ children: true });
        highlight.destroy();
        label.destroy();
        hoverLabel.destroy();
        weathering?.destroy();
        licenseGround?.destroy();
        licenseSign?.destroy();
      },
    };

    return instance;
  }

  /**
   * Render sprites with scaling, aging, and weathering effects
   * Extracted from OverworldMapPanel.tsx lines 457-507
   */
  renderSprites(nodes: LocationNode[]): Map<string, SpriteInstance> {
    const spriteInstances = new Map<string, SpriteInstance>();

    for (const node of nodes) {
      // Check if this node has subdivisions (multiple packages)
      if (node.subdivisions && node.subdivisions.length > 1) {
        const instance = this.renderSubdividedNode(node);
        spriteInstances.set(node.id, instance);
        continue;
      }

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
      const highlight = this.createHighlight(
        node.gridX,
        node.gridY,
        sizeMultiplier
      );
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

      // Create license ground and sign if node has license info
      let licenseGround: Graphics | Container | undefined;
      let licenseSign: Container | undefined;

      if (node.license) {
        const licenseType = node.license as LicenseType;
        const footprint = calculateFootprint(sizeMultiplier);

        // Create ground treatment (grass, cobblestone, fence)
        licenseGround = generateLicenseGround(licenseType, sizeMultiplier);
        licenseGround.x = screenX;
        licenseGround.y = screenY;
        licenseGround.zIndex = screenY; // Sort by Y for proper overlap

        // Create license sign/archway (positioned at front of diamond)
        licenseSign = generateLicenseSign(licenseType, {
          name: node.label,
          sizeMultiplier,
        });
        licenseSign.x = screenX;
        licenseSign.y = screenY + footprint.height * 0.75; // Front edge of diamond
        licenseSign.zIndex = sprite.zIndex + 0.15; // In front of building, behind label

        // Hide the label since the license sign already shows the name
        label.visible = false;
      }

      // Create owner avatar at the bottom corner of the diamond
      let ownerAvatar: Container | undefined;
      if (node.ownerAvatar) {
        try {
          const footprint = calculateFootprint(sizeMultiplier);
          const avatarSize = 24;
          ownerAvatar = new Container();

          // Create circular background/placeholder
          const background = new Graphics();
          background.circle(0, 0, avatarSize / 2);
          background.fill({ color: 0x666666 });
          ownerAvatar.addChild(background);

          // Create circular mask for the avatar
          const mask = new Graphics();
          mask.circle(0, 0, avatarSize / 2);
          mask.fill({ color: 0xffffff });
          ownerAvatar.addChild(mask);

          // Load avatar texture and create sprite
          const avatarTexture = Texture.from(node.ownerAvatar);
          if (avatarTexture) {
            const avatar = new Sprite(avatarTexture);
            avatar.anchor.set(0.5, 0.5);
            avatar.mask = mask;

            // Set size - use scale to ensure proper sizing regardless of texture state
            const updateSize = () => {
              const w = avatarTexture.width;
              const h = avatarTexture.height;
              if (w > 0 && h > 0) {
                avatar.scale.set(avatarSize / w, avatarSize / h);
              }
            };
            updateSize();
            if (avatarTexture.source) {
              avatarTexture.source.on('update', updateSize);
            }

            ownerAvatar.addChild(avatar);
          }

          // Position at bottom corner of the diamond
          ownerAvatar.x = screenX;
          ownerAvatar.y = screenY + footprint.height - avatarSize / 2;
          ownerAvatar.zIndex = sprite.zIndex + 0.12;
        } catch {
          // Failed to load avatar, skip
          ownerAvatar = undefined;
        }
      }

      // Create sprite instance
      const instance: SpriteInstance = {
        sprite,
        highlight,
        label,
        weathering,
        licenseGround,
        licenseSign,
        ownerAvatar,
        gridPosition: { gridX: node.gridX, gridY: node.gridY },
        size: sizeMultiplier,
        spriteKey: node.sprite, // Store for diffing - allows detecting visual changes
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

          // Update license ground and sign positions
          if (licenseGround) {
            licenseGround.x = pos.screenX;
            licenseGround.y = pos.screenY;
            licenseGround.zIndex = pos.screenY;
          }
          if (licenseSign) {
            const footprint = calculateFootprint(sizeMultiplier);
            licenseSign.x = pos.screenX;
            licenseSign.y = pos.screenY + footprint.height * 0.75;
            licenseSign.zIndex = getIsometricZIndex(gridX, gridY) + 0.15;
          }
          if (ownerAvatar) {
            const footprint = calculateFootprint(sizeMultiplier);
            ownerAvatar.x = pos.screenX;
            ownerAvatar.y = pos.screenY + footprint.height - 12;
            ownerAvatar.zIndex = getIsometricZIndex(gridX, gridY) + 0.12;
          }

          instance.gridPosition = { gridX, gridY };
        },
        destroy: () => {
          sprite.destroy();
          highlight.destroy();
          label.destroy();
          weathering?.destroy();
          licenseGround?.destroy();
          licenseSign?.destroy();
          ownerAvatar?.destroy();
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
  private createHighlight(
    gridX: number,
    gridY: number,
    sizeMultiplier: number
  ): Graphics {
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
  updatePath(
    pathGraphics: Graphics,
    fromPos: GridPoint,
    toPos: GridPoint
  ): void {
    pathGraphics.clear();
    this.drawPath(pathGraphics, fromPos, toPos, false);
  }

  /**
   * Update sprite position
   */
  updateSpritePosition(
    instance: SpriteInstance,
    gridX: number,
    gridY: number
  ): void {
    instance.update(gridX, gridY);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Renderer doesn't own the atlas or viewport, so no cleanup needed
  }
}
