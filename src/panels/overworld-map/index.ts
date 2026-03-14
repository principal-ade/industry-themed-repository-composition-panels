/**
 * Overworld Map Panel - 8-bit dependency visualization
 */

export {
  OverworldMapPanelContent,
  OverworldMapPanelPreview,
} from './OverworldMapPanel';
export type { OverworldMapPanelProps } from './OverworldMapPanel';

// Export types for external use
export type {
  OverworldMap,
  OverworldMapCollection,
  MapRegion,
  LocationNode,
  PathConnection,
  Tile,
  BiomeTheme,
  LocationNodeType,
  Camera,
  GridPoint,
} from './types';

// Export constants
export { MAX_NODES_PER_MAP, MAP_TRANSITION_THRESHOLD } from './types';

// Export utilities
export {
  gridToScreen,
  screenToGrid,
  getIsometricZIndex,
  ISO_TILE_WIDTH,
  ISO_TILE_HEIGHT,
} from './isometricUtils';

// Export generic mapper for custom use cases
export {
  nodesToOverworldMap,
  nodesToUnifiedOverworldMap,
  nodesToOverworldMapCollection,
} from './genericMapper';
export type { GenericNode, GenericMapperOptions } from './genericMapper';

// Export standalone sprite component
export { RepoSprite } from './components/RepoSprite';
export type {
  RepoSpriteProps,
  RepoSpriteVariant,
  RepoSpritePackage,
} from './components/RepoSprite';

// Export RepoCard wrapper component (accepts AlexandriaEntryWithMetrics)
export { RepoCard } from './components/RepoCard';
export type { RepoCardProps } from './components/RepoCard';

// Export RepoCardStatic for contexts with many cards (carousels, grids)
export { RepoCardStatic } from './components/RepoCardStatic';
export type { RepoCardStaticProps } from './components/RepoCardStatic';

// Export CardBack for card flip animations and loading states
export { CardBack } from './components/CardBack';
export type { CardBackProps } from './components/CardBack';

// Export CardBackCodeCity for Code City themed card backs
export { CardBackCodeCity } from './components/CardBackCodeCity';
export type { CardBackCodeCityProps } from './components/CardBackCodeCity';

// Export sprite renderer utilities
export {
  renderSpriteToDataUrl,
  renderSpriteToDataUrlCached,
  clearSpriteCache,
  getSpriteCacheSize,
  destroySharedApp,
} from './components/spriteRenderer';
export type { SpriteRenderOptions } from './components/spriteRenderer';
