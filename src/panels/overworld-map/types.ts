/**
 * Core type definitions for 8-bit overworld map
 */

// Tile size constant
export const TILE_SIZE = 32;

/**
 * Basic point in grid coordinates
 */
export interface GridPoint {
  gridX: number;
  gridY: number;
}

/**
 * Theme/Biome types for different package languages
 */
export type BiomeTheme = 'grass' | 'desert' | 'water' | 'volcano' | 'ice';

/**
 * Tile types for the terrain grid
 */
export type TileType =
  | 'grass'
  | 'water'
  | 'path'
  | 'mountain'
  | 'sand'
  | 'ice'
  | 'lava'
  | 'empty';

/**
 * Individual tile in the grid
 */
export interface Tile {
  x: number;           // Grid X position
  y: number;           // Grid Y position
  type: TileType;
  spriteIndex: number; // Which sprite variant to use
  biome: BiomeTheme;
}

/**
 * Location node types (different building/landmark types)
 */
export type LocationNodeType =
  | 'castle'       // Main package/root
  | 'fortress'     // Large package
  | 'house'        // Regular package
  | 'tower'        // Special package
  | 'pipe'         // Entry point
  | 'git-repo'     // Single package git repository
  | 'monorepo';    // Multi-package monorepo

/**
 * Location node representing a package on the map
 */
export interface LocationNode {
  id: string;
  gridX: number;
  gridY: number;
  type: LocationNodeType;
  sprite: string;
  size: number;        // Size in tiles (2 = 2x2 tiles)
  theme: BiomeTheme;

  // Package metadata
  label: string;       // Package name
  packageType: 'node' | 'python' | 'cargo' | 'go' | 'package';
  isRoot: boolean;
  color: string;       // Accent color
}

/**
 * Path connection style
 */
export type PathStyle = 'dotted' | 'solid' | 'dashed' | 'bridge';

/**
 * Path connection type
 */
export type PathConnectionType = 'dependency' | 'dev-dependency';

/**
 * Connection path between two locations
 */
export interface PathConnection {
  id: string;
  from: string;        // Source node ID
  to: string;          // Target node ID
  points: GridPoint[]; // Waypoints for the path
  type: PathConnectionType;
  style: PathStyle;
}

/**
 * Decorative sprite types
 */
export type DecorativeSpriteType =
  | 'cloud'
  | 'tree'
  | 'bush'
  | 'rock'
  | 'flower'
  | 'mushroom'
  | 'cactus';

/**
 * Layer for z-ordering
 */
export type RenderLayer = 'background' | 'foreground';

/**
 * Decorative sprite for visual flair
 */
export interface DecorativeSprite {
  id: string;
  gridX: number;
  gridY: number;
  sprite: DecorativeSpriteType;
  layer: RenderLayer;
  animated?: boolean;
  animationSpeed?: number;
}

/**
 * Biome zone definition
 */
export interface BiomeZone {
  id: string;
  bounds: {
    x: number;         // Grid coordinates
    y: number;
    width: number;     // In tiles
    height: number;    // In tiles
  };
  theme: BiomeTheme;
  backgroundColor: string;
}

/**
 * Camera/viewport configuration
 */
export interface Camera {
  x: number;           // World position in pixels
  y: number;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * Map limits and configuration
 */
export const MAX_NODES_PER_MAP = 12; // Max packages per individual map
export const MAP_TRANSITION_THRESHOLD = 10; // When to suggest splitting

/**
 * Region within a unified map
 */
export interface MapRegion {
  id: string;
  name: string;
  description?: string;

  // Grid position (which cell in the region grid)
  gridPosition?: {
    row: number;      // Grid row (0-based)
    col: number;      // Grid column (0-based)
  };

  // Spatial bounds in grid coordinates
  bounds: {
    x: number;        // Start X in grid
    y: number;        // Start Y in grid
    width: number;    // Width in tiles
    height: number;   // Height in tiles
  };

  // Center point for camera focus
  centerX: number;
  centerY: number;

  // Nodes belonging to this region
  nodeIds: string[];
}

/**
 * Complete overworld map data structure (unified map with regions)
 */
export interface OverworldMap {
  // Grid dimensions (entire map)
  width: number;       // Width in tiles
  height: number;      // Height in tiles

  // Core elements (all regions combined)
  tiles: Tile[];
  nodes: LocationNode[];
  paths: PathConnection[];

  // Optional elements
  decorations?: DecorativeSprite[];
  biomeZones?: BiomeZone[];

  // Regions (for navigation/focus)
  regions: MapRegion[];

  // Metadata
  name: string;
  description?: string;
}

/**
 * Collection of multiple overworld maps (deprecated - use single map with regions)
 * @deprecated Use OverworldMap with regions instead
 */
export interface OverworldMapCollection {
  maps: OverworldMap[];
  currentMapIndex: number;
  totalPackages: number;
}

/**
 * Isometric coordinate conversion
 */
export interface IsometricCoords {
  screenX: number;
  screenY: number;
}

/**
 * Sprite definition in atlas
 */
export interface SpriteDefinition {
  name: string;
  x: number;          // Position in atlas
  y: number;
  width: number;
  height: number;
}

/**
 * Sprite atlas/tileset
 */
export interface SpriteAtlas {
  image?: HTMLImageElement;
  imageUrl?: string;
  sprites: Record<string, SpriteDefinition>;
  tileSize: number;
}

/**
 * Map configuration/settings
 */
export interface MapConfig {
  showGrid: boolean;
  showPaths: boolean;
  showDecorations: boolean;
  enableAnimations: boolean;
  cameraSpeed: number;
  zoomSpeed: number;
  minZoom: number;
  maxZoom: number;
}
