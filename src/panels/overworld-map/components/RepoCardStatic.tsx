/**
 * RepoCardStatic - Static image version of RepoCard
 *
 * Renders the repository sprite as a static PNG image instead of a live
 * WebGL canvas. Use this for contexts where multiple cards are displayed
 * (carousels, grids) to avoid WebGL context limits.
 */

import React, { useEffect, useState } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { Star, Users, FileCode } from 'lucide-react';
import { renderSpriteToDataUrlCached } from './spriteRenderer';
import type { AlexandriaEntryWithMetrics } from '../../CollectionMapPanel';
import { calculateRepositorySize } from '../../../utils/repositoryScaling';
import type { CardTheme } from './RepoSprite';

/**
 * Language to color mapping
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
  Shell: 0x89e051,
  HTML: 0xe34c26,
  CSS: 0x563d7c,
  Vue: 0x41b883,
  Svelte: 0xff3e00,
};

/**
 * Derive color from string hash
 */
function hashStringToColor(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  const s = 30 + Math.abs((hash >> 8) % 30);
  const l = 35 + Math.abs((hash >> 16) % 20);

  // HSL to hex
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return (f(0) << 16) + (f(8) << 8) + f(4);
}

/**
 * Get color for repository
 */
function getRepositoryColor(repository: AlexandriaEntryWithMetrics): number {
  if (repository.bookColor) {
    if (repository.bookColor.startsWith('#')) {
      return parseInt(repository.bookColor.slice(1), 16);
    }
    return hashStringToColor(repository.bookColor);
  }

  const language = repository.github?.primaryLanguage;
  if (language && languageColors[language]) {
    return languageColors[language];
  }

  return hashStringToColor(repository.name);
}

/**
 * Format number with k/M suffix
 */
function formatNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}k`;
  return `${(num / 1000000).toFixed(1)}M`;
}

/**
 * Card theme colors
 */
const cardThemes: Record<
  CardTheme,
  { bg: string; border: string; text: string }
> = {
  blue: { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
  red: { bg: '#5f1e1e', border: '#ef4444', text: '#fca5a5' },
  green: { bg: '#1e5f3a', border: '#22c55e', text: '#86efac' },
  purple: { bg: '#3b1e5f', border: '#8b5cf6', text: '#c4b5fd' },
  gold: { bg: '#5f4a1e', border: '#f59e0b', text: '#fcd34d' },
  dark: { bg: '#1a1a2e', border: '#4a4a6a', text: '#a0a0c0' },
};

export interface RepoCardStaticProps {
  /** The Alexandria repository entry with metrics */
  repository: AlexandriaEntryWithMetrics;

  /** Card color theme */
  cardTheme?: CardTheme;

  /** Width of the card */
  width?: number;

  /** Height of the card */
  height?: number;

  /** Size of the sprite area */
  spriteSize?: number;

  /** Show metadata below sprite */
  showMetadata?: boolean;
}

/**
 * RepoCardStatic renders a repository as a static image card
 */
export const RepoCardStatic: React.FC<RepoCardStaticProps> = ({
  repository,
  cardTheme = 'dark',
  width = 200,
  height = 280,
  spriteSize = 160,
  showMetadata = true,
}) => {
  const { theme } = useTheme();
  const [spriteDataUrl, setSpriteDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const themeColors = cardThemes[cardTheme];

  // Calculate sprite properties
  const size = calculateRepositorySize(repository.metrics);
  const color = getRepositoryColor(repository);

  // Render sprite to image on mount
  useEffect(() => {
    let mounted = true;

    async function renderSprite() {
      try {
        const dataUrl = await renderSpriteToDataUrlCached({
          size,
          color,
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
  }, [size, color, repository, spriteSize]);

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: themeColors.bg,
        border: `2px solid ${themeColors.border}`,
        borderRadius: '12px',
        overflow: 'hidden',
        fontFamily: theme.fonts.body,
      }}
    >
      {/* Sprite area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          minHeight: spriteSize,
        }}
      >
        {isLoading ? (
          <div
            style={{
              width: spriteSize * 0.5,
              height: spriteSize * 0.5,
              backgroundColor: `${themeColors.border}40`,
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
        )}
      </div>

      {/* Metadata area */}
      {showMetadata && (
        <div
          style={{
            padding: '12px',
            borderTop: `1px solid ${themeColors.border}40`,
            backgroundColor: `${themeColors.bg}cc`,
          }}
        >
          {/* Repository name */}
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: themeColors.text,
              marginBottom: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={repository.name}
          >
            {repository.name}
          </div>

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              fontSize: '12px',
              color: `${themeColors.text}99`,
            }}
          >
            {repository.github?.stars !== undefined && (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Star size={12} />
                {formatNumber(repository.github.stars)}
              </span>
            )}
            {repository.metrics?.contributors !== undefined && (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Users size={12} />
                {formatNumber(repository.metrics.contributors)}
              </span>
            )}
            {repository.github?.primaryLanguage && (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <FileCode size={12} />
                {repository.github.primaryLanguage}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoCardStatic;
