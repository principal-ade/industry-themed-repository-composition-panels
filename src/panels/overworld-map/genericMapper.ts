/**
 * Generic mapper for converting any node/edge data to OverworldMap format
 * Use this to create maps for repos, services, or any connected entities
 */

import type {
  OverworldMap,
  OverworldMapCollection,
  MapRegion,
  LocationNode,
  PathConnection,
  BiomeTheme,
  LocationNodeType,
  Tile,
  GridPoint,
} from './types';
import { REGION_SIZE_TILES } from './types';
import type { AgingMetrics } from '../../utils/repositoryAging';
import { layoutSpritesMultiRegion, type LayoutNode } from './spriteLayoutEngine';

/**
 * Round size to nearest tier for sprite selection
 */
function roundToNearestTier(size: number): number {
  const tiers = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
  return tiers.reduce((prev, curr) =>
    Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
  );
}

/**
 * Generic node - represents any entity (package, repo, service, etc.)
 */
export interface GenericNode {
  id: string;
  name: string;
  isRoot?: boolean;

  // For determining visual representation
  category?: string;      // e.g., 'frontend', 'backend', 'database', 'python', 'node'
  language?: string;      // Primary programming language (e.g., 'typescript', 'python', 'rust')
  importance?: number;    // 0-100, affects building size
  size?: number;          // Size multiplier (1.5x - 4.0x) for sprite scaling based on metrics
  aging?: AgingMetrics;   // Aging metrics for weathering and color fade

  // Connections to other nodes
  dependencies?: string[];    // IDs of nodes this depends on
  devDependencies?: string[]; // IDs of dev/optional dependencies
}

/**
 * Region layout configuration for multi-region maps
 */
export interface RegionLayout {
  /** Number of columns in the region grid */
  columns: number;
  /** Number of rows in the region grid */
  rows: number;
  /** Direction to fill regions: 'row-major' (left-to-right, then down) or 'column-major' (top-to-bottom, then right) */
  fillDirection?: 'row-major' | 'column-major';
}

/**
 * Options for generic mapping
 */
export interface GenericMapperOptions {
  includeDevDependencies?: boolean;
  mapPadding?: number;

  // Region layout configuration
  regionLayout?: RegionLayout;

  // Customization functions
  getCategoryTheme?: (category: string) => BiomeTheme;
  getNodeType?: (node: GenericNode) => LocationNodeType;
  getNodeColor?: (node: GenericNode) => string;
}

/**
 * Default category to theme mapping
 */
const DEFAULT_CATEGORY_THEMES: Record<string, BiomeTheme> = {
  // Programming languages
  node: 'grass',
  javascript: 'grass',
  typescript: 'grass',
  python: 'desert',
  rust: 'volcano',
  cargo: 'volcano',
  go: 'ice',

  // Service types
  frontend: 'grass',
  backend: 'volcano',
  database: 'water',
  api: 'desert',
  microservice: 'ice',

  // Defaults
  default: 'grass',
};

/**
 * Default category to color mapping
 */
const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  node: '#06b6d4',       // cyan
  javascript: '#06b6d4',
  typescript: '#06b6d4',
  python: '#fbbf24',     // yellow
  rust: '#ef4444',       // red
  cargo: '#ef4444',
  go: '#22c55e',         // green
  frontend: '#06b6d4',
  backend: '#ef4444',
  database: '#3b82f6',
  api: '#fbbf24',
  'git-repo': '#3b82f6',  // blue
  monorepo: '#8b5cf6',    // purple
  library: '#22c55e',     // green
  tool: '#fbbf24',        // yellow
  default: '#94a3b8',     // gray
};

/**
 * Get theme for a category
 */
function getCategoryTheme(
  category: string | undefined,
  customMapper?: (category: string) => BiomeTheme
): BiomeTheme {
  if (!category) return 'grass';
  if (customMapper) return customMapper(category);
  return DEFAULT_CATEGORY_THEMES[category.toLowerCase()] || DEFAULT_CATEGORY_THEMES.default;
}

