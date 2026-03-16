/**
 * OG Image Generation Entry Point
 *
 * This is a minimal entry point for Satori-based OG image generation.
 * It only exports CardLayoutOG and its dependencies, without any React hooks
 * or context that would break Satori rendering.
 *
 * Usage:
 *   import { CardLayoutOG } from '@industry-theme/repository-composition-panels/og';
 */

export {
  CardLayoutOG,
  DEFAULT_OG_THEME,
} from './panels/cards/components/CardLayoutOG';
export type {
  CardLayoutOGProps,
  CardPackageOG,
  OGTheme,
} from './panels/cards/components/CardLayoutOG';

// Re-export card theme utilities needed for OG generation
export {
  licenseBorderColors,
  formatCount,
  parseColor,
  generateCardColors,
} from './panels/cards/components/cardThemes';
export type { GeneratedCardColors } from './panels/cards/components/cardThemes';
