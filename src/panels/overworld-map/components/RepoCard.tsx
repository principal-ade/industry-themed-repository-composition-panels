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
import { getRepositoryColor } from './cardThemes';

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
    owner: repository.github?.owner,
    language: repository.github?.primaryLanguage,
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
