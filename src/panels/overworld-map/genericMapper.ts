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
} from './types';
import { REGION_SIZE_TILES } from './types';
import type { AgingMetrics } from '../../utils/repositoryAging';
import { layoutSpritesMultiRegion, layoutSpritesInRegion } from './spriteLayoutEngine';

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

  // Region assignment
  regionId?: string;          // Which custom region this node is assigned to

  // Saved position data
  layout?: {
    gridX?: number;
    gridY?: number;
  };
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
  customRegions?: any[]; // Manual region definitions for manual layout mode

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

  // Layout nodes across regions
  let layoutRegions: Array<{
    regionId: string;
    name: string;
    gridPosition: { row: number; col: number };
    bounds: { x: number; y: number; width: number; height: number };
    nodes: Array<{ id: string; gridX: number; gridY: number; size: number; language?: string }>;
  }>;

  // If custom regions are provided (manual mode), create empty regions at their positions
  if (options.customRegions && options.customRegions.length > 0) {
    layoutRegions = options.customRegions.map((customRegion: any) => {
      // Calculate grid position from order (row-major layout with 10 columns max)
      const row = Math.floor(customRegion.order / 10);
      const col = customRegion.order % 10;

      return {
        regionId: customRegion.id,
        name: customRegion.name,
        gridPosition: { row, col },
        bounds: {
          x: col * REGION_SIZE_TILES,
          y: row * REGION_SIZE_TILES,
          width: REGION_SIZE_TILES,
          height: REGION_SIZE_TILES,
        },
        nodes: [], // Will be filled by layout engine below
      };
    });

    // Distribute nodes across custom regions based on their regionId assignments
    // Group nodes by their assigned regionId
    const nodesByRegion = new Map<string, typeof layoutNodes>();
    const unassignedNodes: typeof layoutNodes = [];

    for (const layoutNode of layoutNodes) {
      // Find the original GenericNode to get its regionId
      const genericNode = nodeWithSizes.find(n => n.id === layoutNode.id);
      const assignedRegionId = genericNode?.regionId;

      if (assignedRegionId && layoutRegions.some(r => r.regionId === assignedRegionId)) {
        // Node has a valid region assignment
        if (!nodesByRegion.has(assignedRegionId)) {
          nodesByRegion.set(assignedRegionId, []);
        }
        nodesByRegion.get(assignedRegionId)!.push(layoutNode);
      } else {
        // Node is unassigned or assigned to non-existent region
        unassignedNodes.push(layoutNode);
      }
    }

    // Place nodes in their assigned regions
    for (const region of layoutRegions) {
      const regionNodes = nodesByRegion.get(region.regionId) || [];

      if (regionNodes.length === 0) {
        // Empty region - leave it empty
        region.nodes = [];
        continue;
      }

      // Separate nodes with saved positions from nodes without positions
      const savedPositions: typeof regionNodes = [];
      const needsPositioning: typeof regionNodes = [];

      for (const layoutNode of regionNodes) {
        const genericNode = nodeWithSizes.find(n => n.id === layoutNode.id);
        // Use saved position if it exists
        if (genericNode?.layout?.gridX !== undefined &&
            genericNode.layout.gridY !== undefined) {
          savedPositions.push(layoutNode);
        } else {
          needsPositioning.push(layoutNode);
        }
      }

      const placedNodes: Array<{id: string, gridX: number, gridY: number, size: number, language?: string}> = [];

      // Place nodes with saved positions first
      for (const layoutNode of savedPositions) {
        const genericNode = nodeWithSizes.find(n => n.id === layoutNode.id);
        if (genericNode?.layout?.gridX !== undefined && genericNode.layout.gridY !== undefined) {
          placedNodes.push({
            id: layoutNode.id,
            gridX: region.bounds.x + genericNode.layout.gridX,
            gridY: region.bounds.y + genericNode.layout.gridY,
            size: layoutNode.size,
            language: layoutNode.language,
          });
        }
      }

      // Use circle packing for nodes without saved positions
      if (needsPositioning.length > 0) {
        const result = layoutSpritesInRegion(needsPositioning, {
          width: REGION_SIZE_TILES,
          height: REGION_SIZE_TILES,
        }, { spacing: 0.5 });

        // Add auto-positioned nodes to placed nodes
        placedNodes.push(...result.placed.map(node => ({
          id: node.id,
          gridX: region.bounds.x + node.gridX,
          gridY: region.bounds.y + node.gridY,
          size: node.size,
          language: node.language,
        })));

        if (result.overflow.length > 0) {
          console.warn(`[nodesToUnifiedOverworldMap] ${result.overflow.length} nodes didn't fit in region ${region.name}`);
        }
      }

      region.nodes = placedNodes;
    }

    // Distribute unassigned nodes across regions by age
    // This provides a sensible initial placement when repos don't have region assignments
    if (unassignedNodes.length > 0 && layoutRegions.length > 0) {
      // Use age-based distribution if nodes have lastEditedAt data
      const hasAgeData = unassignedNodes.some(n => {
        const genericNode = nodeWithSizes.find(gn => gn.id === n.id);
        return genericNode?.aging?.lastEditedAt;
      });

      if (hasAgeData && layoutRegions.length >= 2) {
        // Distribute by age across available regions
        // Map age buckets to regions (evenly distributed)
        const regionMapping = new Map<string, typeof layoutRegions[0]>();
        const ageBuckets = ['LAST_MONTH', 'LAST_3_MONTHS', 'LAST_YEAR', 'OLDER'];

        ageBuckets.forEach((bucket, index) => {
          const regionIndex = Math.floor((index / ageBuckets.length) * layoutRegions.length);
          regionMapping.set(bucket, layoutRegions[Math.min(regionIndex, layoutRegions.length - 1)]);
        });

        // Helper to get age bucket
        const getAgeBucket = (lastEditedAt?: string): string => {
          if (!lastEditedAt) return 'OLDER';
          const now = Date.now();
          const editTime = new Date(lastEditedAt).getTime();
          const daysAgo = (now - editTime) / (1000 * 60 * 60 * 24);
          if (daysAgo <= 30) return 'LAST_MONTH';
          if (daysAgo <= 90) return 'LAST_3_MONTHS';
          if (daysAgo <= 365) return 'LAST_YEAR';
          return 'OLDER';
        };

        // Group unassigned nodes by age
        const nodesByAge = new Map<string, typeof unassignedNodes>();
        for (const node of unassignedNodes) {
          const genericNode = nodeWithSizes.find(n => n.id === node.id);
          const bucket = getAgeBucket(genericNode?.aging?.lastEditedAt);
          if (!nodesByAge.has(bucket)) {
            nodesByAge.set(bucket, []);
          }
          nodesByAge.get(bucket)!.push(node);
        }

        // Place each age group in its corresponding region
        for (const [bucket, nodes] of nodesByAge.entries()) {
          const targetRegion = regionMapping.get(bucket) || layoutRegions[0];
          const result = layoutSpritesInRegion(nodes, {
            width: REGION_SIZE_TILES,
            height: REGION_SIZE_TILES,
          }, { spacing: 0.5 });

          // Append to region's nodes
          targetRegion.nodes.push(...result.placed.map(node => ({
            id: node.id,
            gridX: targetRegion.bounds.x + node.gridX,
            gridY: targetRegion.bounds.y + node.gridY,
            size: node.size,
            language: node.language,
          })));
        }
      } else {
        // Fallback: Place all unassigned nodes in the first region
        const firstRegion = layoutRegions[0];
        const result = layoutSpritesInRegion(unassignedNodes, {
          width: REGION_SIZE_TILES,
          height: REGION_SIZE_TILES,
        }, { spacing: 0.5 });

        // Append to first region's nodes
        firstRegion.nodes.push(...result.placed.map(node => ({
          id: node.id,
          gridX: firstRegion.bounds.x + node.gridX,
          gridY: firstRegion.bounds.y + node.gridY,
          size: node.size,
          language: node.language,
        })));
      }
    }
  } else {
    // Use automatic age-based grouping
    const autoLayoutRegions = layoutSpritesMultiRegion(layoutNodes, REGION_SIZE_TILES, { spacing: 0.5 });

    // Convert to required format with guaranteed names
    layoutRegions = autoLayoutRegions.map((region, index) => ({
      regionId: region.regionId,
      name: region.name || `Region ${index + 1}`,
      gridPosition: region.gridPosition,
      bounds: region.bounds,
      nodes: region.nodes,
    }));

    // If no layout regions were created (no nodes), create at least one empty region
    // This ensures the map always has at least one region to render
    if (layoutRegions.length === 0) {
      layoutRegions.push({
        regionId: 'region-0-0',
        name: 'Main',
        gridPosition: { row: 0, col: 0 },
        bounds: { x: 0, y: 0, width: REGION_SIZE_TILES, height: REGION_SIZE_TILES },
        nodes: [],
      });
    }
  }

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

  // Calculate total map dimensions (accounting for negative positions like staging region)
  const minCol = Math.min(...layoutRegions.map(r => r.gridPosition.col));
  const maxCol = Math.max(...layoutRegions.map(r => r.gridPosition.col));
  const minRow = Math.min(...layoutRegions.map(r => r.gridPosition.row));
  const maxRow = Math.max(...layoutRegions.map(r => r.gridPosition.row));
  const totalCols = maxCol - minCol + 1;
  const totalRows = maxRow - minRow + 1;
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
