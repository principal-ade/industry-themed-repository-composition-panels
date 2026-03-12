/**
 * RepoCardStatic - Static image version of RepoCard
 *
 * Renders the repository sprite as a static PNG image instead of a live
 * WebGL canvas. Use this for contexts where multiple cards are displayed
 * (carousels, grids) to avoid WebGL context limits.
 *
 * Uses CardLayout for consistent styling with RepoSprite's card variant.
 */

import React, { useEffect, useState } from 'react';
import { renderSpriteToDataUrlCached } from './spriteRenderer';
import type { AlexandriaEntryWithMetrics } from '../../CollectionMapPanel';
import { calculateRepositorySize } from '../../../utils/repositoryScaling';
import {
  getRepositoryColor,
  generateCardColors,
  type CardTheme,
} from './cardThemes';
import { CardLayout } from './CardLayout';
import type { RepoSpritePackage } from './RepoSprite';

export interface RepoCardStaticProps {
  /** The Alexandria repository entry with metrics */
  repository: AlexandriaEntryWithMetrics;

  /** Packages for monorepo display */
  packages?: RepoSpritePackage[];

  /** Card color theme */
  cardTheme?: CardTheme;

  /** Width of the card */
  width?: number;

  /** Height of the card */
  height?: number;

  /** Size of the sprite area */
  spriteSize?: number;
}

/**
 * RepoCardStatic renders a repository as a static image card
 * with the same styling as RepoSprite's card variant
 */
export const RepoCardStatic: React.FC<RepoCardStaticProps> = ({
  repository,
  packages,
  cardTheme = 'blue',
  width = 200,
  height = 280,
  spriteSize = 160,
}) => {
  const [spriteDataUrl, setSpriteDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate sprite properties
  const size = calculateRepositorySize(repository.metrics);
  const color = getRepositoryColor(repository);

  // Generate card colors for loading state fallback
  const colors = generateCardColors(color);

  // Render sprite to image on mount
  useEffect(() => {
    let mounted = true;

    async function renderSprite() {
      try {
        const dataUrl = await renderSpriteToDataUrlCached({
          size,
          color,
          packages,
          stars: repository.github?.stars,
          collaborators: repository.metrics?.contributors,
          license: repository.github?.license,
          label: repository.name,
          width: spriteSize,
          height: spriteSize,
        });

        if (mounted) {
          setSpriteDataUrl(dataUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to render sprite:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    renderSprite();

    return () => {
      mounted = false;
    };
  }, [size, color, packages, repository, spriteSize]);

  // Sprite content based on loading state
  const spriteContent = isLoading ? (
    <div
      style={{
        width: spriteSize * 0.5,
        height: spriteSize * 0.5,
        backgroundColor: `${colors.cardHighlight}40`,
        borderRadius: '8px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  ) : spriteDataUrl ? (
    <img
      src={spriteDataUrl}
      alt={repository.name}
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
      }}
    />
  ) : (
    <div
      style={{
        width: spriteSize * 0.5,
        height: spriteSize * 0.5,
        backgroundColor: `#${color.toString(16).padStart(6, '0')}`,
        borderRadius: '8px',
        opacity: 0.5,
      }}
    />
  );

  return (
    <div style={{ width, height }}>
      <CardLayout
        color={color}
        owner={repository.github?.owner}
        stars={repository.github?.stars}
        label={repository.name}
        description={repository.github?.description}
        files={repository.metrics?.fileCount}
        language={repository.github?.primaryLanguage}
        license={repository.github?.license}
        packages={packages}
      >
        {spriteContent}
      </CardLayout>
    </div>
  );
};

export default RepoCardStatic;