/**
 * Get color for a category
 */
function getCategoryColor(category: string | undefined, isRoot: boolean): string {
  if (isRoot) return '#f97316'; // Orange for root
  if (!category) return DEFAULT_CATEGORY_COLORS.default;
  return DEFAULT_CATEGORY_COLORS[category.toLowerCase()] || DEFAULT_CATEGORY_COLORS.default;
}

/**
 * Determine node type based on importance/size
 */
function determineNodeType(node: GenericNode, isRoot: boolean): LocationNodeType {
  // Check for git-specific categories
  if (node.category === 'git-repo') return 'git-repo';
  if (node.category === 'monorepo') return 'monorepo';

  if (isRoot) return 'castle';

  const importance = node.importance || 0;
  const depCount = (node.dependencies?.length || 0) + (node.devDependencies?.length || 0);

  if (importance > 80 || depCount > 10) return 'fortress';
  if (importance > 50 || depCount > 5) return 'tower';
  return 'house';
}

/**
 * Get node size based on type
 */
function getNodeSize(type: LocationNodeType): number {
  switch (type) {
    case 'castle':
      return 3;
    case 'monorepo':
      return 3;
    case 'fortress':
      return 2;
    case 'tower':
      return 2;
    case 'house':
      return 2;
    case 'git-repo':
      return 2;
    case 'pipe':
      return 1;
    default:
      return 2;
  }
}

/**
 * Calculate priority score for node layout ordering
 * Higher priority = better maintained (fresher) + larger size
 */
function calculateLayoutPriority(node: GenericNode): number {
  let priority = 0;

  // Size contribution (0-40 points, based on size 1.5x-4.0x)
  if (node.size) {
    priority += ((node.size - 1.5) / 2.5) * 40; // Normalize 1.5-4.0 to 0-40
  } else {
    priority += 20; // Default mid-range
  }

  // Maintenance contribution (0-60 points, based on aging)
  if (node.aging) {
    // Fresh repos get high score, old repos get low score
    const freshnessScore = (1 - node.aging.colorFade) * 60; // Invert fade: 0 fade = 60 points, 0.7 fade = 18 points
    priority += freshnessScore;
  } else {
    priority += 60; // No aging data = assume fresh
  }

  // Root nodes get bonus priority (always appear first)
  if (node.isRoot) {
    priority += 100;
  }

  return priority;
}

/**
 * Get the highlight radius for a node in tiles
 * HOVER_SIZE = 4 * sizeMultiplier, radius is half of that
 */
function getNodeHighlightRadius(node: GenericNode): number {
  const sizeMultiplier = node.size || 1.0;
  const hoverSize = 4 * sizeMultiplier; // Highlight diameter in tiles
  return hoverSize / 2; // Highlight radius
}

/**
 * Layout nodes using flow layout (left-to-right, top-to-bottom)
 * Places nodes sequentially, wrapping to next row when needed
 * Each node is positioned based on its actual size (highlight radius)
 */
function layoutNodes(nodes: GenericNode[]): Map<string, GridPoint> {
  const positions = new Map<string, GridPoint>();

  if (nodes.length === 0) return positions;

  // Sort nodes by priority (descending)
  const sortedNodes = [...nodes].sort((a, b) => {
    return calculateLayoutPriority(b) - calculateLayoutPriority(a);
  });

  let currentX = 1; // Current X position (left edge + padding)
  let currentY = 1; // Current Y position (top edge + padding)
  let rowHeight = 0; // Height of tallest node in current row
  const padding = 1; // Space between nodes
  const maxWidth = 100; // Max width before wrapping (will be constrained by region bounds)

  for (const node of sortedNodes) {
    const nodeRadius = getNodeHighlightRadius(node);
    const nodeDiameter = nodeRadius * 2;

    // Check if we need to wrap to next row
    if (currentX + nodeRadius > maxWidth && currentX > 1) {
      // Wrap to next row
      currentX = 1;
      currentY += rowHeight + padding;
      rowHeight = 0;
    }

    // Place node at center of its highlight circle
    positions.set(node.id, {
      gridX: currentX + nodeRadius,
      gridY: currentY + nodeRadius,
    });

    // Move cursor right by node diameter + padding
    currentX += nodeDiameter + padding;

    // Track tallest node in this row
    rowHeight = Math.max(rowHeight, nodeDiameter);
  }

  return positions;
}

