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
import { MAX_NODES_PER_MAP } from './types';

/**
 * Generic node - represents any entity (package, repo, service, etc.)
 */
export interface GenericNode {
  id: string;
  name: string;
  isRoot?: boolean;

  // For determining visual representation
  category?: string;      // e.g., 'frontend', 'backend', 'database', 'python', 'node'
  importance?: number;    // 0-100, affects building size

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
 * Layout nodes in a circular pattern
 */
function layoutNodes(nodes: GenericNode[]): Map<string, GridPoint> {
  const positions = new Map<string, GridPoint>();

  // Find root node
  const rootNode = nodes.find((n) => n.isRoot);

  if (!rootNode) {
    // No root, arrange in grid
    const cols = Math.ceil(Math.sqrt(nodes.length));
    nodes.forEach((node, index) => {
      const x = (index % cols) * 4;
      const y = Math.floor(index / cols) * 4;
      positions.set(node.id, { gridX: x, gridY: y });
    });
    return positions;
  }

  // Place root in center
  const centerX = 10;
  const centerY = 10;
  positions.set(rootNode.id, { gridX: centerX, gridY: centerY });

  // Get dependencies of root
  const rootDeps = new Set([
    ...(rootNode.dependencies || []),
    ...(rootNode.devDependencies || []),
  ]);

  // Separate into direct dependencies and others
  const directDeps: GenericNode[] = [];
  const others: GenericNode[] = [];

  nodes.forEach((node) => {
    if (node.id === rootNode.id) return;

    if (rootDeps.has(node.id)) {
      directDeps.push(node);
    } else {
      others.push(node);
    }
  });

  // Arrange direct dependencies in circle
  const radius = 5;
  directDeps.forEach((node, index) => {
    const angle = (index / directDeps.length) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    positions.set(node.id, { gridX: Math.round(x), gridY: Math.round(y) });
  });

  // Arrange others in outer ring
  const outerRadius = 9;
  others.forEach((node, index) => {
    const angle = (index / others.length) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * outerRadius;
    const y = centerY + Math.sin(angle) * outerRadius;
    positions.set(node.id, { gridX: Math.round(x), gridY: Math.round(y) });
  });

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
 */
export function nodesToOverworldMap(
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

  // Create location nodes
  const locationNodes: LocationNode[] = nodes.map((node) => {
    const pos = positions.get(node.id) || { gridX: 0, gridY: 0 };
    const isRoot = node.isRoot || false;
    const theme = getCategoryTheme(node.category, customThemeMapper);
    const nodeType = customNodeTypeMapper
      ? customNodeTypeMapper(node)
      : determineNodeType(node, isRoot);
    const size = getNodeSize(nodeType);
    const color = customColorMapper
      ? customColorMapper(node)
      : getCategoryColor(node.category, isRoot);

    return {
      id: node.id,
      gridX: pos.gridX,
      gridY: pos.gridY,
      type: nodeType,
      sprite: `location-${nodeType}-${theme}`,
      size,
      theme,
      label: node.name,
      packageType: (node.category as any) || 'package', // Keep for backwards compat
      isRoot,
      color,
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
  const contentWidth = calculatedWidth - mapPadding * 2;
  const contentHeight = calculatedHeight - mapPadding * 2;
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
 * Split nodes into multiple maps if needed
 */
function splitNodesIntoGroups(
  nodes: GenericNode[],
  maxPerMap: number
): GenericNode[][] {
  if (nodes.length <= maxPerMap) {
    return [nodes];
  }

  const groups: GenericNode[][] = [];
  const rootNode = nodes.find((n) => n.isRoot);

  if (rootNode) {
    const rootDeps = new Set([
      ...(rootNode.dependencies || []),
      ...(rootNode.devDependencies || []),
    ]);

    const group1: GenericNode[] = [rootNode];
    const remaining: GenericNode[] = [];

    nodes.forEach((node) => {
      if (node.id === rootNode.id) return;

      if (rootDeps.has(node.id) && group1.length < maxPerMap) {
        group1.push(node);
      } else {
        remaining.push(node);
      }
    });

    groups.push(group1);

    for (let i = 0; i < remaining.length; i += maxPerMap) {
      groups.push(remaining.slice(i, i + maxPerMap));
    }
  } else {
    for (let i = 0; i < nodes.length; i += maxPerMap) {
      groups.push(nodes.slice(i, i + maxPerMap));
    }
  }

  return groups;
}

/**
 * Convert generic nodes to unified OverworldMap with regions
 * Creates one continuous map with spatially separated regions
 */
export function nodesToUnifiedOverworldMap(
  nodes: GenericNode[],
  options: GenericMapperOptions = {}
): OverworldMap {
  // Split nodes into regions
  const nodeGroups = splitNodesIntoGroups(nodes, MAX_NODES_PER_MAP);

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
  const REGION_SPACING = 5; // Tiles between regions

  // First pass: generate all regions to find the largest square size needed
  const regionMaps = nodeGroups.map((group) => nodesToOverworldMap(group, options));
  const maxRegionSize = Math.max(...regionMaps.map((rm) => Math.max(rm.width, rm.height)));

  // Make all regions the same square size - ensure it's a whole number
  const REGION_SIZE = Math.ceil(maxRegionSize);

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
    const regionX = gridPos.col * (REGION_SIZE + REGION_SPACING);
    const regionY = gridPos.row * (REGION_SIZE + REGION_SPACING);

    // Center this region's content within the uniform square - use floor to ensure whole tiles
    const xOffset = regionX + Math.floor((REGION_SIZE - regionMap.width) / 2);
    const yOffset = regionY + Math.floor((REGION_SIZE - regionMap.height) / 2);

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
        width: REGION_SIZE,
        height: REGION_SIZE,
      },
      centerX: regionX + REGION_SIZE / 2,
      centerY: regionY + REGION_SIZE / 2,
      nodeIds: offsetNodes.map((n) => n.id),
    });

    // Track bridges between adjacent regions
    // Vertical bridge to the right (if not last column)
    if (gridPos.col < regionLayout.columns - 1) {
      const nextRegionExists = gridPositions.some(
        (p) => p.row === gridPos.row && p.col === gridPos.col + 1
      );
      if (nextRegionExists) {
        const bridgeX = regionX + REGION_SIZE + Math.floor(REGION_SPACING / 2);
        horizontalBridges.push(bridgeX);
      }
    }

    // Horizontal bridge below (if not last row)
    if (gridPos.row < regionLayout.rows - 1) {
      const belowRegionExists = gridPositions.some(
        (p) => p.row === gridPos.row + 1 && p.col === gridPos.col
      );
      if (belowRegionExists) {
        const bridgeY = regionY + REGION_SIZE + Math.floor(REGION_SPACING / 2);
        verticalBridges.push(bridgeY);
      }
    }
  });

  // Calculate total map dimensions
  const totalWidth = regionLayout.columns * REGION_SIZE + (regionLayout.columns - 1) * REGION_SPACING;
  const totalHeight = regionLayout.rows * REGION_SIZE + (regionLayout.rows - 1) * REGION_SPACING;

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
  const nodeGroups = splitNodesIntoGroups(nodes, MAX_NODES_PER_MAP);

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
