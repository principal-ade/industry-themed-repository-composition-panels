/**
 * RepoCardStatic - Static image version of RepoCard
 *
 * Renders the repository sprite as a static PNG image instead of a live
 * WebGL canvas. Use this for contexts where multiple cards are displayed
 * (carousels, grids) to avoid WebGL context limits.
 *
 * Uses the same card styling as RepoSprite's card variant for consistency.
 */

import React, { useEffect, useState } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { renderSpriteToDataUrlCached } from './spriteRenderer';
import type { AlexandriaEntryWithMetrics } from '../../CollectionMapPanel';
import { calculateRepositorySize } from '../../../utils/repositoryScaling';
import {
  cardThemes,
  licenseBorderColors,
  formatCount,
  type CardTheme,
} from './cardThemes';
import type { RepoSpritePackage } from './RepoSprite';

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
 * Darken a hex color by a percentage
 */
function darkenColor(color: number, percent: number): string {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - percent));
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - percent));
  const b = Math.max(0, (color & 0xff) * (1 - percent));
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(color: number, percent: number): string {
  const r = Math.min(
    255,
    ((color >> 16) & 0xff) + (255 - ((color >> 16) & 0xff)) * percent
  );
  const g = Math.min(
    255,
    ((color >> 8) & 0xff) + (255 - ((color >> 8) & 0xff)) * percent
  );
  const b = Math.min(255, (color & 0xff) + (255 - (color & 0xff)) * percent);
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

/**
 * Generate card theme colors from a base color
 */
function generateCardColors(baseColor: number) {
  return {
    cardBg: darkenColor(baseColor, 0.6),
    cardBorder: darkenColor(baseColor, 0.7),
    cardHighlight: darkenColor(baseColor, 0.4),
    windowGradient: [
      darkenColor(baseColor, 0.85),
      darkenColor(baseColor, 0.8),
    ] as [string, string],
    panelGradient: [
      darkenColor(baseColor, 0.4),
      darkenColor(baseColor, 0.6),
    ] as [string, string],
    panelBorder: darkenColor(baseColor, 0.3),
  };
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
  const { theme } = useTheme();
  const [spriteDataUrl, setSpriteDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const license = repository.github?.license;
  const licenseBorder = license ? licenseBorderColors[license] : null;
  const stars = repository.github?.stars;
  const files = repository.metrics?.fileCount;

  // Calculate sprite properties
  const size = calculateRepositorySize(repository.metrics);
  const color = getRepositoryColor(repository);

  // Generate card colors from the repository/language color
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

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.cardBg,
        padding: '36px 12px 20px 12px',
        border: `${licenseBorder ? '5px' : '3px'} solid ${licenseBorder || colors.cardBorder}`,
        width,
        height,
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: licenseBorder
          ? `inset 0 0 0 2px ${licenseBorder}40, 0 0 8px ${licenseBorder}60`
          : `inset 0 0 0 2px ${colors.cardHighlight}`,
      }}
    >
      {/* Owner avatar and name - top left */}
      {repository.github?.owner && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10,
          }}
        >
          <img
            src={`https://github.com/${repository.github.owner}.png?size=40`}
            alt={repository.github.owner}
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          />
          <span
            style={{
              fontSize: '12px',
              fontWeight: theme.fontWeights.medium,
              color: '#e0e0e0',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              fontFamily: theme.fonts.body,
              maxWidth: '80px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {repository.github.owner}
          </span>
        </div>
      )}

      {/* Stars badge - top right, Pokemon HP style */}
      {stars !== undefined && stars > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: theme.fontWeights.bold,
              color: '#fbbf24',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            ★
          </span>
          <span
            style={{
              fontSize: '16px',
              fontWeight: theme.fontWeights.bold,
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              fontFamily: theme.fonts.body,
            }}
          >
            {formatCount(stars)}
          </span>
        </div>
      )}

      {/* Sprite window frame */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          background: `linear-gradient(180deg, ${colors.windowGradient[0]} 0%, ${colors.windowGradient[1]} 100%)`,
          border: `2px solid ${colors.cardHighlight}`,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Starfield background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: `
              radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.4) 50%, transparent 50%),
              radial-gradient(1px 1px at 25% 35%, rgba(255,255,255,0.3) 50%, transparent 50%),
              radial-gradient(1px 1px at 40% 10%, rgba(255,255,255,0.35) 50%, transparent 50%),
              radial-gradient(1px 1px at 55% 45%, rgba(255,255,255,0.25) 50%, transparent 50%),
              radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.4) 50%, transparent 50%),
              radial-gradient(1px 1px at 85% 40%, rgba(255,255,255,0.3) 50%, transparent 50%),
              radial-gradient(1px 1px at 15% 55%, rgba(255,255,255,0.35) 50%, transparent 50%),
              radial-gradient(1px 1px at 35% 70%, rgba(255,255,255,0.25) 50%, transparent 50%),
              radial-gradient(1px 1px at 50% 85%, rgba(255,255,255,0.4) 50%, transparent 50%),
              radial-gradient(1px 1px at 65% 60%, rgba(255,255,255,0.3) 50%, transparent 50%),
              radial-gradient(1px 1px at 80% 75%, rgba(255,255,255,0.35) 50%, transparent 50%),
              radial-gradient(1px 1px at 95% 90%, rgba(255,255,255,0.25) 50%, transparent 50%),
              radial-gradient(1.5px 1.5px at 20% 25%, rgba(255,255,255,0.5) 50%, transparent 50%),
              radial-gradient(1.5px 1.5px at 60% 30%, rgba(200,220,255,0.45) 50%, transparent 50%),
              radial-gradient(1.5px 1.5px at 45% 65%, rgba(255,255,255,0.5) 50%, transparent 50%),
              radial-gradient(1.5px 1.5px at 75% 80%, rgba(220,200,255,0.45) 50%, transparent 50%),
              radial-gradient(2px 2px at 30% 50%, rgba(255,255,255,0.6) 50%, transparent 50%),
              radial-gradient(2px 2px at 70% 55%, rgba(200,220,255,0.55) 50%, transparent 50%),
              radial-gradient(2px 2px at 90% 15%, rgba(255,255,255,0.6) 50%, transparent 50%)
            `,
            backgroundSize: '100% 100%',
          }}
        />

        {/* Sprite content */}
        {isLoading ? (
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
        )}
      </div>

      {/* Card content panel */}
      <div
        style={{
          marginTop: '12px',
          padding: '8px',
          background: `linear-gradient(180deg, ${colors.panelGradient[0]} 0%, ${colors.panelGradient[1]} 100%)`,
          border: `1px solid ${colors.panelBorder}`,
          flexShrink: 0,
        }}
      >
        {/* Repository name */}
        <div
          style={{
            fontSize: theme.fontSizes[2],
            fontWeight: theme.fontWeights.bold,
            color: '#ffffff',
            marginBottom: '6px',
            fontFamily: theme.fonts.body,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}
          title={repository.name}
        >
          {repository.name}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: theme.fontSizes[1],
            color: '#e0e0e0',
            fontFamily: theme.fonts.body,
          }}
        >
          {files !== undefined && files > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="#94a3b8">
                <path
                  d="M3 1h7l3 3v11H3V1zm7 0v3h3M5 8h6M5 11h6"
                  stroke="#94a3b8"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>
              {formatCount(files)}
            </span>
          )}
        </div>

        {/* Package list for monorepos */}
        {packages && packages.length > 1 && (
          <div
            style={{
              marginTop: '6px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            {packages.slice(0, 6).map((pkg, i) => (
              <span
                key={i}
                style={{
                  fontSize: theme.fontSizes[0],
                  color: '#e0e0e0',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: theme.fonts.body,
                  borderLeft: `2px solid ${typeof pkg.color === 'string' ? pkg.color : `#${(pkg.color || 0x888888).toString(16).padStart(6, '0')}`}`,
                }}
              >
                {pkg.name}
              </span>
            ))}
            {packages.length > 6 && (
              <span
                style={{
                  fontSize: theme.fontSizes[0],
                  color: '#a0a0a0',
                  fontFamily: theme.fonts.body,
                }}
              >
                +{packages.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Language - bottom left corner */}
      {repository.github?.primaryLanguage && (
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '8px',
            fontSize: theme.fontSizes[0],
            fontWeight: theme.fontWeights.medium,
            color: '#e0e0e0',
            textShadow: '0 1px 1px rgba(0,0,0,0.3)',
            fontFamily: theme.fonts.body,
          }}
        >
          {repository.github.primaryLanguage}
        </div>
      )}

      {/* License badge - bottom right corner */}
      {license && (
        <div
          style={{
            position: 'absolute',
            bottom: '-3px',
            right: '-3px',
            backgroundColor: licenseBorder || colors.cardHighlight,
            padding: '3px 10px',
            borderRadius: '3px 0 0 0',
            fontSize: theme.fontSizes[0],
            fontWeight: theme.fontWeights.bold,
            color: '#ffffff',
            textShadow: '0 1px 1px rgba(0,0,0,0.3)',
          }}
        >
          {license}
        </div>
      )}
    </div>
  );
};

export default RepoCardStatic;
