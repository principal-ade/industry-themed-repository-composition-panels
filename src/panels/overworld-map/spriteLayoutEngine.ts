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
  lastEditedAt?: string; // ISO timestamp of last edit (for age-based grouping)
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
  // Add small buffer (0.3 tiles) to account for grid quantization (step = 0.5)
  const gridBuffer = 0.3;
  const radius1 = 2 * pos1.size + spacing / 2 + gridBuffer;
  const radius2 = 2 * pos2.size + spacing / 2 + gridBuffer;

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
        // Snap to whole tiles so boundaries always cover full squares
        return { gridX: Math.round(x), gridY: Math.round(y) };
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
  nodes: LayoutNode[]; // Nodes in this region (with world coordinates)
  capacity: RegionCapacity;
  ageBucket?: AgeBucket; // Age bucket this region belongs to
  name?: string; // Human-readable name (e.g., "Last Month")
}

/**
 * Age bucket definitions for region grouping
 */
export enum AgeBucket {
  LAST_MONTH = 'last-month',
  LAST_3_MONTHS = 'last-3-months',
  LAST_YEAR = 'last-year',
  OLDER = 'older',
}

/**
 * Get age bucket for a node based on lastEditedAt
 */
function getAgeBucket(lastEditedAt?: string): AgeBucket {
  if (!lastEditedAt) return AgeBucket.OLDER;

  const now = Date.now();
  const editTime = new Date(lastEditedAt).getTime();
  const daysAgo = (now - editTime) / (1000 * 60 * 60 * 24);

  if (daysAgo <= 30) return AgeBucket.LAST_MONTH;
  if (daysAgo <= 90) return AgeBucket.LAST_3_MONTHS;
  if (daysAgo <= 365) return AgeBucket.LAST_YEAR;
  return AgeBucket.OLDER;
}

/**
 * Group nodes by age bucket
 */
function groupNodesByAge(
  nodes: Array<{ id: string; size: number; language?: string; lastEditedAt?: string }>
): Map<AgeBucket, Array<{ id: string; size: number; language?: string; lastEditedAt?: string }>> {
  const groups = new Map<AgeBucket, Array<{ id: string; size: number; language?: string; lastEditedAt?: string }>>();

  // Initialize all buckets
  groups.set(AgeBucket.LAST_MONTH, []);
  groups.set(AgeBucket.LAST_3_MONTHS, []);
  groups.set(AgeBucket.LAST_YEAR, []);
  groups.set(AgeBucket.OLDER, []);

  // Group nodes
  for (const node of nodes) {
    const bucket = getAgeBucket(node.lastEditedAt);
    groups.get(bucket)!.push(node);
  }

  return groups;
}

/**
 * Layout sprites across multiple regions if needed
 * Groups nodes by age (last edited) before packing:
 * - Last month → First region(s)
 * - Last 3 months → Next region(s)
 * - Last year → Next region(s)
 * - Older → Final region(s)
 *
 * @param nodes - Nodes to layout
 * @param regionSize - Size of each region in tiles (default: 25)
 * @param options - Layout options
 * @returns Array of regions with positioned nodes
 */
export function layoutSpritesMultiRegion(
  nodes: Array<{ id: string; size: number; language?: string; lastEditedAt?: string }>,
  regionSize: number = 25,
  options: LayoutOptions = {}
): LayoutRegion[] {
  const regions: LayoutRegion[] = [];
  let regionRow = 0;
  let regionCol = 0;

  // Calculate grid size dynamically for square-ish arrangement
  // Estimate total regions needed (rough estimate based on average packing efficiency)
  const estimatedRegions = Math.ceil(nodes.length / 10); // Assume ~10 sprites per region
  const gridSize = Math.max(2, Math.ceil(Math.sqrt(estimatedRegions))); // Square root for balanced grid, min 2x2

  // Group nodes by age
  const ageGroups = groupNodesByAge(nodes);

  // Process each age bucket in order (most recent first)
  const bucketOrder = [
    AgeBucket.LAST_MONTH,
    AgeBucket.LAST_3_MONTHS,
    AgeBucket.LAST_YEAR,
    AgeBucket.OLDER,
  ];

  for (const bucket of bucketOrder) {
    const bucketNodes = ageGroups.get(bucket)!;
    if (bucketNodes.length === 0) continue;

    let remainingNodes = [...bucketNodes];

    // Pack this age group into regions
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

      // Create region with age bucket label
      const bucketLabels = {
        [AgeBucket.LAST_MONTH]: 'Last Month',
        [AgeBucket.LAST_3_MONTHS]: 'Last 3 Months',
        [AgeBucket.LAST_YEAR]: 'Last Year',
        [AgeBucket.OLDER]: 'Older',
      };

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
        ageBucket: bucket,
        name: bucketLabels[bucket],
      });

      // Update remaining nodes
      remainingNodes = layoutResult.overflow;

      // Move to next region (fill left-to-right, then down)
      regionCol++;
      if (regionCol >= gridSize) {
        // Wrap to next row after gridSize columns
        regionCol = 0;
        regionRow++;
      }

      // Safety check - prevent infinite loop
      if (regions.length > 20) {
        console.error('Too many regions created - stopping to prevent infinite loop');
        break;
      }
    }
  }

  return regions;
}
