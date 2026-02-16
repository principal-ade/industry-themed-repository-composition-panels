/**
 * OverworldMapPanel - 8-bit Mario-style overworld map for package dependencies
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Application, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PackageLayer } from '../../types/composition';
import type { PackagesSliceData } from '../../types/dependencies';
import type { PanelComponentProps } from '../../types';
import type { OverworldMap } from './types';
import { packagesToUnifiedOverworldMap } from './dataConverter';
import { generateBuildingSprite } from './components/buildingSpriteGenerator';
import { IsometricRenderer } from './components/IsometricRenderer';
import { IsometricInteractionManager } from './components/IsometricInteractionManager';
import { IsometricPathManager } from './components/IsometricPathManager';
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

  /** Callback when a node is moved (for persisting manual positions) */
  onProjectMoved?: (nodeId: string, gridX: number, gridY: number) => void;

  /** Whether regions are being edited */
  isEditingRegions?: boolean;

  /** Custom regions defined in collection */
  customRegions?: any[];

  /** Callback to add a new region at a specific grid position */
  onAddRegion?: (position: { row: number; col: number }) => void;

  /** Callback to rename a region */
  onRenameRegion?: (id: string, name: string) => void;

  /** Callback to delete a region */
  onDeleteRegion?: (id: string) => void;

  /** Stable collection identifier - only recreate PIXI when this changes */
  collectionKey?: string;
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
  onProjectMoved,
  isEditingRegions = false,
  customRegions = [],
  onAddRegion,
  onRenameRegion,
  onDeleteRegion,
  collectionKey,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const worldContainerRef = useRef<Container | null>(null);
  const scaleRef = useRef<number>(1);
  const interactionRef = useRef<IsometricInteractionManager | null>(null);
  const pathManagerRef = useRef<IsometricPathManager | null>(null);
  const rendererRef = useRef<IsometricRenderer | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const dimensionsRef = useRef({ width: width || 800, height: height || 600 });
  const placeholdersRef = useRef<Container | null>(null);
  const sceneContainersRef = useRef<{ background: Container; tiles: Container; bridges: Container; paths: Container; nodes: Container } | null>(null);
  const offsetRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });
  const renderPlaceholdersRef = useRef<(() => void) | null>(null);
  const mapDataRef = useRef<OverworldMap | null>(null);
  const isEditingRegionsRef = useRef(isEditingRegions);

  // Region navigation state
  const [currentRegionIndex, setCurrentRegionIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<{ startTime: number; startX: number; startY: number; targetX: number; targetY: number } | null>(null);
  const hasInitializedCamera = useRef(false);
  const skipNextAnimation = useRef(false); // Skip animation when region changes from dragging
  const previousCollectionKeyRef = useRef<string | null>(null);
  const savedCameraPosition = useRef<{ x: number; y: number; scale: number } | null>(null);

  // Create a stable collection key if not provided
  // This prevents full PIXI re-renders when only regions change (not the actual packages)
  const stableCollectionKey = useMemo(() => {
    if (collectionKey) return collectionKey;
    // Fallback: create key from sorted package IDs
    return packages.map(p => p.id).sort().join(',');
  }, [collectionKey, packages]);

  // Convert packages to unified overworld map
  const mapData = useMemo<OverworldMap>(() => {
    const map = packagesToUnifiedOverworldMap(packages, {
      includeDevDependencies,
      includePeerDependencies,
      regionLayout,
      customRegions, // Pass through custom regions for manual layout
    });
    mapDataRef.current = map; // Store for placeholder rendering
    return map;
  }, [packages, includeDevDependencies, includePeerDependencies, regionLayout, customRegions]);

  // Get current region
  const currentRegion = mapData.regions[currentRegionIndex] || mapData.regions[0];

  // Initialize PixiJS and render the map
  useEffect(() => {
    if (!canvasRef.current) return;

    // Check if this is just a region update (not a collection change)
    const isCollectionChange = previousCollectionKeyRef.current !== stableCollectionKey;
    const isRegionOnlyUpdate = !isCollectionChange && previousCollectionKeyRef.current !== null;

    previousCollectionKeyRef.current = stableCollectionKey;

    // If it's only a region update, skip full PIXI recreate
    // We'll update the scene incrementally instead
    if (isRegionOnlyUpdate && viewportRef.current && rendererRef.current) {
      // Re-render the scene with the new mapData
      const renderer = rendererRef.current;
      const viewport = viewportRef.current;

      // Remove old scene
      if (sceneContainersRef.current) {
        viewport.removeChild(sceneContainersRef.current.background);
        viewport.removeChild(sceneContainersRef.current.tiles);
        viewport.removeChild(sceneContainersRef.current.bridges);
        viewport.removeChild(sceneContainersRef.current.paths);
        viewport.removeChild(sceneContainersRef.current.nodes);
      }

      // Render new scene
      const scene = renderer.renderScene(mapData, true);

      // Re-add scene containers
      viewport.addChild(scene.background);
      viewport.addChild(scene.tiles);
      viewport.addChild(scene.bridges);
      viewport.addChild(scene.paths);
      viewport.addChild(scene.nodes);
      scene.nodes.sortableChildren = true;

      sceneContainersRef.current = scene;

      // Re-render placeholders with new regions
      if (renderPlaceholdersRef.current) {
        renderPlaceholdersRef.current();
      }

      return; // Skip full PIXI recreate
    }

    let app: Application;
    let cleanup = false;

    const initPixi = async () => {
      // Save current camera position before destroying
      if (viewportRef.current && hasInitializedCamera.current) {
        savedCameraPosition.current = {
          x: viewportRef.current.center.x,
          y: viewportRef.current.center.y,
          scale: viewportRef.current.scale.x,
        };
      }

      // Get initial dimensions from container
      const containerWidth = canvasRef.current?.clientWidth || width || 800;
      const containerHeight = canvasRef.current?.clientHeight || height || 600;
      dimensionsRef.current = { width: containerWidth, height: containerHeight };

      // Create PixiJS application
      app = new Application();
      await app.init({
        width: containerWidth,
        height: containerHeight,
        backgroundColor: 0x1a1a1a, // Dark gray background (matches LayoutEngineTest)
        antialias: false, // Pixel-perfect rendering
        preserveDrawingBuffer: true, // Prevents flash during resize
      });

      if (cleanup) {
        app.destroy(true);
        return;
      }

      // Add canvas to DOM
      canvasRef.current?.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      // Generate building sprite textures for each unique size+color combination
      const textures: Record<string, Texture> = {};
      const uniqueCombos = new Set<string>();

      for (const node of mapData.nodes) {
        const key = `${node.size.toFixed(2)}-${node.color}`;
        uniqueCombos.add(key);
      }

      // Generate textures for each combination
      for (const combo of uniqueCombos) {
        const [sizeStr, colorHex] = combo.split('-');
        const size = parseFloat(sizeStr);
        const color = parseInt(colorHex.replace('#', ''), 16);

        const buildingGraphics = generateBuildingSprite({ size, color });
        textures[`building-${combo}`] = app.renderer.generateTexture({
          target: buildingGraphics,
          resolution: 2,
        });
        buildingGraphics.destroy();
      }

      // Create viewport for pan/zoom (like LayoutEngineTest)
      const worldWidth = mapData.width * ISO_TILE_WIDTH;
      const worldHeight = mapData.height * ISO_TILE_HEIGHT;

      const viewport = new Viewport({
        screenWidth: containerWidth,
        screenHeight: containerHeight,
        worldWidth,
        worldHeight,
        events: app.renderer.events,
      })
        .drag()
        .pinch()
        .wheel()
        .decelerate();

      app.stage.addChild(viewport);
      viewportRef.current = viewport;
      worldContainerRef.current = viewport; // Viewport is also the world container

      // Render grid with region boundaries using IsometricRenderer (like LayoutEngineTest)
      const renderer = new IsometricRenderer({
        viewport,
        atlas: textures,
        tileWidth: ISO_TILE_WIDTH,
        tileHeight: ISO_TILE_HEIGHT,
        gridColor: 0x333333,
        regionColor: 0xff6600,
      });
      rendererRef.current = renderer; // Store for incremental updates

      // Render scene using IsometricRenderer (like LayoutEngineTest)
      const scene = renderer.renderScene(mapData, true);

      // Add scene containers to viewport (layer order)
      viewport.addChild(scene.background); // Grid
      viewport.addChild(scene.tiles);      // Terrain (empty for now)
      viewport.addChild(scene.bridges);    // Bridges (empty for now)
      viewport.addChild(scene.paths);      // Paths between nodes
      viewport.addChild(scene.nodes);      // Sprites with highlights and labels

      // Enable sorting for proper z-ordering
      scene.nodes.sortableChildren = true;

      // Store scene containers and offset for region editing
      sceneContainersRef.current = scene;
      offsetRef.current = { offsetX: 0, offsetY: 0 }; // Scene containers are already positioned

      // Create placeholders container for region editing
      const placeholdersContainer = new Container();
      viewport.addChild(placeholdersContainer);
      placeholdersRef.current = placeholdersContainer;

      // Function to detect which region is currently in view
      const updateCurrentRegion = () => {
        if (mapData.regions.length <= 1) return;

        // Get viewport center in world coordinates
        const worldPos = viewport.toWorld(
          dimensionsRef.current.width / 2,
          dimensionsRef.current.height / 2
        );

        // Convert to grid coordinates
        const gridPos = screenToGrid(worldPos.x, worldPos.y);

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

      // NOTE: Pan/zoom is handled by pixi-viewport automatically (drag, wheel, pinch plugins)

      // NOTE: Paths and sprites are now rendered by renderer.renderScene() above
      // No need for inline rendering code

      // Create path manager for dynamic path updates during drag
      const pathConnections = Array.from(scene.pathGraphics.entries()).map(([id, graphics]) => {
        // Extract path data from mapData
        const pathData = mapData.paths.find(p => `${p.from}-${p.to}` === id);
        return {
          id,
          fromNodeId: pathData?.from || '',
          toNodeId: pathData?.to || '',
          graphics,
        };
      });

      const nodePositions = new Map(
        mapData.nodes.map(n => [n.id, { gridX: n.gridX, gridY: n.gridY }])
      );

      const pathManager = new IsometricPathManager(pathConnections, nodePositions, renderer);

      // Create interaction manager for drag-and-drop
      const interaction = new IsometricInteractionManager(
        {
          viewport,
          worldContainer: viewport,
          tileWidth: ISO_TILE_WIDTH,
          tileHeight: ISO_TILE_HEIGHT,
          mapBounds: {
            minX: 0,
            minY: 0,
            maxX: mapData.width,
            maxY: mapData.height,
          },
        },
        {
          onDragStart: (nodeId) => {
            // Drag started
          },
          onDragMove: (nodeId, gridX, gridY) => {
            // Update paths in real-time during drag
            pathManager.updateNodePosition(nodeId, gridX, gridY);
          },
          onDragEnd: (nodeId, gridX, gridY) => {
            // Update the node data
            const node = mapData.nodes.find(n => n.id === nodeId);
            if (node) {
              node.gridX = gridX;
              node.gridY = gridY;
            }
            // Notify parent component for persistence
            onProjectMoved?.(nodeId, gridX, gridY);
          },
        }
      );

      // Register all sprites with interaction manager
      for (const [id, instance] of scene.spriteInstances) {
        interaction.registerSprite(id, instance);
      }

      // Store refs for cleanup
      interactionRef.current = interaction;
      pathManagerRef.current = pathManager;

      // Restore camera position or center on first region
      if (savedCameraPosition.current) {
        // Restore saved camera position from before the recreate
        viewport.moveCenter(savedCameraPosition.current.x, savedCameraPosition.current.y);
        viewport.setZoom(savedCameraPosition.current.scale);
      } else if (mapData.regions.length > 0 && !hasInitializedCamera.current) {
        // First initialization: center on first region
        const firstRegion = mapData.regions[0];
        viewport.moveCenter(
          gridToScreen(firstRegion.centerX, firstRegion.centerY).screenX,
          gridToScreen(firstRegion.centerX, firstRegion.centerY).screenY
        );
        hasInitializedCamera.current = true;
      }

      // Region placeholder rendering for edit mode
      const findAdjacentEmptyPositions = (regions: typeof mapData.regions): Array<{ row: number; col: number }> => {
        const regionSize = regions[0]?.bounds.width || 25; // Assume uniform region size

        const occupied = new Set<string>();
        regions.forEach(r => {
          const row = r.bounds.y / regionSize;
          const col = r.bounds.x / regionSize;
          occupied.add(`${row}-${col}`);
        });

        const adjacent: Array<{ row: number; col: number }> = [];
        const checked = new Set<string>();

        regions.forEach(r => {
          const row = r.bounds.y / regionSize;
          const col = r.bounds.x / regionSize;

          // Check 4 directions
          const directions = [
            { row: row - 1, col }, // up
            { row: row + 1, col }, // down
            { row, col: col - 1 }, // left
            { row, col: col + 1 }, // right
          ];

          directions.forEach(pos => {
            const key = `${pos.row}-${pos.col}`;
            if (!occupied.has(key) && !checked.has(key) && pos.row >= 0 && pos.col >= 0) {
              adjacent.push(pos);
              checked.add(key);
            }
          });
        });

        return adjacent;
      };

      const renderPlaceholders = () => {
        if (!placeholdersRef.current || !mapDataRef.current) return;

        placeholdersRef.current.removeChildren();

        if (!isEditingRegionsRef.current || !onAddRegion) return;

        const adjacentPositions = findAdjacentEmptyPositions(mapDataRef.current.regions);
        const regionSize = mapDataRef.current.regions[0]?.bounds.width || 25;
        const placeholderColor = 0x22c55e; // Green

        adjacentPositions.forEach(pos => {
          const placeholder = new Graphics();

          // Calculate the four corner points of the region in screen space
          const topLeft = gridToScreen(pos.col * regionSize, pos.row * regionSize);
          const topRight = gridToScreen(pos.col * regionSize + regionSize, pos.row * regionSize);
          const bottomLeft = gridToScreen(pos.col * regionSize, pos.row * regionSize + regionSize);
          const bottomRight = gridToScreen(pos.col * regionSize + regionSize, pos.row * regionSize + regionSize);

          // Draw the diamond outline with transparent fill for clickability
          placeholder.setStrokeStyle({
            width: 2,
            color: placeholderColor,
            alpha: 0.6,
          });
          placeholder.setFillStyle({
            color: placeholderColor,
            alpha: 0.1, // Very transparent so it's barely visible but still clickable
          });

          placeholder.moveTo(topLeft.screenX, topLeft.screenY);
          placeholder.lineTo(topRight.screenX, topRight.screenY);
          placeholder.lineTo(bottomRight.screenX, bottomRight.screenY);
          placeholder.lineTo(bottomLeft.screenX, bottomLeft.screenY);
          placeholder.lineTo(topLeft.screenX, topLeft.screenY);
          placeholder.fill();
          placeholder.stroke();

          // Draw "+" icon in center
          const centerX = pos.col * regionSize + regionSize / 2;
          const centerY = pos.row * regionSize + regionSize / 2;
          const centerScreen = gridToScreen(centerX, centerY);

          const iconSize = 40;
          placeholder.setStrokeStyle({
            width: 4,
            color: placeholderColor,
            alpha: 0.8,
          });
          placeholder.moveTo(centerScreen.screenX - iconSize / 2, centerScreen.screenY);
          placeholder.lineTo(centerScreen.screenX + iconSize / 2, centerScreen.screenY);
          placeholder.moveTo(centerScreen.screenX, centerScreen.screenY - iconSize / 2);
          placeholder.lineTo(centerScreen.screenX, centerScreen.screenY + iconSize / 2);
          placeholder.stroke();

          placeholder.eventMode = 'static';
          placeholder.cursor = 'pointer';

          // Hover effect - redraw with higher opacity
          placeholder.on('pointerenter', () => {
            placeholder.clear();
            placeholder.setStrokeStyle({
              width: 2,
              color: placeholderColor,
              alpha: 1.0,
            });
            placeholder.setFillStyle({
              color: placeholderColor,
              alpha: 0.2, // More visible on hover
            });
            placeholder.moveTo(topLeft.screenX, topLeft.screenY);
            placeholder.lineTo(topRight.screenX, topRight.screenY);
            placeholder.lineTo(bottomRight.screenX, bottomRight.screenY);
            placeholder.lineTo(bottomLeft.screenX, bottomLeft.screenY);
            placeholder.lineTo(topLeft.screenX, topLeft.screenY);
            placeholder.fill();
            placeholder.stroke();

            // Redraw icon
            const iconSize = 40;
            placeholder.setStrokeStyle({
              width: 4,
              color: placeholderColor,
              alpha: 1.0,
            });
            placeholder.moveTo(centerScreen.screenX - iconSize / 2, centerScreen.screenY);
            placeholder.lineTo(centerScreen.screenX + iconSize / 2, centerScreen.screenY);
            placeholder.moveTo(centerScreen.screenX, centerScreen.screenY - iconSize / 2);
            placeholder.lineTo(centerScreen.screenX, centerScreen.screenY + iconSize / 2);
            placeholder.stroke();
          });

          placeholder.on('pointerleave', () => {
            placeholder.clear();
            placeholder.setStrokeStyle({
              width: 2,
              color: placeholderColor,
              alpha: 0.6,
            });
            placeholder.setFillStyle({
              color: placeholderColor,
              alpha: 0.1,
            });
            placeholder.moveTo(topLeft.screenX, topLeft.screenY);
            placeholder.lineTo(topRight.screenX, topRight.screenY);
            placeholder.lineTo(bottomRight.screenX, bottomRight.screenY);
            placeholder.lineTo(bottomLeft.screenX, bottomLeft.screenY);
            placeholder.lineTo(topLeft.screenX, topLeft.screenY);
            placeholder.fill();
            placeholder.stroke();

            // Redraw icon
            const iconSize = 40;
            placeholder.setStrokeStyle({
              width: 4,
              color: placeholderColor,
              alpha: 0.8,
            });
            placeholder.moveTo(centerScreen.screenX - iconSize / 2, centerScreen.screenY);
            placeholder.lineTo(centerScreen.screenX + iconSize / 2, centerScreen.screenY);
            placeholder.moveTo(centerScreen.screenX, centerScreen.screenY - iconSize / 2);
            placeholder.lineTo(centerScreen.screenX, centerScreen.screenY + iconSize / 2);
            placeholder.stroke();
          });

          placeholder.on('pointerdown', () => {
            onAddRegion(pos);
          });

          placeholdersRef.current!.addChild(placeholder);
        });
      };

      // Store function in ref for later use
      renderPlaceholdersRef.current = renderPlaceholders;

      // Initial render of placeholders if in edit mode
      renderPlaceholders();

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

        viewport.x = animationRef.current.startX + (animationRef.current.targetX - animationRef.current.startX) * eased;
        viewport.y = animationRef.current.startY + (animationRef.current.targetY - animationRef.current.startY) * eased;

        if (progress >= 1) {
          animationRef.current = null;
          setIsAnimating(false);
        }
      });

      setIsRendering(false);
    };

    let resizeObserver: ResizeObserver | null = null;
    let resizeTimeout: number | null = null;

    const initAndSetupResize = async () => {
      await initPixi();
      // Store reference to resize observer for cleanup
      if (canvasRef.current && appRef.current) {
        resizeObserver = new ResizeObserver((entries) => {
          if (!appRef.current || !viewportRef.current) return;

          // Set resizing flag
          setIsResizing(true);

          // Clear existing timeout
          if (resizeTimeout) {
            clearTimeout(resizeTimeout);
          }

          for (const entry of entries) {
            const { width: newWidth, height: newHeight } = entry.contentRect;

            // Update dimensions ref
            dimensionsRef.current = { width: newWidth, height: newHeight };

            // Resize the PixiJS renderer
            appRef.current.renderer.resize(newWidth, newHeight);

            // Resize the viewport
            viewportRef.current.resize(newWidth, newHeight);

            // Update hit area for the new size
            appRef.current.stage.hitArea = appRef.current.screen;
          }

          // Clear resizing flag after a short delay
          resizeTimeout = window.setTimeout(() => {
            setIsResizing(false);
          }, 100);
        });

        resizeObserver.observe(canvasRef.current);
      }
    };

    initAndSetupResize();

    return () => {
      cleanup = true;
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (interactionRef.current) {
        interactionRef.current.destroy();
        interactionRef.current = null;
      }
      if (pathManagerRef.current) {
        pathManagerRef.current.destroy();
        pathManagerRef.current = null;
      }
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
      viewportRef.current = null;
      worldContainerRef.current = null;
      animationRef.current = null;
      rendererRef.current = null;
    };
  }, [stableCollectionKey, width, height]); // Only recreate PIXI when collection or size changes

  // Separate effect to update scene when mapData changes (without recreating PIXI)
  useEffect(() => {
    if (!viewportRef.current || !rendererRef.current || !mapData) return;

    const renderer = rendererRef.current;
    const viewport = viewportRef.current;

    // Remove and destroy old scene containers to prevent memory leaks
    if (sceneContainersRef.current) {
      viewport.removeChild(sceneContainersRef.current.background);
      viewport.removeChild(sceneContainersRef.current.tiles);
      viewport.removeChild(sceneContainersRef.current.bridges);
      viewport.removeChild(sceneContainersRef.current.paths);
      viewport.removeChild(sceneContainersRef.current.nodes);

      // Destroy containers and their children to free GPU memory
      sceneContainersRef.current.background.destroy({ children: true });
      sceneContainersRef.current.tiles.destroy({ children: true });
      sceneContainersRef.current.bridges.destroy({ children: true });
      sceneContainersRef.current.paths.destroy({ children: true });
      sceneContainersRef.current.nodes.destroy({ children: true });
    }

    // Render new scene with updated mapData
    const scene = renderer.renderScene(mapData, true);

    // Re-add scene containers
    viewport.addChild(scene.background);
    viewport.addChild(scene.tiles);
    viewport.addChild(scene.bridges);
    viewport.addChild(scene.paths);
    viewport.addChild(scene.nodes);
    scene.nodes.sortableChildren = true;

    sceneContainersRef.current = scene;

    // Re-register sprites with interaction manager after scene recreation
    if (interactionRef.current) {
      // Clear old sprite registrations
      interactionRef.current.clearSprites();
      // Register all new sprites
      for (const [id, instance] of scene.spriteInstances) {
        interactionRef.current.registerSprite(id, instance);
      }
    }

    // Re-render placeholders with new regions
    if (renderPlaceholdersRef.current) {
      renderPlaceholdersRef.current();
    }
  }, [mapData]);

  // Handle region changes with animation (only when user navigates, not when content updates)
  useEffect(() => {
    if (!viewportRef.current || !mapData || isRendering) return;

    // Recalculate region on demand to get fresh data
    const region = mapData.regions[currentRegionIndex] || mapData.regions[0];
    if (!region) return;

    const viewport = viewportRef.current;
    const regionCenter = gridToScreen(region.centerX, region.centerY);

    // On initial load, snap to position without animation
    if (!hasInitializedCamera.current) {
      viewport.moveCenter(regionCenter.screenX, regionCenter.screenY);
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
    const targetX = dimensionsRef.current.width / 2 - regionCenter.screenX;
    const targetY = dimensionsRef.current.height / 2 - regionCenter.screenY;
    animationRef.current = {
      startTime: performance.now(),
      startX: viewport.x,
      startY: viewport.y,
      targetX,
      targetY,
    };
  }, [currentRegionIndex, isRendering]); // Only depend on index, not the region object itself

  // Update ref and re-render placeholders when edit mode changes
  useEffect(() => {
    isEditingRegionsRef.current = isEditingRegions;
    if (renderPlaceholdersRef.current) {
      renderPlaceholdersRef.current();
    }
  }, [isEditingRegions]);

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
          backgroundColor: '#1a1a1a', // Match Pixi background to prevent flash
          opacity: isResizing ? 0.95 : 1,
          transition: 'opacity 0.1s ease-out',
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
            pointerEvents: 'auto',
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
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentRegion.name}

              {/* Edit mode controls */}
              {isEditingRegions && (
                <>
                  <button
                    onClick={() => {
                      const newName = prompt('Rename region:', currentRegion.name);
                      if (newName && newName.trim() && newName !== currentRegion.name) {
                        // Find the matching customRegion by name (since regions from layout engine may not have IDs)
                        const matchingRegion = customRegions.find(r => r.name === currentRegion.name);
                        if (matchingRegion && onRenameRegion) {
                          onRenameRegion(matchingRegion.id, newName.trim());
                        }
                      }
                    }}
                    style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid #3b82f6',
                      borderRadius: 3,
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: 10,
                      color: '#3b82f6',
                      fontWeight: 'normal',
                    }}
                    title="Rename region"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete region "${currentRegion.name}"? Repositories will be unassigned.`)) {
                        const matchingRegion = customRegions.find(r => r.name === currentRegion.name);
                        if (matchingRegion && onDeleteRegion) {
                          onDeleteRegion(matchingRegion.id);
                          // Navigate to previous region if we deleted the current one
                          if (currentRegionIndex > 0) {
                            setCurrentRegionIndex(prev => prev - 1);
                          }
                        }
                      }
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      borderRadius: 3,
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: 10,
                      color: '#ef4444',
                      fontWeight: 'normal',
                    }}
                    title="Delete region"
                  >
                    🗑️
                  </button>
                </>
              )}
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
        {isEditingRegions ? (
          <div>Click green placeholders to add new regions</div>
        ) : (
          <div>Click on packages to view details</div>
        )}
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
