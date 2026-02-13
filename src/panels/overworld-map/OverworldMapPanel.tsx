/**
 * OverworldMapPanel - 8-bit Mario-style overworld map for package dependencies
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Application, Container, Graphics, Sprite, Text, Texture, TilingSprite } from 'pixi.js';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PackageLayer } from '../../types/composition';
import type { PackagesSliceData } from '../../types/dependencies';
import type { PanelComponentProps } from '../../types';
import type { OverworldMap } from './types';
import { packagesToUnifiedOverworldMap } from './dataConverter';
import { generateSpriteAtlas } from './spriteGenerator';
import { gridToScreen, screenToGrid, getIsometricZIndex, ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from './isometricUtils';
import type { RegionLayout } from './genericMapper';

export interface OverworldMapPanelProps {
  /** Package data from the repository */
  packages: PackageLayer[];

  /** Include dev dependencies in the map */
  includeDevDependencies?: boolean;

  /** Include peer dependencies in the map */
  includePeerDependencies?: boolean;

  /** Region layout configuration for multi-region maps */
  regionLayout?: RegionLayout;

  /** Panel width */
  width?: number;

  /** Panel height */
  height?: number;

  /** Loading state */
  isLoading?: boolean;
}

/**
 * OverworldMapPanelContent Component
 * Renders package dependencies as an 8-bit isometric overworld map
 */