/**
 * Generate terrain tiles
 */
function generateTerrain(
  width: number,
  height: number,
  nodes: LocationNode[],
  paths: PathConnection[],
  verticalBridgeXPositions: number[] = [], // X positions for vertical bridges (north-south)
  horizontalBridgeYPositions: number[] = [] // Y positions for horizontal bridges (east-west)
): Tile[] {
  const tiles: Tile[] = [];

  // Create base grass layer
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.push({
        x,
        y,
        type: 'grass',
        spriteIndex: 0,
        biome: 'grass',
      });
    }
  }

  // Add vertical bridges (north-south, spanning full height)
  for (const bridgeX of verticalBridgeXPositions) {
    // Bridge is 3 tiles wide centered on the boundary
    const bridgeStartX = bridgeX - 1;
    const bridgeEndX = bridgeX + 1;

    for (let y = 0; y < height; y++) {
      for (let x = bridgeStartX; x <= bridgeEndX; x++) {
        if (x >= 0 && x < width) {
          const tileIndex = y * width + x;
          if (tileIndex >= 0 && tileIndex < tiles.length) {
            // Use water type for visual distinction - we'll render bridge sprites over it
            tiles[tileIndex].type = 'water';
            tiles[tileIndex].biome = 'water';
          }
        }
      }
    }
  }

  // Add horizontal bridges (east-west, spanning full width)
  for (const bridgeY of horizontalBridgeYPositions) {
    // Bridge is 3 tiles tall centered on the boundary
    const bridgeStartY = bridgeY - 1;
    const bridgeEndY = bridgeY + 1;

    for (let x = 0; x < width; x++) {
      for (let y = bridgeStartY; y <= bridgeEndY; y++) {
        if (y >= 0 && y < height) {
          const tileIndex = y * width + x;
          if (tileIndex >= 0 && tileIndex < tiles.length) {
            // Use water type for visual distinction - we'll render bridge sprites over it
            tiles[tileIndex].type = 'water';
            tiles[tileIndex].biome = 'water';
          }
        }
      }
    }
  }

  // Add path tiles along connections
  for (const path of paths) {
    for (const point of path.points) {
      const x = Math.round(point.gridX);
      const y = Math.round(point.gridY);

      const tileIndex = y * width + x;
      if (tileIndex >= 0 && tileIndex < tiles.length) {
        tiles[tileIndex].type = 'path';
      }
    }
  }

  return tiles;
}

/**
 * Convert generic nodes to a single OverworldMap
 * Now uses automatic layout engine
 */
export function nodesToOverworldMap(
  nodes: GenericNode[],
  options: GenericMapperOptions = {}
): OverworldMap {
  // Just use the unified layout with automatic circle packing
  return nodesToUnifiedOverworldMap(nodes, options);
}

/**
 * DEPRECATED: Old manual layout for single region
 */
