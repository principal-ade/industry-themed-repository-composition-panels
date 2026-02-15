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
  const viewportRef = useRef<Viewport | null>(null);
  const worldContainerRef = useRef<Container | null>(null);
  const scaleRef = useRef<number>(1);
  const interactionRef = useRef<IsometricInteractionManager | null>(null);
  const pathManagerRef = useRef<IsometricPathManager | null>(null);
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
        backgroundColor: 0x1a1a1a, // Dark gray background (matches LayoutEngineTest)
        antialias: false, // Pixel-perfect rendering
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
            console.log('Drag start:', nodeId);
          },
          onDragMove: (nodeId, gridX, gridY) => {
            // Update paths in real-time during drag
            pathManager.updateNodePosition(nodeId, gridX, gridY);
          },
          onDragEnd: (nodeId, gridX, gridY) => {
            console.log('Drag end:', nodeId, 'at', gridX, gridY);
            // Update the node data
            const node = mapData.nodes.find(n => n.id === nodeId);
            if (node) {
              node.gridX = gridX;
              node.gridY = gridY;
            }
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

      // Fit viewport to show the first region
      // (viewport handles scaling automatically)
      if (mapData.regions.length > 0) {
        const firstRegion = mapData.regions[0];
        viewport.moveCenter(
          gridToScreen(firstRegion.centerX, firstRegion.centerY).screenX,
          gridToScreen(firstRegion.centerX, firstRegion.centerY).screenY
        );
      }

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

    const initAndSetupResize = async () => {
      await initPixi();
      // Store reference to resize observer for cleanup
      if (canvasRef.current && appRef.current) {
        resizeObserver = new ResizeObserver((entries) => {
          if (!appRef.current || !viewportRef.current) return;

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
    };
  }, [mapData]);

  // Handle region changes with animation
  useEffect(() => {
    if (!viewportRef.current || !currentRegion || isRendering) return;

    const viewport = viewportRef.current;
    const regionCenter = gridToScreen(currentRegion.centerX, currentRegion.centerY);

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
