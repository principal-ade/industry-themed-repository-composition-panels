/**
 * Package Expansion Test Component
 * Demonstrates multiple buildings per repository
 */

import React, { useEffect, useRef, useState } from 'react';
import { Texture } from 'pixi.js';
import { IsometricPixiCanvas } from './components/IsometricPixiCanvas';
import { IsometricRenderer } from './components/IsometricRenderer';
import { IsometricInteractionManager } from './components/IsometricInteractionManager';
import { generateBuildingSprite } from './components/buildingSpriteGenerator';
import { layoutSpritesMultiRegion } from './spriteLayoutEngine';
import type { OverworldMap, LocationNode } from './types';

/**
 * Language-to-color mapping
 */
const LANGUAGE_COLORS: Record<string, string> = {
  node: '#06b6d4', // cyan
  javascript: '#06b6d4',
  typescript: '#06b6d4',
  python: '#fbbf24', // yellow
  rust: '#ef4444', // red
  cargo: '#ef4444',
  go: '#22c55e', // green
  default: '#94a3b8', // gray
};

export interface SubPackage {
  name: string;
  size: number;
}

export interface PackageNode {
  id: string;
  name: string;
  size: number;
  language?: string;
  category?: string;
  subPackages?: SubPackage[]; // Multiple packages to render in same footprint
}

export interface PackageExpansionTestProps {
  /** Title to display */
  title?: string;
  /** Package nodes to display */
  packages?: PackageNode[];
}

