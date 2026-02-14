/**
 * Isometric grid test refactored to use new Pixi components
 * Demonstrates component composition and validates integration
 */

import React, { useEffect, useRef } from 'react';
import { Texture, Graphics } from 'pixi.js';
import { IsometricPixiCanvas } from './components/IsometricPixiCanvas';
import { IsometricRenderer } from './components/IsometricRenderer';
import { IsometricInteractionManager } from './components/IsometricInteractionManager';
import type { OverworldMap } from './types';

export interface IsometricGridTestProps {
  gridWidth?: number;
  gridHeight?: number;
  showSprite?: boolean;
  spriteGridX?: number;
  spriteGridY?: number;
  spriteSize?: number; // Size in tiles (e.g., 2 = 2x2 tiles)
}

export const IsometricGridTest: React.FC<IsometricGridTestProps> = ({
  gridWidth = 25,
  gridHeight = 25,
  showSprite = true,
  spriteGridX = 12.5,
  spriteGridY = 12.5,
  spriteSize = 2,
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
      const worldWidth = gridWidth * 32;
      const worldHeight = gridHeight * 16;

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

      // 2. Create sprite textures for testing
      const atlas: Record<string, Texture> = {};
      if (showSprite) {
        // Create a simple circle sprite
        const circleSprite = new Graphics();
        circleSprite.circle(0, 0, 60);
        circleSprite.fillStyle = { color: 0x00ff00, alpha: 0.4 };
        circleSprite.fill();
        circleSprite.circle(0, 0, 60);
        circleSprite.strokeStyle = { width: 4, color: 0x00ff00 };
        circleSprite.stroke();
        circleSprite.circle(0, 0, 10);
        circleSprite.fillStyle = { color: 0xff0000 };
        circleSprite.fill();
        atlas['circle-sprite'] = app.renderer.generateTexture({
          target: circleSprite,
          resolution: 2,
        });
        circleSprite.destroy();

        // Create a simple isometric cuboid building
        const buildingSprite = new Graphics();

        // Building dimensions (in pixels)
        const width = 40;
        const depth = 40;
        const height = 50;

        // Isometric conversion to match grid's 2:1 ratio
        // For depth: horizontal movement should be 2x vertical movement
        const isoWidth = width;
        const isoDepthX = depth * 0.5;  // Horizontal: half the depth (20px)
        const isoDepthY = depth * 0.25; // Vertical: quarter the depth (10px) for 2:1 ratio

        // Bottom face (base - darkest)
        buildingSprite.fillStyle = { color: 0x654321 }; // Dark brown
        buildingSprite.beginPath();
        buildingSprite.moveTo(-isoWidth / 2, 0);                        // Left
        buildingSprite.lineTo(0, -isoDepthY);                           // Back
        buildingSprite.lineTo(isoWidth / 2, 0);                         // Right
        buildingSprite.lineTo(0, isoDepthY);                            // Front
        buildingSprite.closePath();
        buildingSprite.fill();

        // Left face (darker side)
        buildingSprite.fillStyle = { color: 0x8b4513 }; // Brown
        buildingSprite.beginPath();
        buildingSprite.moveTo(-isoWidth / 2, 0);                        // Bottom left
        buildingSprite.lineTo(-isoWidth / 2, -height);                  // Top left
        buildingSprite.lineTo(0, -height - isoDepthY);                  // Top back (2:1 ratio)
        buildingSprite.lineTo(0, -isoDepthY);                           // Bottom back (2:1 ratio)
        buildingSprite.closePath();
        buildingSprite.fill();

        // Right face (lighter front)
        buildingSprite.fillStyle = { color: 0xd2691e }; // Lighter brown
        buildingSprite.beginPath();
        buildingSprite.moveTo(0, -isoDepthY);                           // Bottom back
        buildingSprite.lineTo(0, -height - isoDepthY);                  // Top back
        buildingSprite.lineTo(isoWidth / 2, -height);                   // Top right
        buildingSprite.lineTo(isoWidth / 2, 0);                         // Bottom right
        buildingSprite.closePath();
        buildingSprite.fill();

        // Top face (roof - lightest)
        buildingSprite.fillStyle = { color: 0xa0522d }; // Medium brown
        buildingSprite.beginPath();
        buildingSprite.moveTo(-isoWidth / 2, -height);                  // Left
        buildingSprite.lineTo(0, -height - isoDepthY);                  // Back (2:1 ratio)
        buildingSprite.lineTo(isoWidth / 2, -height);                   // Right
        buildingSprite.lineTo(0, -height + isoDepthY);                  // Front (2:1 ratio)
        buildingSprite.closePath();
        buildingSprite.fill();

        // Outline for definition
        buildingSprite.strokeStyle = { width: 2, color: 0x000000, alpha: 0.3 };
        buildingSprite.beginPath();
        // Left edge
        buildingSprite.moveTo(-isoWidth / 2, 0);
        buildingSprite.lineTo(-isoWidth / 2, -height);
        buildingSprite.lineTo(0, -height - isoDepthY);
        // Top edge
        buildingSprite.lineTo(isoWidth / 2, -height);
        // Right edge
        buildingSprite.lineTo(isoWidth / 2, 0);
        buildingSprite.stroke();

        // Center dot for reference
        buildingSprite.circle(0, 0, 6);
        buildingSprite.fillStyle = { color: 0xff0000 };
        buildingSprite.fill();

        atlas['building-sprite'] = app.renderer.generateTexture({
          target: buildingSprite,
          resolution: 2,
        });
        buildingSprite.destroy();
      }

      // 3. Create map data
      const mapData: OverworldMap = {
        width: gridWidth,
        height: gridHeight,
        tiles: [], // No terrain tiles for this test
        nodes: showSprite
          ? [
              {
                id: 'test-building',
                gridX: spriteGridX,
                gridY: spriteGridY,
                type: 'house',
                sprite: 'building-sprite',
                size: spriteSize,
                theme: 'grass',
                label: 'Test Building',
                packageType: 'node',
                isRoot: false,
                color: '#d2691e',
              },
            ]
          : [],
        paths: [],
        regions: [
          {
            id: 'region-1',
            name: 'Test Region',
            bounds: {
              x: 0,
              y: 0,
              width: gridWidth,
              height: gridHeight,
            },
            centerX: gridWidth / 2,
            centerY: gridHeight / 2,
            nodeIds: showSprite ? ['test-sprite-1'] : [],
          },
        ],
        name: 'Isometric Grid Test',
      };

      // 4. Create renderer
      const renderer = new IsometricRenderer({
        viewport,
        atlas,
        tileWidth: 32,
        tileHeight: 16,
        gridColor: 0x333333,
        regionColor: 0xff6600,
      });

      const scene = renderer.renderScene(mapData, true); // showGrid = true
      rendererRef.current = renderer;

      // 5. Calculate grid center and position all containers
      const centerGridX = gridWidth / 2;
      const centerGridY = gridHeight / 2;
      const centerScreenX = (centerGridX - centerGridY) * 16;
      const centerScreenY = (centerGridX + centerGridY) * 8;
      const offsetX = worldWidth / 2 - centerScreenX;
      const offsetY = worldHeight / 2 - centerScreenY;

      // Position all scene containers
      scene.background.x = offsetX;
      scene.background.y = offsetY;
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

      // 7. Create interaction manager if sprite is shown
      if (showSprite && scene.spriteInstances.size > 0) {
        const interaction = new IsometricInteractionManager(
          {
            viewport,
            worldContainer: viewport,
            tileWidth: 32,
            tileHeight: 16,
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
      }

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
  }, [gridWidth, gridHeight, showSprite, spriteGridX, spriteGridY, spriteSize]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100vh', backgroundColor: '#0a0a0a' }}
    />
  );
};