export const OverworldMapPanelContent: React.FC<OverworldMapPanelProps> = ({
  packages,
  includeDevDependencies = true,
  includePeerDependencies = false,
  regionLayout,
  width,
  height,
  isLoading = false,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldContainerRef = useRef<Container | null>(null);
  const scaleRef = useRef<number>(1);
  const [isRendering, setIsRendering] = useState(true);
  const dimensionsRef = useRef({ width: width || 800, height: height || 600 });

  // Region navigation state
  const [currentRegionIndex, setCurrentRegionIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<{ startTime: number; startX: number; startY: number; targetX: number; targetY: number } | null>(null);
  const hasInitializedCamera = useRef(false);
  const skipNextAnimation = useRef(false); // Skip animation when region changes from dragging

  // Convert packages to unified overworld map
  const mapData = useMemo<OverworldMap>(() => {
    return packagesToUnifiedOverworldMap(packages, {
      includeDevDependencies,
      includePeerDependencies,
      regionLayout,
    });
  }, [packages, includeDevDependencies, includePeerDependencies, regionLayout]);

  // Get current region
  const currentRegion = mapData.regions[currentRegionIndex] || mapData.regions[0];

  // Initialize PixiJS and render the map
  useEffect(() => {
    if (!canvasRef.current) return;

    let app: Application;
    let cleanup = false;

    const initPixi = async () => {
      // Get initial dimensions from container
      const containerWidth = canvasRef.current?.clientWidth || width || 800;
      const containerHeight = canvasRef.current?.clientHeight || height || 600;
      dimensionsRef.current = { width: containerWidth, height: containerHeight };

      // Create PixiJS application
      app = new Application();
      await app.init({
        width: containerWidth,
        height: containerHeight,
        backgroundColor: 0x3d5a27, // Dark grass green (matches background texture)
        antialias: false, // Pixel-perfect rendering
      });

      if (cleanup) {
        app.destroy(true);
        return;
      }

      // Add canvas to DOM
      canvasRef.current?.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      // Generate sprite atlas
      const atlas = generateSpriteAtlas();

      // Convert canvas sprites to PixiJS textures
      const textures: Record<string, Texture> = {};
      for (const [key, canvas] of Object.entries(atlas)) {
        textures[key] = Texture.from(canvas);
      }

      // Create main container for the world
      const worldContainer = new Container();
      app.stage.addChild(worldContainer);
      worldContainerRef.current = worldContainer;

      // Add tiling grass background
      const bgTexture = textures['bg-grass'];
      if (bgTexture) {
        const backgroundTiling = new TilingSprite({
          texture: bgTexture,
          width: mapData.width * ISO_TILE_WIDTH * 2, // Make background larger than map
          height: mapData.height * ISO_TILE_HEIGHT * 2,
        });
        // Center the background
        backgroundTiling.x = -(mapData.width * ISO_TILE_WIDTH * 2) / 4;
        backgroundTiling.y = -(mapData.height * ISO_TILE_HEIGHT * 2) / 4;
        worldContainer.addChild(backgroundTiling);
      }

      // Function to detect which region is currently in view
      const updateCurrentRegion = () => {
        if (mapData.regions.length <= 1) return;

        // Calculate viewport center in screen space
        const viewportCenterX = dimensionsRef.current.width / 2;
        const viewportCenterY = dimensionsRef.current.height / 2;

        // Convert to world coordinates (subtract world container offset)
        const worldX = viewportCenterX - worldContainer.x;
        const worldY = viewportCenterY - worldContainer.y;

        // Convert to grid coordinates
        const gridPos = screenToGrid(worldX, worldY);

        // Find which region contains this grid position
        for (let i = 0; i < mapData.regions.length; i++) {
          const region = mapData.regions[i];
          const { x, y, width, height } = region.bounds;

          // Check if grid position is within region bounds
          if (
            gridPos.gridX >= x &&
            gridPos.gridX < x + width &&
            gridPos.gridY >= y &&
            gridPos.gridY < y + height
          ) {
            if (currentRegionIndex !== i) {
              // Skip animation for region changes from dragging
              skipNextAnimation.current = true;
              setCurrentRegionIndex(i);
            }
            return;
          }
        }
      };

      // Add drag-to-pan functionality
      let isDragging = false;
      let dragStart = { x: 0, y: 0 };
      let worldStart = { x: 0, y: 0 };

      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;
      app.stage.cursor = 'grab';

      app.stage.on('pointerdown', (event) => {
        isDragging = true;
        dragStart = { x: event.globalX, y: event.globalY };
        worldStart = { x: worldContainer.x, y: worldContainer.y };
        app.stage.cursor = 'grabbing';
      });

      app.stage.on('pointermove', (event) => {
        if (isDragging) {
          const dx = event.globalX - dragStart.x;
          const dy = event.globalY - dragStart.y;
          worldContainer.x = worldStart.x + dx;
          worldContainer.y = worldStart.y + dy;

          // Update current region based on viewport position
          updateCurrentRegion();
        }
      });

      app.stage.on('pointerup', () => {
        isDragging = false;
        app.stage.cursor = 'default';
      });

      app.stage.on('pointerupoutside', () => {
        isDragging = false;
        app.stage.cursor = 'default';
      });

      // Render terrain tiles
      const tileContainer = new Container();
      worldContainer.addChild(tileContainer);

      for (const tile of mapData.tiles) {
        const { screenX, screenY } = gridToScreen(tile.x, tile.y);
        const spriteKey = `tile-grass-${tile.biome}`;
        const texture = textures[spriteKey] || textures['tile-grass-grass'];

        if (texture) {
          const sprite = new Sprite(texture);
          sprite.x = screenX;
          sprite.y = screenY;
          sprite.anchor.set(0.5, 0.5);
          tileContainer.addChild(sprite);
        }
      }

      // Render bridge sprites on top of water tiles
      const bridgeContainer = new Container();
      worldContainer.addChild(bridgeContainer);

      for (const tile of mapData.tiles) {
        // Only render bridges on water tiles
        if (tile.type === 'water') {
          const { screenX, screenY } = gridToScreen(tile.x, tile.y);
          const bridgeTexture = textures['tile-bridge'];

          if (bridgeTexture) {
            const bridgeSprite = new Sprite(bridgeTexture);
            bridgeSprite.x = screenX;
            bridgeSprite.y = screenY;
            bridgeSprite.anchor.set(0.5, 0.5);
            bridgeContainer.addChild(bridgeSprite);
          }
        }
      }

      // Render paths
      const pathContainer = new Container();
      worldContainer.addChild(pathContainer);

      // Store path graphics for dynamic updates
      const pathGraphics: Array<{ path: typeof mapData.paths[0]; graphics: Graphics }> = [];

      // Function to redraw all paths based on current node positions
      const redrawPaths = () => {
        for (const { path, graphics } of pathGraphics) {
          // Find source and target nodes by ID
          const fromNode = mapData.nodes.find((n) => n.id === path.from);
          const toNode = mapData.nodes.find((n) => n.id === path.to);

          if (!fromNode || !toNode) continue;

          // Clear previous drawing
          graphics.clear();

          // Get screen positions
          const fromScreen = gridToScreen(fromNode.gridX, fromNode.gridY);
          const toScreen = gridToScreen(toNode.gridX, toNode.gridY);

          // Road styling based on dependency type
          const isDev = path.type === 'dev-dependency';
          const roadWidth = isDev ? 8 : 12; // Dev dependencies are narrower roads
          const borderWidth = roadWidth + 4; // Border is 2px wider on each side

          // Colors: dev dependencies are gray dirt roads, regular are tan paved roads
          const roadColor = isDev ? 0x8b7355 : 0xd2b48c; // Gray-brown vs tan
          const borderColor = isDev ? 0x5c4a3a : 0x8b6f47; // Darker borders
          const alpha = isDev ? 0.7 : 1.0;

          // Draw road border (wider, darker)
          graphics.setStrokeStyle({
            width: borderWidth,
            color: borderColor,
            alpha: alpha,
          });
          graphics.moveTo(fromScreen.screenX, fromScreen.screenY);
          graphics.lineTo(toScreen.screenX, toScreen.screenY);
          graphics.stroke();

          // Draw road surface (thinner, lighter) on top
          graphics.setStrokeStyle({
            width: roadWidth,
            color: roadColor,
            alpha: alpha,
          });
          graphics.moveTo(fromScreen.screenX, fromScreen.screenY);
          graphics.lineTo(toScreen.screenX, toScreen.screenY);
          graphics.stroke();

          // Add subtle directional arrows to show one-way flow
          const dx = toScreen.screenX - fromScreen.screenX;
          const dy = toScreen.screenY - fromScreen.screenY;
          const length = Math.sqrt(dx * dx + dy * dy);

          // Calculate angle of the road
          const angle = Math.atan2(dy, dx);

          // Subtle arrow styling - fewer, smaller, more transparent
          const arrowSize = isDev ? 5 : 6;
          const arrowSpacing = 60; // More space between arrows
          const numArrows = Math.max(1, Math.floor(length / arrowSpacing));

          graphics.setFillStyle({
            color: isDev ? 0x6b5d52 : 0xa08968, // Lighter colors
            alpha: isDev ? 0.4 : 0.5, // More transparent
          });

          // Draw arrows along the road pointing from source to target
          for (let i = 1; i <= numArrows; i++) {
            const t = i / (numArrows + 1); // Distribute arrows evenly
            const x = fromScreen.screenX + dx * t;
            const y = fromScreen.screenY + dy * t;

            // Draw small arrow chevron pointing in the direction of flow
            const x1 = x + Math.cos(angle) * arrowSize;
            const y1 = y + Math.sin(angle) * arrowSize;
            const x2 = x + Math.cos(angle + Math.PI * 2.5 / 3) * arrowSize;
            const y2 = y + Math.sin(angle + Math.PI * 2.5 / 3) * arrowSize;
            const x3 = x + Math.cos(angle - Math.PI * 2.5 / 3) * arrowSize;
            const y3 = y + Math.sin(angle - Math.PI * 2.5 / 3) * arrowSize;

            graphics.moveTo(x1, y1);
            graphics.lineTo(x2, y2);
            graphics.lineTo(x3, y3);
            graphics.lineTo(x1, y1);
            graphics.fill();
          }

          // Add dashed center line for regular dependencies (like highways)
          if (!isDev) {
            const dashLength = 8;
            const gapLength = 8;
            const segmentLength = dashLength + gapLength;
            const numSegments = Math.floor(length / segmentLength);

            graphics.setStrokeStyle({
              width: 2,
              color: 0xffffff,
              alpha: 0.4,
            });

            for (let i = 0; i < numSegments; i++) {
              const t1 = (i * segmentLength) / length;
              const t2 = (i * segmentLength + dashLength) / length;

              const x1 = fromScreen.screenX + dx * t1;
              const y1 = fromScreen.screenY + dy * t1;
              const x2 = fromScreen.screenX + dx * t2;
              const y2 = fromScreen.screenY + dy * t2;

              graphics.moveTo(x1, y1);
              graphics.lineTo(x2, y2);
              graphics.stroke();
            }
          }
        }
      };

      // Initialize path graphics
      for (const path of mapData.paths) {
        const graphics = new Graphics();
        pathGraphics.push({ path, graphics });
        pathContainer.addChild(graphics);
      }

      // Draw paths initially
      redrawPaths();

      // Render location nodes
      const nodeContainer = new Container();
      worldContainer.addChild(nodeContainer);

      // Store highlights and positions for intersection detection
      const buildingData: Array<{
        node: typeof mapData.nodes[0];
        sprite: Sprite;
        highlight: Graphics;
        label: Text;
      }> = [];

      // Sort nodes by z-index for proper isometric rendering
      const sortedNodes = [...mapData.nodes].sort((a, b) => {
        const zA = getIsometricZIndex(a.gridX, a.gridY);
        const zB = getIsometricZIndex(b.gridX, b.gridY);
        return zA - zB;
      });

      for (const node of sortedNodes) {
        const { screenX, screenY } = gridToScreen(node.gridX, node.gridY);
        const texture = textures[node.sprite];

        if (texture) {
          // Create highlight for hover - always 4x4 tiles (2x the 2x2 footprint)
          const highlight = new Graphics();
          const HOVER_SIZE = 4; // Hover highlight is 4x4 (double the 2x2 footprint)
          const tileSize = ISO_TILE_WIDTH * HOVER_SIZE; // 64 * 4 = 256px
          const tileHeight = ISO_TILE_HEIGHT * HOVER_SIZE; // 32 * 4 = 128px

          // Draw diamond shape centered at (0,0)
          highlight.beginFill(0xffff00, 0.4); // Yellow with transparency (default)
          highlight.moveTo(0, -tileHeight / 2);
          highlight.lineTo(tileSize / 2, 0);
          highlight.lineTo(0, tileHeight / 2);
          highlight.lineTo(-tileSize / 2, 0);
          highlight.closePath();
          highlight.endFill();

          // Store original tint
          (highlight as any).isIntersecting = false;

          // Position highlight centered on sprite - no base diamond to worry about
          highlight.x = screenX;
          highlight.y = screenY;
          highlight.visible = false; // Hidden by default
          nodeContainer.addChild(highlight);

          const sprite = new Sprite(texture);

          // Scale down if sprite is too large (max 256x256)
          const MAX_SPRITE_SIZE = 256;
          if (sprite.width > MAX_SPRITE_SIZE || sprite.height > MAX_SPRITE_SIZE) {
            const scaleX = MAX_SPRITE_SIZE / sprite.width;
            const scaleY = MAX_SPRITE_SIZE / sprite.height;
            const scale = Math.min(scaleX, scaleY); // Preserve aspect ratio
            sprite.scale.set(scale, scale);
          }

          sprite.x = screenX;
          sprite.y = screenY;
          // Anchor adjusted to match visual center
          // X: isometric side shifts building right → 0.61
          // Y: leave space below for label → 0.45
          sprite.anchor.set(0.61, 0.45);

          // Make interactive and draggable
          sprite.eventMode = 'static';
          sprite.cursor = 'grab';

          let isDraggingBuilding = false;
          let dragOffset = { x: 0, y: 0 };

          sprite.on('pointerdown', (event) => {
            isDraggingBuilding = true;
            sprite.cursor = 'grabbing';

            // Calculate offset from sprite position to pointer
            const globalPos = event.global;
            const localPos = worldContainer.toLocal(globalPos);
            dragOffset = {
              x: localPos.x - sprite.x,
              y: localPos.y - sprite.y,
            };

            // Stop event propagation to prevent map panning
            event.stopPropagation();
          });

          sprite.on('pointerup', (event) => {
            if (isDraggingBuilding) {
              isDraggingBuilding = false;
              sprite.cursor = 'grab';

              // Convert screen position back to grid coordinates
              const { gridX, gridY } = screenToGrid(sprite.x, sprite.y);

              // Snap to nearest grid position
              const snappedGridX = Math.round(gridX);
              const snappedGridY = Math.round(gridY);
              const snapped = gridToScreen(snappedGridX, snappedGridY);

              // Update sprite, highlight, and label to snapped position
              sprite.x = snapped.screenX;
              sprite.y = snapped.screenY;
              highlight.x = sprite.x;
              highlight.y = sprite.y;
              label.x = sprite.x;
              label.y = sprite.y + labelOffset;

              // Update node data
              node.gridX = snappedGridX;
              node.gridY = snappedGridY;

              // Redraw all paths with updated positions
              redrawPaths();

              // Hide all intersection highlights and reset tint
              for (const other of buildingData) {
                if (other !== currentBuildingData) {
                  other.highlight.visible = false;
                  other.highlight.tint = 0xffffff; // Reset to default yellow
                  (other.highlight as any).isIntersecting = false;
                }
              }

              // Log the moved building position for debugging
              // console.log(`Moved ${node.label} to grid (${snappedGridX}, ${snappedGridY})`);

              event.stopPropagation();
            }
          });

          sprite.on('pointerupoutside', () => {
            if (isDraggingBuilding) {
              isDraggingBuilding = false;
              sprite.cursor = 'grab';

              // Hide all intersection highlights and reset tint
              for (const other of buildingData) {
                if (other !== currentBuildingData) {
                  other.highlight.visible = false;
                  other.highlight.tint = 0xffffff; // Reset to default yellow
                  (other.highlight as any).isIntersecting = false;
                }
              }
            }
          });

          sprite.on('pointerover', () => {
            if (!isDraggingBuilding) {
              highlight.visible = true; // Show base highlight
              highlight.tint = 0xffffff; // Yellow (default)
            }
          });

          sprite.on('pointerout', () => {
            if (!(highlight as any).isIntersecting) {
              highlight.visible = false; // Hide base highlight
            }
          });

          nodeContainer.addChild(sprite);

          // Add label text just below the base center
          const labelOffset = 25;

          const label = new Text({
            text: node.label,
            style: {
              fontFamily: 'monospace',
              fontSize: 16,
              fill: 0xffffff,
              stroke: { color: 0x000000, width: 4 },
              fontWeight: 'bold',
            },
          });
          label.x = screenX;
          label.y = screenY + labelOffset;
          label.anchor.set(0.5, 0);
          nodeContainer.addChild(label);

          // Store building data for intersection detection
          const currentBuildingData = { node, sprite, highlight, label };
          buildingData.push(currentBuildingData);

          // Now add pointermove handler with access to label
          sprite.on('pointermove', (event) => {
            if (isDraggingBuilding) {
              const globalPos = event.global;
              const localPos = worldContainer.toLocal(globalPos);

              // Update sprite position
              sprite.x = localPos.x - dragOffset.x;
              sprite.y = localPos.y - dragOffset.y;

              // Update highlight and label positions
              highlight.x = sprite.x;
              highlight.y = sprite.y;
              label.x = sprite.x;
              label.y = sprite.y + labelOffset;

              // Update node position temporarily for path rendering
              const { gridX: tempGridX, gridY: tempGridY } = screenToGrid(sprite.x, sprite.y);
              node.gridX = tempGridX;
              node.gridY = tempGridY;

              // Redraw paths in real-time while dragging
              redrawPaths();

              // Check for intersections with other buildings
              const HIGHLIGHT_RADIUS = (ISO_TILE_WIDTH * HOVER_SIZE) / 2; // Half the highlight width (128px)
              const INTERSECTION_THRESHOLD = HIGHLIGHT_RADIUS * 2; // Both radii combined (256px)

              for (const other of buildingData) {
                if (other === currentBuildingData) continue;

                // Calculate distance between dragged building and other building
                const dx = sprite.x - other.sprite.x;
                const dy = sprite.y - other.sprite.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Show highlight if highlights are intersecting (distance < sum of both radii)
                if (distance < INTERSECTION_THRESHOLD) {
                  other.highlight.visible = true;
                  // Tint red for intersection warning
                  other.highlight.tint = 0xff6b6b; // Red
                  (other.highlight as any).isIntersecting = true;
                } else if (!(other.highlight as any).isIntersecting) {
                  // Only hide if not being hovered by mouse
                  other.highlight.visible = false;
                }
              }

              event.stopPropagation();
            }
          });
        }
      }

      // Function to calculate and update scale based on container dimensions
      const updateScale = () => {
        // Find the largest region dimensions in screen space
        let maxRegionWidth = 0;
        let maxRegionHeight = 0;

        for (const region of mapData.regions) {
          const topLeft = gridToScreen(region.bounds.x, region.bounds.y);
          const bottomRight = gridToScreen(
            region.bounds.x + region.bounds.width,
            region.bounds.y + region.bounds.height
          );
          const regionWidth = Math.abs(bottomRight.screenX - topLeft.screenX);
          const regionHeight = Math.abs(bottomRight.screenY - topLeft.screenY);

          maxRegionWidth = Math.max(maxRegionWidth, regionWidth);
          maxRegionHeight = Math.max(maxRegionHeight, regionHeight);
        }

        const padding = 40;
        const availableWidth = dimensionsRef.current.width - padding * 2;
        const availableHeight = dimensionsRef.current.height - padding * 2;

        const scaleX = availableWidth / maxRegionWidth;
        const scaleY = availableHeight / maxRegionHeight;
        const scale = Math.min(scaleX, scaleY, 1.0);

        worldContainer.scale.set(scale, scale);
        scaleRef.current = scale;
      };

      // Calculate initial scale
      updateScale();

      // Animation ticker for smooth camera movement
      const easeOutCubic = (t: number): number => {
        return 1 - Math.pow(1 - t, 3);
      };

      const animationDuration = 800;
      app.ticker.add(() => {
        if (!animationRef.current) return;

        const elapsed = performance.now() - animationRef.current.startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        const eased = easeOutCubic(progress);

        worldContainer.x = animationRef.current.startX + (animationRef.current.targetX - animationRef.current.startX) * eased;
        worldContainer.y = animationRef.current.startY + (animationRef.current.targetY - animationRef.current.startY) * eased;

        if (progress >= 1) {
          animationRef.current = null;
          setIsAnimating(false);
        }
      });

      setIsRendering(false);
    };

    let resizeObserver: ResizeObserver | null = null;

    const initAndSetupResize = async () => {
      await initPixi();
      // Store reference to resize observer for cleanup
      if (canvasRef.current && appRef.current) {
        resizeObserver = new ResizeObserver((entries) => {
          if (!appRef.current || !worldContainerRef.current) return;

          for (const entry of entries) {
            const { width: newWidth, height: newHeight } = entry.contentRect;

            // Update dimensions ref
            dimensionsRef.current = { width: newWidth, height: newHeight };

            // Resize the PixiJS renderer
            appRef.current.renderer.resize(newWidth, newHeight);

            // Recalculate scale for the new dimensions
            const worldContainer = worldContainerRef.current;

            // Find the largest region dimensions in screen space
            let maxRegionWidth = 0;
            let maxRegionHeight = 0;

            for (const region of mapData.regions) {
              const topLeft = gridToScreen(region.bounds.x, region.bounds.y);
              const bottomRight = gridToScreen(
                region.bounds.x + region.bounds.width,
                region.bounds.y + region.bounds.height
              );
              const regionWidth = Math.abs(bottomRight.screenX - topLeft.screenX);
              const regionHeight = Math.abs(bottomRight.screenY - topLeft.screenY);

              maxRegionWidth = Math.max(maxRegionWidth, regionWidth);
              maxRegionHeight = Math.max(maxRegionHeight, regionHeight);
            }

            const padding = 40;
            const availableWidth = dimensionsRef.current.width - padding * 2;
            const availableHeight = dimensionsRef.current.height - padding * 2;

            const scaleX = availableWidth / maxRegionWidth;
            const scaleY = availableHeight / maxRegionHeight;
            const scale = Math.min(scaleX, scaleY, 1.0);

            worldContainer.scale.set(scale, scale);
            scaleRef.current = scale;

            // Update hit area for the new size
            appRef.current.stage.hitArea = appRef.current.screen;
          }
        });

        resizeObserver.observe(canvasRef.current);
      }
    };

    initAndSetupResize();

    return () => {
      cleanup = true;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
      worldContainerRef.current = null;
      animationRef.current = null;
    };
  }, [mapData]);

  // Handle region changes with animation
  useEffect(() => {
    if (!worldContainerRef.current || !currentRegion || isRendering) return;

    const regionCenter = gridToScreen(currentRegion.centerX, currentRegion.centerY);
    const worldContainer = worldContainerRef.current;
    const scale = scaleRef.current;
    const targetX = dimensionsRef.current.width / 2 - regionCenter.screenX * scale;
    const targetY = dimensionsRef.current.height / 2 - regionCenter.screenY * scale;

    // On initial load, snap to position without animation
    if (!hasInitializedCamera.current) {
      worldContainer.x = targetX;
      worldContainer.y = targetY;
      hasInitializedCamera.current = true;
      return;
    }

    // Skip animation if region change came from dragging
    if (skipNextAnimation.current) {
      skipNextAnimation.current = false;
      return;
    }

    // Subsequent changes: animate smoothly (from arrow button clicks)
    setIsAnimating(true);
    animationRef.current = {
      startTime: performance.now(),
      startX: worldContainer.x,
      startY: worldContainer.y,
      targetX,
      targetY,
    };
  }, [currentRegionIndex, currentRegion, isRendering]);

  if (packages.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          color: '#64748b',
        }}
      >
        No packages found
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {(isLoading || isRendering) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#87ceeb',
            fontFamily: 'monospace',
            color: '#ffffff',
            zIndex: 10,
          }}
        >
          Loading map...
        </div>
      )}

      <div
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          border: '2px solid #1f2937',
          boxSizing: 'border-box',
        }}
      />

      {/* Region navigation - only show if multiple regions */}
      {mapData.regions.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 16px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: 14,
            borderRadius: 6,
            border: '2px solid #fbbf24',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          <button
            onClick={() => !isAnimating && setCurrentRegionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentRegionIndex === 0 || isAnimating}
            style={{
              background: (currentRegionIndex === 0 || isAnimating) ? 'rgba(100, 100, 100, 0.3)' : 'rgba(251, 191, 36, 0.2)',
              border: '1px solid #fbbf24',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: (currentRegionIndex === 0 || isAnimating) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              opacity: (currentRegionIndex === 0 || isAnimating) ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={16} color="#fbbf24" />
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fbbf24' }}>
              {currentRegion.name}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              Region {currentRegionIndex + 1} of {mapData.regions.length} | {currentRegion.nodeIds.length} packages
            </div>
          </div>

          <button
            onClick={() => !isAnimating && setCurrentRegionIndex((prev) => Math.min(mapData.regions.length - 1, prev + 1))}
            disabled={currentRegionIndex === mapData.regions.length - 1 || isAnimating}
            style={{
              background: (currentRegionIndex === mapData.regions.length - 1 || isAnimating) ? 'rgba(100, 100, 100, 0.3)' : 'rgba(251, 191, 36, 0.2)',
              border: '1px solid #fbbf24',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: (currentRegionIndex === mapData.regions.length - 1 || isAnimating) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              opacity: (currentRegionIndex === mapData.regions.length - 1 || isAnimating) ? 0.5 : 1,
            }}
          >
            <ChevronRight size={16} color="#fbbf24" />
          </button>
        </div>
      )}

      {/* Controls hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#94a3b8',
          fontFamily: 'monospace',
          fontSize: 10,
          borderRadius: 4,
          pointerEvents: 'none',
        }}
      >
        <div>Click on packages to view details</div>
      </div>
    </div>
  );
};

/**
 * Preview component for panel selection UI
 */
export const OverworldMapPanelPreview: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#87ceeb',
        fontFamily: 'monospace',
        fontSize: 14,
        color: '#ffffff',
      }}
    >
      8-bit Overworld Map
    </div>
  );
};

/**
 * Main panel component that integrates with the panel framework
 * Extracts packages from context and passes to content component
 */
export const OverworldMapPanel: React.FC<PanelComponentProps> = ({ context }) => {
  // Get packages slice from context
  const packagesSlice = context.getSlice<PackagesSliceData>('packages');

  const packages = packagesSlice?.data?.packages ?? [];
  const isLoading = packagesSlice?.loading || false;

  return (
    <OverworldMapPanelContent
      packages={packages}
      isLoading={isLoading}
      includeDevDependencies={true}
      includePeerDependencies={false}
    />
  );
};
