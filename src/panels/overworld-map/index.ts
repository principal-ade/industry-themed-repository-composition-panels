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

// Re-export card components from their new home (backward compatibility)
export { RepoSprite } from '../cards/components/RepoSprite';
export type {
  RepoSpriteProps,
  RepoSpriteVariant,
  RepoSpritePackage,
} from '../cards/components/RepoSprite';

export { RepoCard } from '../cards/components/RepoCard';
export type { RepoCardProps } from '../cards/components/RepoCard';

export { RepoCardStatic } from '../cards/components/RepoCardStatic';
export type { RepoCardStaticProps } from '../cards/components/RepoCardStatic';

export { CardBack } from '../cards/components/CardBack';
export type { CardBackProps } from '../cards/components/CardBack';

export { CardBackCodeCity } from '../cards/components/CardBackCodeCity';
export type { CardBackCodeCityProps } from '../cards/components/CardBackCodeCity';

export {
  renderSpriteToDataUrl,
  renderSpriteToDataUrlCached,
  clearSpriteCache,
  getSpriteCacheSize,
  destroySharedApp,
} from '../cards/components/spriteRenderer';
export type { SpriteRenderOptions } from '../cards/components/spriteRenderer';

export {
  CardLayoutOG,
  DEFAULT_OG_THEME,
} from '../cards/components/CardLayoutOG';
export type {
  CardLayoutOGProps,
  CardPackageOG,
  OGTheme,
} from '../cards/components/CardLayoutOG';
