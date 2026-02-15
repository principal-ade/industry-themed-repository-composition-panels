/**
 * Layout Engine Test - Demonstrates automatic sprite placement
 */

import React, { useEffect, useRef, useState } from 'react';
import { Texture } from 'pixi.js';
import { IsometricPixiCanvas } from './components/IsometricPixiCanvas';
import { IsometricRenderer } from './components/IsometricRenderer';
import { IsometricInteractionManager } from './components/IsometricInteractionManager';
import { generateBuildingSprite } from './components/buildingSpriteGenerator';
import { layoutSpritesMultiRegion } from './spriteLayoutEngine';
import type { OverworldMap } from './types';

export interface LayoutEngineTestProps {
  /** Distribution of sprite sizes (count per size) */
  sizeDistribution?: {
    size1_0?: number; // 1.0x sprites
    size1_5?: number; // 1.5x sprites
    size2_0?: number; // 2.0x sprites
    size2_5?: number; // 2.5x sprites
    size3_0?: number; // 3.0x sprites
  };
}

export const LayoutEngineTest: React.FC<LayoutEngineTestProps> = ({
  sizeDistribution = {
    size1_0: 5,
    size1_5: 4,
    size2_0: 4,
    size2_5: 3,
    size3_0: 2,
  },
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<IsometricPixiCanvas | null>(null);
  const rendererRef = useRef<IsometricRenderer | null>(null);
  const interactionRef = useRef<IsometricInteractionManager | null>(null);
  const [stats, setStats] = useState<{
    placed: number;
    overflow: number;
    utilization: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      const regionSize = 25; // Each region is 25x25 tiles
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 1. Create sprites using the size distribution
      const inputNodes: Array<{ id: string; size: number }> = [];
      let nodeId = 0;

      // Add 1.0x sprites
      for (let i = 0; i < (sizeDistribution.size1_0 || 0); i++) {
        inputNodes.push({ id: `sprite-${nodeId++}`, size: 1.0 });
      }
      // Add 1.5x sprites
      for (let i = 0; i < (sizeDistribution.size1_5 || 0); i++) {
        inputNodes.push({ id: `sprite-${nodeId++}`, size: 1.5 });
      }
      // Add 2.0x sprites
      for (let i = 0; i < (sizeDistribution.size2_0 || 0); i++) {
        inputNodes.push({ id: `sprite-${nodeId++}`, size: 2.0 });
      }
      // Add 2.5x sprites
      for (let i = 0; i < (sizeDistribution.size2_5 || 0); i++) {
        inputNodes.push({ id: `sprite-${nodeId++}`, size: 2.5 });
      }
      // Add 3.0x sprites
      for (let i = 0; i < (sizeDistribution.size3_0 || 0); i++) {
        inputNodes.push({ id: `sprite-${nodeId++}`, size: 3.0 });
      }

      // 2. Use layout engine to position sprites across multiple regions
      const regions = layoutSpritesMultiRegion(
        inputNodes,
        regionSize,
        { spacing: 0.5 }
      );

      // Calculate world size based on regions layout
      const maxCol = Math.max(...regions.map(r => r.gridPosition.col));
      const maxRow = Math.max(...regions.map(r => r.gridPosition.row));
      const totalCols = maxCol + 1;
      const totalRows = maxRow + 1;
      const gridWidth = totalCols * regionSize;
      const gridHeight = totalRows * regionSize;
      const worldWidth = gridWidth * 64;
      const worldHeight = gridHeight * 32;

      // 3. Create canvas with viewport
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

      // Calculate total placed and overflow
      const totalPlaced = regions.reduce((sum, r) => sum + r.nodes.length, 0);
      const totalOverflow = inputNodes.length - totalPlaced;
      const avgUtilization = regions.reduce((sum, r) => sum + r.capacity.utilization, 0) / regions.length;

      console.log('Layout result:', {
        regions: regions.length,
        placed: totalPlaced,
        overflow: totalOverflow,
        avgUtilization,
      });

      // Update stats for UI display
      setStats({
        placed: totalPlaced,
        overflow: totalOverflow,
        utilization: avgUtilization,
      });

      // Show warning in UI if overflow
      if (totalOverflow > 0) {
        console.warn(`⚠️ ${totalOverflow} sprites didn't fit!`);
      }

      // 4. Create sprite textures for each unique size
      const atlas: Record<string, Texture> = {};
      const allNodes = regions.flatMap(r => r.nodes);
      const uniqueSizes = new Set(allNodes.map(n => n.size));

      for (const size of uniqueSizes) {
        const buildingGraphics = generateBuildingSprite({ size });
        atlas[`building-${size.toFixed(2)}`] = app.renderer.generateTexture({
          target: buildingGraphics,
          resolution: 2,
        });
        buildingGraphics.destroy();
      }

      // 5. Create map data with laid out sprites from all regions
      const nodes = allNodes.map((node) => ({
        id: node.id,
        gridX: node.gridX,
        gridY: node.gridY,
        type: 'house' as const,
        sprite: `building-${node.size.toFixed(2)}`,
        size: node.size,
        theme: 'grass' as const,
        label: `${node.size.toFixed(1)}x`,
        packageType: 'node' as const,
        isRoot: false,
        color: '#d2691e',
      }));

      const mapData: OverworldMap = {
        width: gridWidth,
        height: gridHeight,
        tiles: [],
        nodes,
        paths: [],
        regions: regions.map(region => ({
          id: region.regionId,
          name: `Region ${region.gridPosition.row}-${region.gridPosition.col}`,
          bounds: region.bounds,
          centerX: region.bounds.x + region.bounds.width / 2,
          centerY: region.bounds.y + region.bounds.height / 2,
          nodeIds: region.nodes.map(n => n.id),
        })),
        name: 'Layout Engine Test',
      };

      // 6. Create renderer
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

      // 7. Calculate grid center and position all containers
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

      // 8. Add to viewport
      viewport.addChild(scene.background);
      viewport.addChild(scene.tiles);
      viewport.addChild(scene.bridges);
      viewport.addChild(scene.paths);
      viewport.addChild(scene.nodes);

      // 9. Create interaction manager with full world bounds
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

      // 10. Center viewport on the grid
      canvas.moveCenter(worldWidth / 2, worldHeight / 2, true);
    };

    init();

    // Cleanup
    return () => {
      interactionRef.current?.destroy();
      rendererRef.current?.destroy();
      canvasRef.current?.destroy();
    };
  }, [sizeDistribution]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', backgroundColor: '#0a0a0a' }}
      />
      {stats && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            border: stats.overflow > 0 ? '2px solid #ef4444' : '2px solid #22c55e',
          }}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            Layout Stats
          </div>
          <div>✓ Placed: {stats.placed} sprites</div>
          {stats.overflow > 0 && (
            <div style={{ color: '#ef4444' }}>
              ⚠ Overflow: {stats.overflow} sprites didn't fit
            </div>
          )}
          <div>📊 Utilization: {stats.utilization.toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
};
