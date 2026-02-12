/**
 * OverworldMapPanel - 8-bit Mario-style overworld map for package dependencies
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Application, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PackageLayer } from '../../types/composition';
import type { PackagesSliceData } from '../../types/dependencies';
import type { PanelComponentProps } from '../../types';
import type { OverworldMap, MapRegion } from './types';
import { packagesToUnifiedOverworldMap } from './dataConverter';
import { generateSpriteAtlas } from './spriteGenerator';
import { gridToScreen, getIsometricZIndex } from './isometricUtils';

export interface OverworldMapPanelProps {
  /** Package data from the repository */
  packages: PackageLayer[];

  /** Include dev dependencies in the map */
  includeDevDependencies?: boolean;

  /** Include peer dependencies in the map */
  includePeerDependencies?: boolean;

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
  width = 800,
  height = 600,
  isLoading = false,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldContainerRef = useRef<Container | null>(null);
  const scaleRef = useRef<number>(1);
  const [isRendering, setIsRendering] = useState(true);

  // Region navigation state
  const [currentRegionIndex, setCurrentRegionIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<{ startTime: number; startX: number; startY: number; targetX: number; targetY: number } | null>(null);
  const hasInitializedCamera = useRef(false);

  // Convert packages to unified overworld map
  const mapData = useMemo<OverworldMap>(() => {
    return packagesToUnifiedOverworldMap(packages, {
      includeDevDependencies,
      includePeerDependencies,
    });
  }, [packages, includeDevDependencies, includePeerDependencies]);

  // Get current region
  const currentRegion = mapData.regions[currentRegionIndex] || mapData.regions[0];

  // Initialize PixiJS and render the map
  useEffect(() => {
    if (!canvasRef.current) return;

    let app: Application;
    let cleanup = false;

    const initPixi = async () => {
      // Create PixiJS application
      app = new Application();
      await app.init({
        width,
        height,
        backgroundColor: 0x87ceeb, // Sky blue
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

      // Render paths
      const pathContainer = new Container();
      worldContainer.addChild(pathContainer);

      for (const path of mapData.paths) {
        const graphics = new Graphics();
        const color = path.type === 'dev-dependency' ? 0x94a3b8 : 0x6366f1;
        const alpha = path.type === 'dev-dependency' ? 0.5 : 0.8;

        graphics.setStrokeStyle({
          width: 3,
          color: color,
          alpha: alpha,
        });

        // Draw path as connected line
        if (path.points.length > 0) {
          const firstPoint = gridToScreen(path.points[0].gridX, path.points[0].gridY);
          graphics.moveTo(firstPoint.screenX, firstPoint.screenY);

          for (let i = 1; i < path.points.length; i++) {
            const point = gridToScreen(path.points[i].gridX, path.points[i].gridY);
            graphics.lineTo(point.screenX, point.screenY);
          }

          graphics.stroke();
        }

        pathContainer.addChild(graphics);
      }

      // Render location nodes
      const nodeContainer = new Container();
      worldContainer.addChild(nodeContainer);

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
          const sprite = new Sprite(texture);
          sprite.x = screenX;
          sprite.y = screenY;
          sprite.anchor.set(0.5, 1); // Bottom center anchor for buildings

          // Make interactive
          sprite.eventMode = 'static';
          sprite.cursor = 'pointer';
          sprite.on('pointerover', () => {
            sprite.tint = 0xffff00; // Yellow highlight
          });
          sprite.on('pointerout', () => {
            sprite.tint = 0xffffff; // Reset
          });
          sprite.on('pointertap', () => {
            console.log('Clicked node:', node.label);
            // TODO: Show package details
          });

          nodeContainer.addChild(sprite);

          // Add label text
          const label = new Text({
            text: node.label,
            style: {
              fontFamily: 'monospace',
              fontSize: 10,
              fill: 0xffffff,
              stroke: { color: 0x000000, width: 2 },
            },
          });
          label.x = screenX;
          label.y = screenY + 10;
          label.anchor.set(0.5, 0);
          nodeContainer.addChild(label);
        }
      }

      // Calculate scale based on largest region (so all regions appear same size)
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
      const availableWidth = width - padding * 2;
      const availableHeight = height - padding * 2;

      const scaleX = availableWidth / maxRegionWidth;
      const scaleY = availableHeight / maxRegionHeight;
      const scale = Math.min(scaleX, scaleY, 1.0);

      worldContainer.scale.set(scale, scale);
      scaleRef.current = scale;

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

    initPixi();

    return () => {
      cleanup = true;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
      worldContainerRef.current = null;
      animationRef.current = null;
    };
  }, [mapData, width, height]);

  // Handle region changes with animation
  useEffect(() => {
    if (!worldContainerRef.current || !currentRegion || isRendering) return;

    const regionCenter = gridToScreen(currentRegion.centerX, currentRegion.centerY);
    const worldContainer = worldContainerRef.current;
    const scale = scaleRef.current;
    const targetX = width / 2 - regionCenter.screenX * scale;
    const targetY = height / 2 - regionCenter.screenY * scale;

    // On initial load, snap to position without animation
    if (!hasInitializedCamera.current) {
      worldContainer.x = targetX;
      worldContainer.y = targetY;
      hasInitializedCamera.current = true;
      return;
    }

    // Subsequent changes: animate smoothly
    setIsAnimating(true);
    animationRef.current = {
      startTime: performance.now(),
      startX: worldContainer.x,
      startY: worldContainer.y,
      targetX,
      targetY,
    };
  }, [currentRegionIndex, currentRegion, width, height, isRendering]);

  if (packages.length === 0) {
    return (
      <div
        style={{
          width,
          height,
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
    <div style={{ position: 'relative' }}>
      {(isLoading || isRendering) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height,
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
          width,
          height,
          imageRendering: 'pixelated',
          border: '2px solid #1f2937',
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

      {/* Info overlay - only show if single region */}
      {mapData.regions.length === 1 && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: 12,
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        >
          <div>Packages: {mapData.nodes.length}</div>
          <div>Dependencies: {mapData.paths.length}</div>
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
