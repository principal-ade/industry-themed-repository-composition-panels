/**
 * Sprite Layout Engine
 * Handles collision-free placement of sprites in regions using circle packing
 */

export interface LayoutNode {
  id: string;
  gridX: number;
  gridY: number;
  size: number; // Size multiplier for boundary calculations
  language?: string; // Package language (e.g., 'typescript', 'python', 'rust')
}

export interface RegionBounds {
  width: number;  // Region width in tiles
  height: number; // Region height in tiles
}

export interface LayoutOptions {
  /** Minimum spacing between sprite boundaries in tiles (default: 0.5) */
  spacing?: number;
  /** Start position offset from top-left (default: boundary radius of first sprite) */
  startOffset?: number;
}

/**
 * Check if two sprites would collide
 * Sprites collide if distance between centers < sum of their boundary radii
 */
function wouldCollide(
  pos1: { gridX: number; gridY: number; size: number },
  pos2: { gridX: number; gridY: number; size: number },
  spacing: number = 0
): boolean {
  // Boundary radius is 2 × size (boundary extends 2 × size in each direction)
  const radius1 = 2 * pos1.size + spacing / 2;
  const radius2 = 2 * pos2.size + spacing / 2;

  const distance = Math.sqrt(
    Math.pow(pos1.gridX - pos2.gridX, 2) +
    Math.pow(pos1.gridY - pos2.gridY, 2)
  );

  return distance < radius1 + radius2;
}

/**
 * Check if sprite position is within region bounds
 * Accounts for sprite boundary size
 */
function isWithinBounds(
  position: { gridX: number; gridY: number; size: number },
  bounds: RegionBounds
): boolean {
  const radius = 2 * position.size; // Boundary radius

  return (
    position.gridX - radius >= 0 &&
    position.gridX + radius <= bounds.width &&
    position.gridY - radius >= 0 &&
    position.gridY + radius <= bounds.height
  );
}

/**
 * Find a valid position for a sprite starting from top-left
 * Uses a grid search pattern scanning left-to-right, top-to-bottom
 */
function findValidPosition(
  size: number,
  placedNodes: LayoutNode[],
  bounds: RegionBounds,
  spacing: number
): { gridX: number; gridY: number } | null {
  const radius = 2 * size;
  const step = 0.5; // Search grid step size

  // Start from top-left corner (accounting for boundary radius)
  const startX = radius;
  const startY = radius;
  const endX = bounds.width - radius;
  const endY = bounds.height - radius;

  // Scan from top to bottom, left to right
  for (let y = startY; y <= endY; y += step) {
    for (let x = startX; x <= endX; x += step) {
      const testPosition = { gridX: x, gridY: y, size };

      // Check if position is within bounds
      if (!isWithinBounds(testPosition, bounds)) {
        continue;
      }

      // Check collision with all placed sprites
      let hasCollision = false;
      for (const placed of placedNodes) {
        if (wouldCollide(testPosition, placed, spacing)) {
          hasCollision = true;
          break;
        }
      }

      if (!hasCollision) {
        return { gridX: x, gridY: y };
      }
    }
  }

  return null; // No valid position found
}

/**
 * Layout sprites in a region using circle packing
 * Places sprites starting from top-left, largest first
 *
 * @param nodes - Nodes to layout (must have id and size)
 * @param bounds - Region boundaries
 * @param options - Layout options
 * @returns Array of nodes with assigned positions, and array of nodes that didn't fit
 */
export function layoutSpritesInRegion(
  nodes: Array<{ id: string; size: number; language?: string }>,
  bounds: RegionBounds,
  options: LayoutOptions = {}
): { placed: LayoutNode[]; overflow: Array<{ id: string; size: number; language?: string }> } {
  const { spacing = 0.5 } = options;

  // Sort by size descending (largest first for better packing)
  const sortedNodes = [...nodes].sort((a, b) => b.size - a.size);

  const placedNodes: LayoutNode[] = [];
  const overflow: Array<{ id: string; size: number; language?: string }> = [];

  for (const node of sortedNodes) {
    const position = findValidPosition(node.size, placedNodes, bounds, spacing);

    if (position) {
      placedNodes.push({
        id: node.id,
        gridX: position.gridX,
        gridY: position.gridY,
        size: node.size,
        language: node.language,
      });
    } else {
      // Sprite doesn't fit - add to overflow
      overflow.push(node);
    }
  }

  return { placed: placedNodes, overflow };
}

