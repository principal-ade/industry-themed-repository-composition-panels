/**
 * Building Size Test - Demonstrates repository size scaling
 * Shows multiple buildings at different sizes (1.5x to 4.0x multiplier)
 */

import React, { useEffect, useRef } from 'react';
import { Texture } from 'pixi.js';
import { IsometricPixiCanvas } from './components/IsometricPixiCanvas';
import { IsometricRenderer } from './components/IsometricRenderer';
import { IsometricInteractionManager } from './components/IsometricInteractionManager';
import { generateBuildingSprite } from './components/buildingSpriteGenerator';
import type { OverworldMap } from './types';

export interface BuildingSizeTestProps {
  gridWidth?: number;
  gridHeight?: number;
}

export const BuildingSizeTest: React.FC<BuildingSizeTestProps> = ({
  gridWidth = 25,
  gridHeight = 25,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<IsometricPixiCanvas | null>(null);
  const rendererRef = useRef<IsometricRenderer | null>(null);
  const interactionRef = useRef<IsometricInteractionManager | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const worldWidth = gridWidth * 64;
      const worldHeight = gridHeight * 32;

      // 1. Create canvas with viewport
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

      // 2. Create building sprites at different sizes
      const atlas: Record<string, Texture> = {};

      // Calculate actual sizes for specific file counts
      // Using the formula from repositoryScaling.ts
      const calculateSize = (fileCount: number): number => {
        if (fileCount <= 100) return 1.0;
        const logScale = Math.log10(fileCount);
        const size = 1.0 + (logScale - 2) * 1.0;
        return Math.min(Math.max(size, 1.0), 4.0);
      };

      // File counts chosen to produce exact multipliers:
      // 100 → 1.0x, 316 → 1.5x, 1000 → 2.0x, 3162 → 2.5x, 10000 → 3.0x
      const fileCounts = [100, 316, 1000, 3162, 10000];
      const sizes = fileCounts.map(calculateSize);
      const sizeLabels = fileCounts.map((count, i) =>
        `${sizes[i].toFixed(1)}x (${count.toLocaleString()} files)`
      );

      for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i];
        const buildingGraphics = generateBuildingSprite({ size });

        atlas[`building-${size}`] = app.renderer.generateTexture({
          target: buildingGraphics,
          resolution: 2,
        });

        buildingGraphics.destroy();
      }

      // 3. Create map data with buildings at different sizes
      // Arrange in a grid pattern to test collision detection
      const nodes = sizes.flatMap((size, index) => [
        // Top row
        {
          id: `building-${size}-top`,
          gridX: 5 + index * 5,
          gridY: 7,
          type: 'house' as const,
          sprite: `building-${size}`,
          size,
          theme: 'grass' as const,
          label: sizeLabels[index],
          packageType: 'node' as const,
          isRoot: false,
          color: '#d2691e',
        },
        // Bottom row
        {
          id: `building-${size}-bottom`,
          gridX: 5 + index * 5,
          gridY: 17,
          type: 'house' as const,
          sprite: `building-${size}`,
          size,
          theme: 'grass' as const,
          label: sizeLabels[index],
          packageType: 'node' as const,
          isRoot: false,
          color: '#d2691e',
        },
      ]);

      const mapData: OverworldMap = {
        width: gridWidth,
        height: gridHeight,
        tiles: [],
        nodes,
        paths: [],
        regions: [
          {
            id: 'region-1',
            name: 'Size Comparison',
            bounds: {
              x: 0,
              y: 0,
              width: gridWidth,
              height: gridHeight,
            },
            centerX: gridWidth / 2,
            centerY: gridHeight / 2,
            nodeIds: nodes.map(n => n.id),
          },
        ],
        name: 'Building Size Test',
      };

      // 4. Create renderer
      const renderer = new IsometricRenderer({
        viewport,
        atlas,
        tileWidth: 64,
        tileHeight: 32,
        gridColor: 0x333333,
        regionColor: 0xff6600,
      });

      const scene = renderer.renderScene(mapData, true);
      rendererRef.current = renderer;

      // 5. Calculate grid center and position all containers
      const centerGridX = gridWidth / 2;
      const centerGridY = gridHeight / 2;
      const centerScreenX = (centerGridX - centerGridY) * 32;
      const centerScreenY = (centerGridX + centerGridY) * 16;
      const offsetX = worldWidth / 2 - centerScreenX;
      const offsetY = worldHeight / 2 - centerScreenY;

      // Position all scene containers with same offset
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

      // 6. Add to viewport (layer order)
      viewport.addChild(scene.background);
      viewport.addChild(scene.tiles);
      viewport.addChild(scene.bridges);
      viewport.addChild(scene.paths);
      viewport.addChild(scene.nodes);

      // 7. Create interaction manager
      const interaction = new IsometricInteractionManager(
        {
          viewport,
          worldContainer: viewport,
          tileWidth: 64,
          tileHeight: 32,
          mapBounds: {
            minX: 0,
            minY: 0,
            maxX: gridWidth,
            maxY: gridHeight,
          },
        },
        {
          onDragStart: (nodeId) => {
            console.log('Drag start:', nodeId);
          },
          onDragMove: (nodeId, gridX, gridY) => {
            console.log('Drag move:', nodeId, gridX, gridY);
          },
          onDragEnd: (nodeId, gridX, gridY) => {
            console.log('Drag end:', nodeId, 'at', gridX, gridY);
          },
        }
      );

      // Register all sprites
      for (const [id, instance] of scene.spriteInstances) {
        interaction.registerSprite(id, instance);
      }

      interactionRef.current = interaction;

      // 8. Center viewport on the grid
      canvas.moveCenter(worldWidth / 2, worldHeight / 2, true);
    };

    init();

    // Cleanup
    return () => {
      interactionRef.current?.destroy();
      rendererRef.current?.destroy();
      canvasRef.current?.destroy();
    };
  }, [gridWidth, gridHeight]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100vh', backgroundColor: '#0a0a0a' }}
    />
  );
};