function nodesToOverworldMapOldManual(
  nodes: GenericNode[],
  options: GenericMapperOptions = {}
): OverworldMap {
  const {
    includeDevDependencies = true,
    mapPadding = 3,
    getCategoryTheme: customThemeMapper,
    getNodeType: customNodeTypeMapper,
    getNodeColor: customColorMapper,
  } = options;

  // Layout nodes
  const positions = layoutNodes(nodes);

  // Build node ID set for dependency checking
  const nodeIds = new Set(nodes.map((n) => n.id));

  // Helper to round size to nearest tier for sprite selection
  const roundToNearestTier = (size: number): number => {
    const tiers = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
    return tiers.reduce((prev, curr) =>
      Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
    );
  };

  // Create location nodes
  const locationNodes: LocationNode[] = nodes.map((node) => {
    const pos = positions.get(node.id) || { gridX: 0, gridY: 0 };
    const isRoot = node.isRoot || false;
    const theme = getCategoryTheme(node.category, customThemeMapper);
    const nodeType = customNodeTypeMapper
      ? customNodeTypeMapper(node)
      : determineNodeType(node, isRoot);
    // Use node.size if provided (from metrics), otherwise fall back to type-based size
    const size = node.size ?? getNodeSize(nodeType);
    const color = customColorMapper
      ? customColorMapper(node)
      : getCategoryColor(node.category, isRoot);

    // Generate sprite key for building sprites: building-{size}-{color}
    const spriteKey = `building-${size.toFixed(2)}-${color}`;

    // Validate packageType to ensure it's one of the allowed values
    const validPackageTypes: Array<'node' | 'python' | 'cargo' | 'go' | 'package'> = [
      'node', 'python', 'cargo', 'go', 'package'
    ];
    const packageType = validPackageTypes.includes(node.category as any)
      ? (node.category as 'node' | 'python' | 'cargo' | 'go' | 'package')
      : 'package';

    return {
      id: node.id,
      gridX: pos.gridX,
      gridY: pos.gridY,
      type: nodeType,
      sprite: spriteKey,
      size,
      theme,
      label: node.name,
      packageType, // Keep for backwards compat
      isRoot,
      color,
      aging: node.aging, // Pass through aging for weathering effects
    };
  });

  // Create path connections
  const paths: PathConnection[] = [];
  const pathIdSet = new Set<string>();

  for (const node of nodes) {
    const sourcePos = positions.get(node.id);
    if (!sourcePos) continue;

    // Production dependencies
    if (node.dependencies) {
      for (const targetId of node.dependencies) {
        if (!nodeIds.has(targetId)) continue;

        const targetPos = positions.get(targetId);
        if (!targetPos || targetId === node.id) continue;

        const pathId = `${node.id}->${targetId}`;
        if (pathIdSet.has(pathId)) continue;

        pathIdSet.add(pathId);

        // Create waypoints
        const steps = 5;
        const waypoints: GridPoint[] = [];
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          waypoints.push({
            gridX: sourcePos.gridX + (targetPos.gridX - sourcePos.gridX) * t,
            gridY: sourcePos.gridY + (targetPos.gridY - sourcePos.gridY) * t,
          });
        }

        paths.push({
          id: pathId,
          from: node.id,
          to: targetId,
          points: waypoints,
          type: 'dependency',
          style: 'dotted',
        });
      }
    }

    // Dev dependencies
    if (includeDevDependencies && node.devDependencies) {
      for (const targetId of node.devDependencies) {
        if (!nodeIds.has(targetId)) continue;

        const targetPos = positions.get(targetId);
        if (!targetPos || targetId === node.id) continue;

        const pathId = `${node.id}->${targetId}`;
        if (pathIdSet.has(pathId)) continue;

        pathIdSet.add(pathId);

        const steps = 5;
        const waypoints: GridPoint[] = [];
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          waypoints.push({
            gridX: sourcePos.gridX + (targetPos.gridX - sourcePos.gridX) * t,
            gridY: sourcePos.gridY + (targetPos.gridY - sourcePos.gridY) * t,
          });
        }

        paths.push({
          id: pathId,
          from: node.id,
          to: targetId,
          points: waypoints,
          type: 'dev-dependency',
          style: 'dashed',
        });
      }
    }
  }

  // Calculate map bounds
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  locationNodes.forEach((node) => {
    minX = Math.min(minX, node.gridX);
    maxX = Math.max(maxX, node.gridX + node.size);
    minY = Math.min(minY, node.gridY);
    maxY = Math.max(maxY, node.gridY + node.size);
  });

  const calculatedWidth = Math.ceil(maxX - minX) + mapPadding * 2;
  const calculatedHeight = Math.ceil(maxY - minY) + mapPadding * 2;

  // Make regions square - use the larger dimension for both, ensure it's a whole number
  const squareSize = Math.ceil(Math.max(calculatedWidth, calculatedHeight));
  const mapWidth = squareSize;
  const mapHeight = squareSize;

  // Offset all positions to center content in square region
  const extraHorizontalSpace = Math.floor((squareSize - calculatedWidth) / 2);
  const extraVerticalSpace = Math.floor((squareSize - calculatedHeight) / 2);

  const offsetX = mapPadding + extraHorizontalSpace - minX;
  const offsetY = mapPadding + extraVerticalSpace - minY;

  locationNodes.forEach((node) => {
    node.gridX += offsetX;
    node.gridY += offsetY;
  });

  paths.forEach((path) => {
    path.points.forEach((point) => {
      point.gridX += offsetX;
      point.gridY += offsetY;
    });
  });

  // Generate terrain
  const tiles = generateTerrain(mapWidth, mapHeight, locationNodes, paths);

  return {
    width: mapWidth,
    height: mapHeight,
    tiles,
    nodes: locationNodes,
    paths,
    regions: [
      {
        id: 'region-0',
        name: 'Main Area',
        description: 'Primary region',
        bounds: { x: 0, y: 0, width: mapWidth, height: mapHeight },
        centerX: mapWidth / 2,
        centerY: mapHeight / 2,
        nodeIds: locationNodes.map((n) => n.id),
      },
    ],
    name: 'Overworld Map',
    description: 'Generic node dependency map',
  };
}

