/**
 * RepoCard - Wrapper component that renders a RepoSprite from AlexandriaEntryWithMetrics
 *
 * Transforms Alexandria repository data into the props expected by RepoSprite,
 * providing a clean interface for rendering repository cards in the collection map.
 */

import React from 'react';
import {
  RepoSprite,
  type RepoSpriteProps,
  type RepoSpritePackage,
  type CardTheme,
  type RepoSpriteVariant,
} from './RepoSprite';
import type { AlexandriaEntryWithMetrics } from '../../CollectionMapPanel';
import { calculateRepositorySize } from '../../../utils/repositoryScaling';

/**
 * Language to color mapping for repository visualization
 * Colors are chosen to match common language branding
 */
const languageColors: Record<string, number> = {
  TypeScript: 0x3178c6,
  JavaScript: 0xf7df1e,
  Python: 0x3776ab,
  Rust: 0xdea584,
  Go: 0x00add8,
  Java: 0xb07219,
  'C++': 0xf34b7d,
  C: 0x555555,
  'C#': 0x178600,
  Ruby: 0xcc342d,
  PHP: 0x4f5d95,
  Swift: 0xf05138,
  Kotlin: 0xa97bff,
  Scala: 0xc22d40,
  Elixir: 0x6e4a7e,
  Haskell: 0x5e5086,
  Clojure: 0xdb5855,
  Shell: 0x89e051,
  HTML: 0xe34c26,
  CSS: 0x563d7c,
  Vue: 0x41b883,
  Svelte: 0xff3e00,
};

/** Default color when language is unknown */
const DEFAULT_COLOR = 0xd2691e;

/**
 * Derive a color from a string (used as fallback for name-based coloring)
 */
function hashStringToColor(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generate a muted color in the brown/earth tone range
  const h = Math.abs(hash % 360);
  const s = 30 + Math.abs((hash >> 8) % 30); // 30-60% saturation
  const l = 35 + Math.abs((hash >> 16) % 20); // 35-55% lightness
  return hslToHex(h, s, l);
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): number {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return (f(0) << 16) + (f(8) << 8) + f(4);
}

/**
 * Get color for a repository based on its primary language or name
 */
function getRepositoryColor(repository: AlexandriaEntryWithMetrics): number {
  // First try bookColor if set
  if (repository.bookColor) {
    if (repository.bookColor.startsWith('#')) {
      return parseInt(repository.bookColor.slice(1), 16);
    }
    // Handle named colors or other formats
    return hashStringToColor(repository.bookColor);
  }

  // Then try primary language
  const language = repository.github?.primaryLanguage;
  if (language && languageColors[language]) {
    return languageColors[language];
  }

  // Fallback to hash of name for consistent coloring
  return hashStringToColor(repository.name);
}

/**
 * Transform PackageLayer[] to RepoSpritePackage[]
 */
function transformPackages(
  packages: AlexandriaEntryWithMetrics['packages']
): RepoSpritePackage[] | undefined {
  if (!packages || packages.length === 0) {
    return undefined;
  }

  return packages.map((pkg) => ({
    name: pkg.packageData?.name || pkg.name,
    size: pkg.size,
    // Could derive color from package type or name in the future
  }));
}

export interface RepoCardProps {
  /** The Alexandria repository entry with metrics */
  repository: AlexandriaEntryWithMetrics;

  /** Display variant: 'default' | 'card' */
  variant?: RepoSpriteVariant;

  /** Card color theme (only applies to card variant) */
  cardTheme?: CardTheme;

  /** Width of the canvas */
  width?: number;

  /** Height of the canvas */
  height?: number;

  /** Background color (transparent if not set) */
  backgroundColor?: number;

  /** Show the isometric diamond boundary */
  showBoundary?: boolean;

  /** Boundary color (default: yellow) */
  boundaryColor?: number;

  /** Show debug outline */
  debug?: boolean;

  /** Override the calculated size */
  sizeOverride?: number;

  /** Override the derived color */
  colorOverride?: number | string;

  /** Callback when hovering over a package in a monorepo */
  onPackageHover?: (packageName: string) => void;

  /** Callback when hover ends on a package in a monorepo */
  onPackageHoverEnd?: (packageName: string) => void;
}

/**
 * RepoCard wraps RepoSprite and transforms AlexandriaEntryWithMetrics data
 * into the primitive props expected by RepoSprite.
 */
export const RepoCard: React.FC<RepoCardProps> = ({
  repository,
  variant = 'card',
  cardTheme = 'blue',
  width = 200,
  height = 280,
  backgroundColor,
  showBoundary = false,
  boundaryColor,
  debug = false,
  sizeOverride,
  colorOverride,
  onPackageHover,
  onPackageHoverEnd,
}) => {
  // Calculate size from metrics
  const size = sizeOverride ?? calculateRepositorySize(repository.metrics);

  // Derive color from language or repository properties
  const color = colorOverride ?? getRepositoryColor(repository);

  // Transform packages for monorepo display
  const packages = transformPackages(repository.packages);

  // Extract values from repository
  const spriteProps: RepoSpriteProps = {
    size,
    color,
    packages,
    files: repository.metrics?.fileCount,
    stars: repository.github?.stars,
    collaborators: repository.metrics?.contributors,
    license: repository.github?.license,
    label: repository.name,
    variant,
    cardTheme,
    width,
    height,
    backgroundColor,
    showBoundary,
    boundaryColor,
    debug,
    onPackageHover,
    onPackageHoverEnd,
  };

  return <RepoSprite {...spriteProps} />;
};

export default RepoCard;