export const PackageExpansionTest: React.FC<PackageExpansionTestProps> = ({
  title = 'Package Expansion Test',
  packages = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<IsometricPixiCanvas | null>(null);
  const rendererRef = useRef<IsometricRenderer | null>(null);
  const interactionRef = useRef<IsometricInteractionManager | null>(null);
  const [stats, setStats] = useState<{
    packages: number;
    regions: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current || packages.length === 0) return;

    const init = async () => {
      const regionSize = 25;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 1. Prepare input nodes for layout engine
      const inputNodes = packages.map((pkg) => ({
        id: pkg.id,
        size: pkg.size,
        language: pkg.language,
      }));

      // 2. Use layout engine to position packages
      const regions = layoutSpritesMultiRegion(inputNodes, regionSize, {
        spacing: 0.5,
      });

      // Calculate world size
      const maxCol = Math.max(...regions.map((r) => r.gridPosition.col));
      const maxRow = Math.max(...regions.map((r) => r.gridPosition.row));
      const totalCols = maxCol + 1;
      const totalRows = maxRow + 1;
      const gridWidth = totalCols * regionSize;
      const gridHeight = totalRows * regionSize;
      const worldWidth = gridWidth * 64;
      const worldHeight = gridHeight * 32;

      // 3. Create canvas
      const canvas = new IsometricPixiCanvas({
        container: containerRef.current!,
        width,
        height,
        worldWidth,
        worldHeight,
        backgroundColor: 0x1a1a1a,
        minZoom: 0.1,
        maxZoom: 2.0,
      });

      const { app, viewport } = await canvas.init();
      canvasRef.current = canvas;

      // 4. Generate building textures
      const atlas: Record<string, Texture> = {};
      const uniqueSizesAndColors = new Set<string>();

      // Collect unique size+color combinations
      for (const pkg of packages) {
        const color =
          LANGUAGE_COLORS[pkg.language || 'default'] || LANGUAGE_COLORS.default;

        // Add main package size
        if (!pkg.subPackages) {
          const key = `${pkg.size.toFixed(2)}-${color}`;
          uniqueSizesAndColors.add(key);
        }

        // Add sub-package sizes
        if (pkg.subPackages) {
          for (const sub of pkg.subPackages) {
            const key = `${sub.size.toFixed(2)}-${color}`;
            uniqueSizesAndColors.add(key);
          }
        }
      }

      // Generate textures for each combination
      for (const key of uniqueSizesAndColors) {
        const [sizeStr, colorHex] = key.split('-');
        const size = parseFloat(sizeStr);
        const color = parseInt(colorHex.replace('#', ''), 16);
        const buildingGraphics = generateBuildingSprite({ size, color });

        atlas[`building-${key}`] = app.renderer.generateTexture({
          target: buildingGraphics,
          resolution: 2,
        });

        buildingGraphics.destroy();
      }

      // 5. Create LocationNode array with positioned packages
      const locationNodes: LocationNode[] = [];

      for (const region of regions) {
        for (const positioned of region.nodes) {
          const pkg = packages.find((p) => p.id === positioned.id);
          if (!pkg) continue;

          const color =
            LANGUAGE_COLORS[pkg.language || 'default'] ||
            LANGUAGE_COLORS.default;
          const spriteKey = `building-${pkg.size.toFixed(2)}-${color}`;

          // Build subdivisions array if package has sub-packages
          const subdivisions = pkg.subPackages?.map((sub) => ({
            name: sub.name,
            size: sub.size,
            sprite: `building-${sub.size.toFixed(2)}-${color}`,
          }));

          locationNodes.push({
            id: pkg.id,
            gridX: positioned.gridX,
            gridY: positioned.gridY,
            type: 'house',
            sprite: spriteKey,
            size: pkg.size,
            theme: 'grass',
            label: pkg.name,
            packageType:
              (pkg.category as 'node' | 'python' | 'cargo' | 'go') || 'node',
            isRoot: false,
            color,
            subdivisions, // Pass subdivision data
          });
        }
      }

      // 6. Create OverworldMap
      const mapData: OverworldMap = {
        name: title,
        tiles: [], // No terrain tiles
        nodes: locationNodes,
        paths: [], // No dependency paths
        regions: regions.map((r) => ({
          id: `region-${r.gridPosition.row}-${r.gridPosition.col}`,
          name: `Region ${r.gridPosition.row}-${r.gridPosition.col}`,
          bounds: r.bounds,
          centerX: r.bounds.x + r.bounds.width / 2,
          centerY: r.bounds.y + r.bounds.height / 2,
          nodeIds: r.nodes.map((n) => n.id),
        })),
        width: gridWidth,
        height: gridHeight,
      };

      // 7. Create renderer
      const renderer = new IsometricRenderer({
        viewport,
        atlas,
        tileWidth: 64,
        tileHeight: 32,
        gridColor: 0x333333,
      });
      rendererRef.current = renderer;

      // Render the scene
      const scene = renderer.renderScene(mapData, true);

      // 8. Calculate grid center and position all containers
      const centerGridX = gridWidth / 2;
      const centerGridY = gridHeight / 2;
      const centerScreenX = (centerGridX - centerGridY) * 32;
      const centerScreenY = (centerGridX + centerGridY) * 16;
      const offsetX = worldWidth / 2 - centerScreenX;
      const offsetY = worldHeight / 2 - centerScreenY;

      // Position all scene containers
      scene.background.x = offsetX;
      scene.background.y = offsetY;
      scene.tiles.x = offsetX;
      scene.tiles.y = offsetY;
      scene.bridges.x = offsetX;
      scene.bridges.y = offsetY;
      scene.paths.x = offsetX;
      scene.paths.y = offsetY;
      scene.nodes.x = offsetX;
      scene.nodes.y = offsetY;

      // Enable sorting for proper z-ordering
      scene.nodes.sortableChildren = true;

      // Add containers to viewport
      viewport.addChild(scene.background);
      viewport.addChild(scene.tiles);
      viewport.addChild(scene.bridges);
      viewport.addChild(scene.paths);
      viewport.addChild(scene.nodes);

      // 9. Create interaction manager
      const interaction = new IsometricInteractionManager(
        {
          viewport,
          worldContainer: scene.nodes,
          tileWidth: 64,
          tileHeight: 32,
          containerOffset: { x: offsetX, y: offsetY },
        },
        {} // No events for this test
      );

      // Register all sprites
      for (const [id, instance] of scene.spriteInstances.entries()) {
        interaction.registerSprite(id, instance);
      }

      interactionRef.current = interaction;

      // Calculate stats
      const totalBuildings = packages.reduce((sum, pkg) => {
        return sum + (pkg.subPackages ? pkg.subPackages.length : 1);
      }, 0);

      setStats({
        packages: totalBuildings,
        regions: regions.length,
      });

      // Center on content
      viewport.fit(true);
      viewport.moveCenter(worldWidth / 2, worldHeight / 2);
    };

    init();

    // Cleanup
    return () => {
      interactionRef.current?.destroy();
      rendererRef.current?.destroy();
      canvasRef.current?.destroy();
      interactionRef.current = null;
      rendererRef.current = null;
      canvasRef.current = null;
    };
  }, [packages, title]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {stats && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: 14,
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{title}</div>
          <div>Packages: {stats.packages}</div>
          <div>Regions: {stats.regions}</div>
        </div>
      )}
    </div>
  );
};