/**
 * Split nodes into regions using flow layout
 * Places nodes left-to-right, wrapping to next row when full
 * Creates new region when current region runs out of vertical space
 */
function splitNodesIntoRegions(
  nodes: GenericNode[],
  regionSize: number // Size in tiles (e.g., 30x30)
): GenericNode[][] {
  if (nodes.length === 0) return [];

  // Sort by priority first
  const sortedNodes = [...nodes].sort((a, b) => {
    return calculateLayoutPriority(b) - calculateLayoutPriority(a);
  });

  const groups: GenericNode[][] = [];
  let currentGroup: GenericNode[] = [];
  let currentX = 1; // Current horizontal position in region
  let currentY = 1; // Current vertical position in region
  let rowHeight = 0; // Height of tallest node in current row
  const padding = 1; // Padding between nodes

  for (const node of sortedNodes) {
    const nodeRadius = getNodeHighlightRadius(node);
    const nodeDiameter = nodeRadius * 2;

    // Check if node fits horizontally in current row
    const nodeRight = currentX + nodeRadius;
    if (nodeRight > regionSize - 1) {
      // Move to next row
      currentX = 1;
      currentY += rowHeight + padding;
      rowHeight = 0;
    }

    // Check if node fits vertically in current region
    const nodeBottom = currentY + nodeRadius;
    if (nodeBottom > regionSize - 1) {
      // Start new region
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [];
      currentX = 1;
      currentY = 1;
      rowHeight = 0;
    }

    // Place node
    currentGroup.push(node);
    currentX += nodeDiameter + padding; // Move cursor right
    rowHeight = Math.max(rowHeight, nodeDiameter); // Track row height
  }

  // Add final group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Convert generic nodes to unified OverworldMap with automatic layout
 * Uses circle packing algorithm for collision-free placement
 */
export function nodesToUnifiedOverworldMap(
  nodes: GenericNode[],
  options: GenericMapperOptions = {}
): OverworldMap {
  // Calculate consistent size for each node (used by both layout and rendering)
  // CRITICAL: Layout engine and renderer must use the same size value
  const nodeWithSizes = nodes.map(node => {
    const isRoot = node.isRoot || false;
    const nodeType = options.getNodeType
      ? options.getNodeType(node)
      : determineNodeType(node, isRoot);
    // Use node.size if provided, otherwise fall back to type-based size
    const size = node.size ?? getNodeSize(nodeType);
    return { ...node, size };
  });

  // Use automatic layout engine for positioning
  const layoutNodes: Array<{ id: string; size: number; language?: string; lastEditedAt?: string }> = nodeWithSizes.map(node => ({
    id: node.id,
    size: node.size, // Now guaranteed to have a size
    language: node.language,
    lastEditedAt: node.aging?.lastEditedAt, // Pass through for age-based grouping
  }));

  // Layout nodes across regions using circle packing with age-based grouping
  const layoutRegions = layoutSpritesMultiRegion(layoutNodes, REGION_SIZE_TILES, { spacing: 0.5 });

  // Create node position lookup
  const nodePositions = new Map<string, { gridX: number; gridY: number; size: number; language?: string }>();
  for (const region of layoutRegions) {
    for (const layoutNode of region.nodes) {
      nodePositions.set(layoutNode.id, {
        gridX: layoutNode.gridX,
        gridY: layoutNode.gridY,
        size: layoutNode.size,
        language: layoutNode.language,
      });
    }
  }

  // Convert to LocationNodes
  const locationNodes: LocationNode[] = nodeWithSizes.map((node) => {
    const pos = nodePositions.get(node.id) || { gridX: 0, gridY: 0, size: node.size };
    const isRoot = node.isRoot || false;
    const theme = getCategoryTheme(node.category, options.getCategoryTheme);
    const nodeType = options.getNodeType
      ? options.getNodeType(node)
      : determineNodeType(node, isRoot);
    const size = node.size; // Already computed above to match layout engine
    const color = options.getNodeColor
      ? options.getNodeColor(node)
      : getCategoryColor(node.category || node.language, isRoot);

    // Generate sprite key for building sprites: building-{size}-{color}
    const spriteKey = `building-${size.toFixed(2)}-${color}`;

    // Validate packageType
    const packageType = (['node', 'python', 'cargo', 'go', 'package'] as const).includes(
      node.category as any
    )
      ? (node.category as 'node' | 'python' | 'cargo' | 'go' | 'package')
      : 'package';

    return {
      id: node.id,
      gridX: pos.gridX,
      gridY: pos.gridY,
      type: nodeType,
      sprite: spriteKey,
      size,
      theme,
      label: node.name,
      packageType,
      isRoot,
      color,
      aging: node.aging,
    };
  });

  // Create paths between nodes
  const paths: PathConnection[] = [];
  let pathId = 0;
  for (const node of nodeWithSizes) {
    const fromPos = nodePositions.get(node.id);
    if (!fromPos) continue;

    // Production dependencies
    if (node.dependencies) {
      for (const depId of node.dependencies) {
        const toPos = nodePositions.get(depId);
        if (!toPos) continue;

        // Simple straight line path
        paths.push({
          id: `path-${pathId++}`,
          from: node.id,
          to: depId,
          points: [
            { gridX: fromPos.gridX, gridY: fromPos.gridY },
            { gridX: toPos.gridX, gridY: toPos.gridY },
          ],
          type: 'dependency',
          style: 'solid',
        });
      }
    }

    // Dev dependencies
    if (node.devDependencies && options.includeDevDependencies) {
      for (const depId of node.devDependencies) {
        const toPos = nodePositions.get(depId);
        if (!toPos) continue;

        // Simple straight line path with dashed style for dev deps
        paths.push({
          id: `path-${pathId++}`,
          from: node.id,
          to: depId,
          points: [
            { gridX: fromPos.gridX, gridY: fromPos.gridY },
            { gridX: toPos.gridX, gridY: toPos.gridY },
          ],
          type: 'dev-dependency',
          style: 'dashed',
        });
      }
    }
  }

  // Calculate total map dimensions
  const maxCol = Math.max(...layoutRegions.map(r => r.gridPosition.col));
  const maxRow = Math.max(...layoutRegions.map(r => r.gridPosition.row));
  const totalCols = maxCol + 1;
  const totalRows = maxRow + 1;
  const mapWidth = totalCols * REGION_SIZE_TILES;
  const mapHeight = totalRows * REGION_SIZE_TILES;

  // Create regions with age bucket names if available
  const regions: MapRegion[] = layoutRegions.map(region => ({
    id: region.regionId,
    name: region.name || `Region ${region.gridPosition.row}-${region.gridPosition.col}`,
    bounds: region.bounds,
    centerX: region.bounds.x + region.bounds.width / 2,
    centerY: region.bounds.y + region.bounds.height / 2,
    nodeIds: region.nodes.map(n => n.id),
  }));

  return {
    width: mapWidth,
    height: mapHeight,
    tiles: [],
    nodes: locationNodes,
    paths,
    regions,
    name: 'Auto Layout Map',
  };
}

/**
 * Convert generic nodes to single-region OverworldMap
 * Uses manual positioning (kept for backward compatibility)
 */
function nodesToOverworldMapOld(
  nodes: GenericNode[],
  options: GenericMapperOptions = {}
): OverworldMap {
  // Split nodes into regions based on spatial constraints
  // Regions are fixed-size square areas (50x50 tiles)
  const nodeGroups = splitNodesIntoRegions(nodes, REGION_SIZE_TILES);

  if (nodeGroups.length === 1) {
    // Single region - just use regular map
    const map = nodesToOverworldMap(nodeGroups[0], options);
    return {
      ...map,
      regions: [
        {
          id: 'region-0',
          name: 'Main Area',
          description: 'Primary region',
          bounds: { x: 0, y: 0, width: map.width, height: map.height },
          centerX: map.width / 2,
          centerY: map.height / 2,
          nodeIds: map.nodes.map((n) => n.id),
        },
      ],
    };
  }

  // Multiple regions - create unified map with 2D layout
  const REGION_SPACING = 5; // Tiles between regions (for water bridges)

  // All regions are the same fixed square size (defined above)
  // Generate individual maps for each region
  const regionMaps = nodeGroups.map((group) => nodesToOverworldMap(group, options));

  // Determine region layout (default: horizontal row)
  const regionLayout = options.regionLayout || {
    columns: nodeGroups.length,
    rows: 1,
    fillDirection: 'row-major',
  };

  const allNodes: LocationNode[] = [];
  const allPaths: PathConnection[] = [];
  const regions: MapRegion[] = [];
  const horizontalBridges: number[] = []; // X positions for vertical bridges
  const verticalBridges: number[] = []; // Y positions for horizontal bridges

  // Calculate grid positions for each region
  const gridPositions: Array<{ row: number; col: number }> = [];
  const fillDirection = regionLayout.fillDirection || 'row-major';

  for (let i = 0; i < regionMaps.length; i++) {
    if (fillDirection === 'row-major') {
      // Fill left-to-right, then down
      const row = Math.floor(i / regionLayout.columns);
      const col = i % regionLayout.columns;
      gridPositions.push({ row, col });
    } else {
      // Fill top-to-bottom, then right
      const col = Math.floor(i / regionLayout.rows);
      const row = i % regionLayout.rows;
      gridPositions.push({ row, col });
    }
  }

  // Place regions in 2D grid
  regionMaps.forEach((regionMap, index) => {
    const gridPos = gridPositions[index];

    // Calculate screen position for this grid cell
    const regionX = gridPos.col * (REGION_SIZE_TILES + REGION_SPACING);
    const regionY = gridPos.row * (REGION_SIZE_TILES + REGION_SPACING);

    // Center this region's content within the uniform square - use floor to ensure whole tiles
    const xOffset = regionX + Math.floor((REGION_SIZE_TILES - regionMap.width) / 2);
    const yOffset = regionY + Math.floor((REGION_SIZE_TILES - regionMap.height) / 2);

    // Offset all nodes in this region
    const offsetNodes = regionMap.nodes.map((node) => ({
      ...node,
      gridX: node.gridX + xOffset,
      gridY: node.gridY + yOffset,
    }));

    // Offset all paths in this region
    const offsetPaths = regionMap.paths.map((path) => ({
      ...path,
      points: path.points.map((point) => ({
        gridX: point.gridX + xOffset,
        gridY: point.gridY + yOffset,
      })),
    }));

    allNodes.push(...offsetNodes);
    allPaths.push(...offsetPaths);

    // Track region bounds - all regions are now uniform squares
    regions.push({
      id: `region-${index}`,
      name: `Region ${index + 1}`,
      description: `Contains ${offsetNodes.length} nodes`,
      gridPosition: gridPos,
      bounds: {
        x: regionX,
        y: regionY,
        width: REGION_SIZE_TILES,
        height: REGION_SIZE_TILES,
      },
      centerX: regionX + REGION_SIZE_TILES / 2,
      centerY: regionY + REGION_SIZE_TILES / 2,
      nodeIds: offsetNodes.map((n) => n.id),
    });

    // Track bridges between adjacent regions
    // Vertical bridge to the right (if not last column)
    if (gridPos.col < regionLayout.columns - 1) {
      const nextRegionExists = gridPositions.some(
        (p) => p.row === gridPos.row && p.col === gridPos.col + 1
      );
      if (nextRegionExists) {
        const bridgeX = regionX + REGION_SIZE_TILES + Math.floor(REGION_SPACING / 2);
        horizontalBridges.push(bridgeX);
      }
    }

    // Horizontal bridge below (if not last row)
    if (gridPos.row < regionLayout.rows - 1) {
      const belowRegionExists = gridPositions.some(
        (p) => p.row === gridPos.row + 1 && p.col === gridPos.col
      );
      if (belowRegionExists) {
        const bridgeY = regionY + REGION_SIZE_TILES + Math.floor(REGION_SPACING / 2);
        verticalBridges.push(bridgeY);
      }
    }
  });

  // Calculate total map dimensions
  const totalWidth = regionLayout.columns * REGION_SIZE_TILES + (regionLayout.columns - 1) * REGION_SPACING;
  const totalHeight = regionLayout.rows * REGION_SIZE_TILES + (regionLayout.rows - 1) * REGION_SPACING;

  // Generate unified terrain with bridges
  const tiles = generateTerrain(totalWidth, totalHeight, allNodes, allPaths, horizontalBridges, verticalBridges);

  return {
    width: totalWidth,
    height: totalHeight,
    tiles,
    nodes: allNodes,
    paths: allPaths,
    regions,
    name: 'Unified Overworld',
    description: `${nodes.length} nodes across ${regions.length} regions`,
  };
}

/**
 * Convert generic nodes to OverworldMapCollection
 * @deprecated Use nodesToUnifiedOverworldMap instead for better UX
 * Automatically splits into multiple maps if too many nodes
 */
export function nodesToOverworldMapCollection(
  nodes: GenericNode[],
  options: GenericMapperOptions = {}
): OverworldMapCollection {
  const nodeGroups = splitNodesIntoRegions(nodes, REGION_SIZE_TILES);

  const maps: OverworldMap[] = nodeGroups.map((group, index) => {
    const map = nodesToOverworldMap(group, options);

    return {
      ...map,
      regions: [
        {
          id: 'region-0',
          name: map.name || 'Main Area',
          description: map.description,
          bounds: { x: 0, y: 0, width: map.width, height: map.height },
          centerX: map.width / 2,
          centerY: map.height / 2,
          nodeIds: map.nodes.map((n) => n.id),
        },
      ],
      name: nodeGroups.length > 1 ? `World ${index + 1}` : 'Overworld Map',
      description:
        nodeGroups.length > 1
          ? `Map ${index + 1} of ${nodeGroups.length}`
          : 'Generic node dependency map',
    };
  });

  return {
    maps,
    currentMapIndex: 0,
    totalPackages: nodes.length,
  };
}
