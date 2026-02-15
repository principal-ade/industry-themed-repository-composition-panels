/**
 * Region Editing Test - Demonstrates interactive region management with placeholders
 */

import React, { useEffect, useRef, useState } from 'react';
import { Container, Graphics, Text, Texture } from 'pixi.js';
import { IsometricPixiCanvas } from './components/IsometricPixiCanvas';
import { IsometricRenderer } from './components/IsometricRenderer';
import { gridToScreen } from './isometricUtils';
import type { OverworldMap, MapRegion } from './types';

export interface RegionEditingTestProps {
  /** Number of initial regions (1-4) */
  initialRegions?: number;
}

export const RegionEditingTest: React.FC<RegionEditingTestProps> = ({
  initialRegions = 2,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<IsometricPixiCanvas | null>(null);
  const rendererRef = useRef<IsometricRenderer | null>(null);
  const viewportRef = useRef<any>(null);
  const [regions, setRegions] = useState<MapRegion[]>([]);
  const placeholdersRef = useRef<Container | null>(null);
  const sceneContainersRef = useRef<{ background: Container; tiles: Container; bridges: Container; paths: Container; nodes: Container } | null>(null);
  const offsetRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      const regionSize = 25;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Create initial regions in a grid
      const initialRegionData: MapRegion[] = [];
      for (let i = 0; i < initialRegions; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        initialRegionData.push({
          id: `region-${i}`,
          name: `Region ${i + 1}`,
          bounds: {
            x: col * regionSize,
            y: row * regionSize,
            width: regionSize,
            height: regionSize,
          },
          centerX: col * regionSize + regionSize / 2,
          centerY: row * regionSize + regionSize / 2,
          nodeIds: [],
        });
      }

      setRegions(initialRegionData);

      // Calculate world size based on actual regions + 1 region buffer for placeholders
      const maxCol = Math.max(...initialRegionData.map(r => r.bounds.x / regionSize)) + 1;
      const maxRow = Math.max(...initialRegionData.map(r => r.bounds.y / regionSize)) + 1;
      const gridWidth = (maxCol + 1) * regionSize; // Add buffer for placeholders
      const gridHeight = (maxRow + 1) * regionSize; // Add buffer for placeholders
      const worldWidth = gridWidth * 64;
      const worldHeight = gridHeight * 32;

      // Create canvas
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

      const { viewport } = await canvas.init();
      canvasRef.current = canvas;
      viewportRef.current = viewport;

      // Create simple map with just regions (no nodes yet)
      const mapData: OverworldMap = {
        width: gridWidth,
        height: gridHeight,
        tiles: [],
        nodes: [],
        paths: [],
        regions: initialRegionData,
        name: 'Region Editing Test',
      };

      // Create empty atlas (no building sprites needed yet)
      const atlas: Record<string, Texture> = {};

      // Create renderer
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

      // Center the scene
      const centerGridX = gridWidth / 2;
      const centerGridY = gridHeight / 2;
      const centerScreenX = (centerGridX - centerGridY) * 32;
      const centerScreenY = (centerGridX + centerGridY) * 16;
      const offsetX = worldWidth / 2 - centerScreenX;
      const offsetY = worldHeight / 2 - centerScreenY;

      // Store offset for later use when adding regions
      offsetRef.current = { offsetX, offsetY };

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

      // Add to viewport
      viewport.addChild(scene.background);
      viewport.addChild(scene.tiles);
      viewport.addChild(scene.bridges);
      viewport.addChild(scene.paths);
      viewport.addChild(scene.nodes);

      // Store scene containers for updates
      sceneContainersRef.current = scene;

      // Create placeholders container (above everything else)
      const placeholdersContainer = new Container();
      placeholdersContainer.x = offsetRef.current.offsetX;
      placeholdersContainer.y = offsetRef.current.offsetY;
      placeholdersContainer.sortableChildren = true;
      viewport.addChild(placeholdersContainer);
      placeholdersRef.current = placeholdersContainer;

      // Create region labels container for debugging
      const labelsContainer = new Container();
      labelsContainer.x = offsetRef.current.offsetX;
      labelsContainer.y = offsetRef.current.offsetY;
      viewport.addChild(labelsContainer);

      // Function to render region labels
      const renderRegionLabels = () => {
        labelsContainer.removeChildren();

        initialRegionData.forEach(region => {
          const centerScreen = gridToScreen(region.centerX, region.centerY);

          const label = new Text({
            text: region.name,
            style: {
              fontSize: 16,
              fill: 0xfbbf24,
              fontFamily: 'Arial',
              fontWeight: 'bold',
            },
          });
          label.x = centerScreen.screenX;
          label.y = centerScreen.screenY;
          label.anchor.set(0.5, 0.5);

          labelsContainer.addChild(label);
        });
      };

      // Function to add a new region at a position
      const addRegion = (pos: { row: number; col: number }) => {
        const newRegion: MapRegion = {
          id: `region-${Date.now()}`,
          name: `Region ${initialRegionData.length + 1}`,
          bounds: {
            x: pos.col * regionSize,
            y: pos.row * regionSize,
            width: regionSize,
            height: regionSize,
          },
          centerX: pos.col * regionSize + regionSize / 2,
          centerY: pos.row * regionSize + regionSize / 2,
          nodeIds: [],
        };

        // Add to regions array
        initialRegionData.push(newRegion);
        setRegions([...initialRegionData]);

        // Re-render the grid with the new region
        if (rendererRef.current && sceneContainersRef.current && viewportRef.current) {
          // Remove old background
          sceneContainersRef.current.background.removeChildren();

          // Recalculate world size based on all regions
          const maxCol = Math.max(...initialRegionData.map(r => r.bounds.x / regionSize));
          const maxRow = Math.max(...initialRegionData.map(r => r.bounds.y / regionSize));
          const newGridWidth = (maxCol + 2) * regionSize; // +2 for buffer
          const newGridHeight = (maxRow + 2) * regionSize;

          // Create updated map data
          const updatedMapData: OverworldMap = {
            width: newGridWidth,
            height: newGridHeight,
            tiles: [],
            nodes: [],
            paths: [],
            regions: initialRegionData,
            name: 'Region Editing Test',
          };

          // Re-render grid
          const newGrid = rendererRef.current.renderGrid(newGridWidth, newGridHeight, updatedMapData.regions);

          // Grid is at (0,0) because it's a child of the background container which is already offset
          newGrid.x = 0;
          newGrid.y = 0;

          sceneContainersRef.current.background.addChild(newGrid);
        }

        // Re-render placeholders and labels with updated regions
        renderPlaceholders();
        renderRegionLabels();
      };

      // Function to find adjacent empty positions
      const findAdjacentEmptyPositions = (existingRegions: MapRegion[]): Array<{ row: number; col: number }> => {
        const occupied = new Set<string>();
        existingRegions.forEach(r => {
          const row = r.bounds.y / regionSize;
          const col = r.bounds.x / regionSize;
          occupied.add(`${row}-${col}`);
        });

        const adjacent: Array<{ row: number; col: number }> = [];
        const checked = new Set<string>();

        existingRegions.forEach(r => {
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
            // Only constraint is that row/col must be >= 0 (no upper limit)
            if (!occupied.has(key) && !checked.has(key) && pos.row >= 0 && pos.col >= 0) {
              adjacent.push(pos);
              checked.add(key);
            }
          });
        });

        return adjacent;
      };

      // Function to render placeholders
      const renderPlaceholders = () => {
        placeholdersContainer.removeChildren();

        const adjacentPositions = findAdjacentEmptyPositions(initialRegionData);

        adjacentPositions.forEach(pos => {
          // Create placeholder graphics - draw only the outline boundary
          const placeholder = new Graphics();

          const placeholderColor = 0x22c55e; // Green color for placeholders

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
            alpha: 0.1,
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
              alpha: 0.2,
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
            addRegion(pos);
          });

          placeholdersContainer.addChild(placeholder);
        });
      };

      // Initial render of placeholders and labels
      renderPlaceholders();
      renderRegionLabels();

      // Center viewport
      canvas.moveCenter(worldWidth / 2, worldHeight / 2, true);
    };

    init();

    return () => {
      rendererRef.current?.destroy();
      canvasRef.current?.destroy();
    };
  }, [initialRegions]); // Re-initialize when initialRegions changes

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', backgroundColor: '#0a0a0a' }}
      />
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
          border: '2px solid #fbbf24',
        }}
      >
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
          Region Editing Test
        </div>
        <div>✓ Regions: {regions.length}</div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
          Hover over green placeholders to highlight.
          <br />
          Click to add a new region.
        </div>
      </div>
    </div>
  );
};
