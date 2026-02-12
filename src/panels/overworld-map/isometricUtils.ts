/**
 * Isometric rendering utilities for converting between grid and screen coordinates
 */

import { TILE_SIZE, type GridPoint, type IsometricCoords } from './types';

// Re-export TILE_SIZE for external use
export { TILE_SIZE } from './types';

/**
 * Isometric tile dimensions
 * For 32x32 logical tiles, we use a 2:1 ratio diamond
 */
export const ISO_TILE_WIDTH = TILE_SIZE * 2; // 64px wide
export const ISO_TILE_HEIGHT = TILE_SIZE; // 32px tall

/**
 * Convert grid coordinates to isometric screen coordinates
 * @param gridX Grid X position
 * @param gridY Grid Y position
 * @returns Screen coordinates {screenX, screenY}
 */
export function gridToScreen(gridX: number, gridY: number): IsometricCoords {
  const screenX = (gridX - gridY) * (ISO_TILE_WIDTH / 2);
  const screenY = (gridX + gridY) * (ISO_TILE_HEIGHT / 2);

  return { screenX, screenY };
}

/**
 * Convert screen coordinates back to grid coordinates
 * @param screenX Screen X position
 * @param screenY Screen Y position
 * @returns Grid coordinates {gridX, gridY}
 */
export function screenToGrid(screenX: number, screenY: number): GridPoint {
  const gridX =
    (screenX / (ISO_TILE_WIDTH / 2) + screenY / (ISO_TILE_HEIGHT / 2)) / 2;
  const gridY =
    (screenY / (ISO_TILE_HEIGHT / 2) - screenX / (ISO_TILE_WIDTH / 2)) / 2;

  return { gridX, gridY };
}

/**
 * Get the bounding box for an isometric tile
 * @param gridX Grid X position
 * @param gridY Grid Y position
 * @returns Corner points of the diamond in screen space
 */
export function getTileBounds(gridX: number, gridY: number) {
  const { screenX, screenY } = gridToScreen(gridX, gridY);

  return {
    top: { x: screenX, y: screenY },
    right: { x: screenX + ISO_TILE_WIDTH / 2, y: screenY + ISO_TILE_HEIGHT / 2 },
    bottom: { x: screenX, y: screenY + ISO_TILE_HEIGHT },
    left: { x: screenX - ISO_TILE_WIDTH / 2, y: screenY + ISO_TILE_HEIGHT / 2 },
  };
}

/**
 * Calculate the correct render order (z-index) for isometric tiles
 * Tiles further "back" (higher Y + higher X) should render first
 * @param gridX Grid X position
 * @param gridY Grid Y position
 * @returns Z-index value
 */
export function getIsometricZIndex(gridX: number, gridY: number): number {
  // Simple additive approach: tiles with higher x+y render later
  return gridX + gridY;
}

/**
 * Get the center point of a tile in screen coordinates
 * @param gridX Grid X position
 * @param gridY Grid Y position
 * @returns Center point in screen space
 */
export function getTileCenter(gridX: number, gridY: number): IsometricCoords {
  const { screenX, screenY } = gridToScreen(gridX, gridY);

  return {
    screenX: screenX,
    screenY: screenY + ISO_TILE_HEIGHT / 2,
  };
}

/**
 * Check if a point in screen space is inside an isometric tile
 * @param screenX Screen X coordinate to test
 * @param screenY Screen Y coordinate to test
 * @param gridX Grid X of tile
 * @param gridY Grid Y of tile
 * @returns true if point is inside the diamond
 */
export function isPointInTile(
  screenX: number,
  screenY: number,
  gridX: number,
  gridY: number
): boolean {
  const bounds = getTileBounds(gridX, gridY);

  // Use diamond shape hit detection
  const dx = Math.abs(screenX - bounds.top.x);
  const dy = screenY - bounds.top.y;

  // Check if point is within the diamond bounds
  return dx / (ISO_TILE_WIDTH / 2) + dy / ISO_TILE_HEIGHT <= 1;
}

/**
 * Create a path between two grid points for drawing connections
 * Uses simple straight line for now, can be enhanced with pathfinding
 * @param from Starting grid point
 * @param to Ending grid point
 * @param segments Number of segments (for smooth curves)
 * @returns Array of screen coordinates
 */
export function createIsometricPath(
  from: GridPoint,
  to: GridPoint,
  segments: number = 10
): IsometricCoords[] {
  const points: IsometricCoords[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const gridX = from.gridX + (to.gridX - from.gridX) * t;
    const gridY = from.gridY + (to.gridY - from.gridY) * t;

    points.push(gridToScreen(gridX, gridY));
  }

  return points;
}

/**
 * Calculate the optimal map dimensions to fit all nodes
 * Adds padding around the edges
 * @param nodes Array of grid points
 * @param padding Padding in tiles
 * @returns Map dimensions {width, height}
 */
export function calculateMapBounds(
  nodes: GridPoint[],
  padding: number = 5
): { width: number; height: number } {
  if (nodes.length === 0) {
    return { width: 20, height: 20 }; // Default size
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.gridX);
    maxX = Math.max(maxX, node.gridX);
    minY = Math.min(minY, node.gridY);
    maxY = Math.max(maxY, node.gridY);
  }

  return {
    width: Math.ceil(maxX - minX) + padding * 2,
    height: Math.ceil(maxY - minY) + padding * 2,
  };
}

/**
 * Offset all grid positions by a delta (useful for centering)
 * @param nodes Array of grid points
 * @param deltaX X offset
 * @param deltaY Y offset
 * @returns New array with offset positions
 */
export function offsetGridPositions(
  nodes: GridPoint[],
  deltaX: number,
  deltaY: number
): GridPoint[] {
  return nodes.map((node) => ({
    gridX: node.gridX + deltaX,
    gridY: node.gridY + deltaY,
  }));
}