/**
 * Calculate region capacity metrics
 */
export interface RegionCapacity {
  totalArea: number;      // Total region area in tiles
  usedArea: number;       // Area occupied by sprites
  remainingArea: number;  // Space left
  utilization: number;    // Percentage used (0-100)
  isFull: boolean;        // True if <15% space remains
}

export function calculateRegionCapacity(
  placedNodes: LayoutNode[],
  bounds: RegionBounds
): RegionCapacity {
  const totalArea = bounds.width * bounds.height;

  // Sum up area used by sprite boundaries (4 × size squared)
  const usedArea = placedNodes.reduce((sum, node) => {
    const boundarySize = 4 * node.size; // Boundary is 4 × size tiles
    return sum + boundarySize * boundarySize;
  }, 0);

  const remainingArea = totalArea - usedArea;
  const utilization = (usedArea / totalArea) * 100;
  const isFull = remainingArea / totalArea < 0.15; // <15% space = full

  return {
    totalArea,
    usedArea,
    remainingArea,
    utilization,
    isFull,
  };
}

/**
 * Region with positioned nodes
 */
export interface LayoutRegion {
  regionId: string;
  gridPosition: { row: number; col: number }; // Position in region grid
  bounds: { x: number; y: number; width: number; height: number }; // Bounds in world tiles
  nodes: LayoutNode[]; // Nodes in this region (with local coordinates)
  capacity: RegionCapacity;
}

/**
 * Layout sprites across multiple regions if needed
 * Automatically creates new regions when overflow occurs
 *
 * @param nodes - Nodes to layout
 * @param regionSize - Size of each region in tiles (default: 25)
 * @param options - Layout options
 * @returns Array of regions with positioned nodes
 */
export function layoutSpritesMultiRegion(
  nodes: Array<{ id: string; size: number; language?: string }>,
  regionSize: number = 25,
  options: LayoutOptions = {}
): LayoutRegion[] {
  const regions: LayoutRegion[] = [];
  let remainingNodes = [...nodes];
  let regionRow = 0;
  let regionCol = 0;

  while (remainingNodes.length > 0) {
    const regionId = `region-${regionRow}-${regionCol}`;
    const regionBounds: RegionBounds = { width: regionSize, height: regionSize };

    // Try to place nodes in this region
    const layoutResult = layoutSpritesInRegion(remainingNodes, regionBounds, options);

    // Convert local coordinates to world coordinates
    const offsetX = regionCol * regionSize;
    const offsetY = regionRow * regionSize;

    const worldNodes = layoutResult.placed.map((node) => ({
      ...node,
      gridX: node.gridX + offsetX,
      gridY: node.gridY + offsetY,
    }));

    // Create region
    const capacity = calculateRegionCapacity(layoutResult.placed, regionBounds);
    regions.push({
      regionId,
      gridPosition: { row: regionRow, col: regionCol },
      bounds: {
        x: offsetX,
        y: offsetY,
        width: regionSize,
        height: regionSize,
      },
      nodes: worldNodes,
      capacity,
    });

    // Update remaining nodes
    remainingNodes = layoutResult.overflow;

    // Move to next region (fill left-to-right, then down)
    regionCol++;
    if (regionCol >= 3) {
      // Max 3 columns, then move to next row
      regionCol = 0;
      regionRow++;
    }

    // Safety check - prevent infinite loop
    if (regions.length > 20) {
      console.error('Too many regions created - stopping to prevent infinite loop');
      break;
    }
  }

  return regions;
}
