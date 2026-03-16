/**
 * Cards - Shared card components for repository visualization
 *
 * This module provides reusable card components that can be used across
 * different panels for displaying repository information.
 */

// Layout components
export { CardLayout } from './components/CardLayout';
export type { NamePlateStyle } from './components/CardLayout';

export { CardLayoutOG, DEFAULT_OG_THEME } from './components/CardLayoutOG';
export type {
  CardLayoutOGProps,
  CardPackageOG,
  OGTheme,
} from './components/CardLayoutOG';

// Card back components
export { CardBack } from './components/CardBack';
export { CardBackCodeCity } from './components/CardBackCodeCity';

// Repository card components
export { RepoCard } from './components/RepoCard';
export type { RepoCardProps } from './components/RepoCard';

export { RepoCardStatic } from './components/RepoCardStatic';
export type { RepoCardStaticProps } from './components/RepoCardStatic';

export { RepoSprite } from './components/RepoSprite';
export type {
  RepoSpriteProps,
  RepoSpritePackage,
  RepoSpriteVariant,
  CardTheme,
} from './components/RepoSprite';

// Utilities
export {
  cardThemes,
  languageColors,
  licenseBorderColors,
  darkenColor,
  lightenColor,
  parseColor,
  generateCardColors,
  getRepositoryColor,
  formatCount,
} from './components/cardThemes';

export {
  renderSpriteToDataUrl,
  renderSpriteToDataUrlCached,
  clearSpriteCache,
  getSpriteCacheSize,
  destroySharedApp,
} from './components/spriteRenderer';
export type { SpriteRenderOptions } from './components/spriteRenderer';
