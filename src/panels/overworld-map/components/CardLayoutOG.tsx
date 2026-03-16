/**
 * CardLayoutOG - Satori-compatible card layout for OG image generation
 *
 * This is a pure render component designed to work with Satori for generating
 * Open Graph images. It has no hooks, no animations, and uses only inline styles
 * with Satori-compatible CSS.
 *
 * Key differences from CardLayout:
 * - No useTheme() hook - theme values passed as props
 * - No useEffect - pure render function
 * - No CSS animations (not supported by Satori)
 * - Simplified clip-path shapes for better compatibility
 */

import React from 'react';
import {
  licenseBorderColors,
  formatCount,
  parseColor,
  generateCardColors,
  type GeneratedCardColors,
} from './cardThemes';

/** Default theme values for OG generation */
export const DEFAULT_OG_THEME = {
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
    monospace: 'monospace',
  },
  fontSizes: [10, 12, 14, 16, 20, 24, 32],
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export type OGTheme = typeof DEFAULT_OG_THEME;

/** Get star color based on quantity */
const getStarColor = (count: number): string => {
  if (count >= 100000) return '#ffd700'; // Gold
  if (count >= 10000) return '#c0c0c0'; // Silver
  if (count >= 5000) return '#cd7f32'; // Bronze
  return '#f97316'; // Orange
};

/** Get name plate style based on star count */
type NamePlateStyle = 'flat' | 'box' | 'tag' | 'ribbon';

const getStarNamePlateStyle = (count: number): NamePlateStyle => {
  if (count >= 100000) return 'ribbon';
  if (count >= 10000) return 'tag';
  if (count >= 5000) return 'box';
  return 'flat';
};

/** Get badge colors based on repository age */
const getAgeBadgeColors = (isoDate: string): { bg: string; text: string } => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffYears =
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);

  if (diffYears < 1) return { bg: '#22c55e', text: '#ffffff' };
  if (diffYears < 5) return { bg: '#cd7f32', text: '#ffffff' };
  if (diffYears < 10) return { bg: '#a8a9ad', text: '#1a1a1a' };
  return { bg: '#ffd700', text: '#1a1a1a' };
};

/** Starfield background CSS for the sprite window */
const STARFIELD_BACKGROUND = `
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
`;

/** Format ISO date for display */
const formatCreatedDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 365) {
    if (diffDays < 7) return `Est. ${diffDays}d ago`;
    if (diffDays < 30) return `Est. ${Math.floor(diffDays / 7)}w ago`;
    return `Est. ${Math.floor(diffDays / 30)}mo ago`;
  }

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `Est. ${months[date.getMonth()]} ${date.getFullYear()}`;
};

/** Package definition for display */
export interface CardPackageOG {
  name: string;
  color?: number | string;
}

export interface CardLayoutOGProps {
  /** Base color for the card theme (derived from language/repo) */
  color: number | string;

  /** Owner/organization login/username (used for avatar URL) */
  owner?: string;

  /** Custom avatar URL (overrides default GitHub avatar) */
  avatarUrl?: string;

  /** Owner display name (shown in UI, falls back to owner if not provided) */
  ownerDisplayName?: string | null;

  /** Star count */
  stars?: number;

  /** Repository/package name */
  label?: string;

  /** Repository description */
  description?: string;

  /** File count */
  files?: number;

  /** Primary programming language */
  language?: string;

  /** SPDX license identifier */
  license?: string;

  /** Package list for monorepos */
  packages?: CardPackageOG[];

  /** ISO timestamp when repo was created */
  createdAt?: string;

  /** Theme values (uses defaults if not provided) */
  theme?: OGTheme;

  /** Optional overlay layer for sprite window (e.g., foil effects in React) */
  spriteOverlay?: React.ReactNode;

  /** The content to display in the sprite window (typically an img) */
  children: React.ReactNode;
}

/**
 * CardLayoutOG - Satori-safe card layout component
 */
export const CardLayoutOG: React.FC<CardLayoutOGProps> = ({
  color,
  owner,
  avatarUrl,
  ownerDisplayName,
  stars,
  label,
  description,
  files,
  language,
  license,
  packages,
  createdAt,
  theme = DEFAULT_OG_THEME,
  spriteOverlay,
  children,
}) => {
  // Generate card colors from the base color
  const baseColor = parseColor(color);
  const colors: GeneratedCardColors = generateCardColors(baseColor);
  const licenseBorder = license ? licenseBorderColors[license] : null;

  const showHeader = owner || (stars !== undefined && stars > 0);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.cardBg,
        padding: '8px 12px 28px 12px',
        border: `4px solid ${colors.cardBorder}`,
        borderRadius: 0,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Sprite window frame - rendered first so header stacks on top */}
      <div
        style={{
          width: '100%',
          height: '50%',
          position: 'relative',
          marginTop: showHeader ? 20 : 0,
          background: `linear-gradient(180deg, ${colors.windowGradient[0]} 0%, ${colors.windowGradient[1]} 100%)`,
          border: `2px solid ${colors.cardHighlight}`,
          boxSizing: 'border-box',
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
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: STARFIELD_BACKGROUND,
            backgroundSize: '100% 100%',
          }}
        />
        {/* Optional overlay (e.g., foil effects from React wrapper) */}
        {spriteOverlay}
        {/* Sprite content - z-index ensures it's above the background/overlay */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
        {/* File count badge */}
        {files !== undefined && files > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '2px 6px',
            }}
          >
            <span
              style={{
                fontSize: theme.fontSizes[2],
                fontWeight: theme.fontWeights.medium,
                color: '#e0e0e0',
                fontFamily: theme.fonts.body,
              }}
            >
              {formatCount(files)} files
            </span>
          </div>
        )}
      </div>

      {/* Header row - owner and stars (rendered after sprite window to stack on top) */}
      {showHeader && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            minHeight: 24,
          }}
        >
          {/* Owner avatar and name */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flex: 1,
              minWidth: 0,
              height: 40,
            }}
          >
            {owner && (
              <>
                <img
                  src={avatarUrl || `https://github.com/${owner}.png?size=80`}
                  alt={owner}
                  width={40}
                  height={40}
                  style={{
                    borderRadius: 0,
                    borderRight: '1px solid rgba(255,255,255,0.3)',
                    borderBottom: '1px solid rgba(255,255,255,0.3)',
                    backgroundColor: colors.cardBorder,
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: 46,
                    bottom: 12,
                    fontSize: theme.fontSizes[4],
                    fontWeight: theme.fontWeights.medium,
                    color: '#e0e0e0',
                    fontFamily: theme.fonts.body,
                    lineHeight: 1.2,
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ownerDisplayName ?? owner}
                </span>
              </>
            )}
          </div>

          {/* Stars badge */}
          {stars !== undefined && stars > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 4,
                marginRight: 12,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: theme.fontSizes[4],
                  fontWeight: theme.fontWeights.medium,
                  color: getStarColor(stars),
                  fontFamily: theme.fonts.body,
                }}
              >
                {formatCount(stars)}
              </span>
              <svg
                width={theme.fontSizes[4]}
                height={theme.fontSizes[4]}
                viewBox="0 0 24 24"
                fill={getStarColor(stars)}
                style={{ marginTop: 2, marginLeft: -2 }}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Name plate */}
      {label &&
        (() => {
          const baseFontSize = 24;
          const minFontSize = 12;
          const charsAtBase = 16;
          const fontSize = Math.max(
            minFontSize,
            Math.min(
              baseFontSize,
              (baseFontSize * charsAtBase) / Math.max(label.length, 1)
            )
          );

          const hasStars = stars !== undefined && stars > 0;
          const namePlateColor = hasStars
            ? getStarColor(stars)
            : colors.cardHighlight;
          const namePlateStyle = hasStars
            ? getStarNamePlateStyle(stars)
            : 'flat';
          const bgGradient = `linear-gradient(180deg, ${colors.cardBorder} 0%, ${colors.cardBg} 100%)`;

          // Simplified name plate - no clip-path for better Satori compatibility
          const borderStyle =
            namePlateStyle === 'flat'
              ? {
                  borderTop: `2px solid ${namePlateColor}`,
                  borderBottom: `2px solid ${namePlateColor}`,
                }
              : { border: `2px solid ${namePlateColor}` };

          return (
            <div
              style={{
                marginTop: 4,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: bgGradient,
                padding: '8px 8px 10px 8px',
                overflow: 'hidden',
                ...borderStyle,
              }}
            >
              <span
                style={{
                  fontSize: `${fontSize}px`,
                  fontWeight: theme.fontWeights.bold,
                  color: namePlateColor,
                  fontFamily: theme.fonts.body,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {label}
              </span>
            </div>
          );
        })()}

      {/* Card content panel */}
      <div
        style={{
          marginTop: 0,
          padding: 8,
          background: `linear-gradient(180deg, ${colors.panelGradient[0]} 0%, ${colors.panelGradient[1]} 100%)`,
          borderLeft: `1px solid ${colors.panelBorder}`,
          borderRight: `1px solid ${colors.panelBorder}`,
          borderBottom: `1px solid ${colors.panelBorder}`,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Description */}
        {description &&
          (() => {
            const baseFontSize = 22;
            const minFontSize = 14;
            const shrinkThreshold = 100;
            const maxChars = 350;

            let descFontSize = baseFontSize;
            if (description.length > shrinkThreshold) {
              const excess = description.length - shrinkThreshold;
              const range = maxChars - shrinkThreshold;
              const shrinkRatio = Math.min(1, excess / range);
              descFontSize =
                baseFontSize - shrinkRatio * (baseFontSize - minFontSize);
            }

            return (
              <div
                style={{
                  fontSize: `${descFontSize}px`,
                  color: '#e0e0e0',
                  fontFamily: theme.fonts.body,
                  lineHeight: 1.4,
                  textAlign: 'left',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 8,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {description}
              </div>
            );
          })()}

        {/* Package list for monorepos */}
        {packages && packages.length > 1 && (
          <div
            style={{
              marginTop: 6,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 4,
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
                  borderLeft: `2px solid ${
                    typeof pkg.color === 'string'
                      ? pkg.color
                      : `#${(pkg.color || 0x888888).toString(16).padStart(6, '0')}`
                  }`,
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

      {/* Bottom left - created date or language */}
      {createdAt ? (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            display: 'flex',
            backgroundColor: getAgeBadgeColors(createdAt).bg,
            padding: '3px 10px',
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes[2],
            fontWeight: theme.fontWeights.bold,
            color: getAgeBadgeColors(createdAt).text,
          }}
        >
          {formatCreatedDate(createdAt)}
        </div>
      ) : language ? (
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: 8,
            display: 'flex',
            fontSize: theme.fontSizes[0],
            fontWeight: theme.fontWeights.medium,
            color: '#e0e0e0',
            fontFamily: theme.fonts.body,
          }}
        >
          {language}
        </div>
      ) : null}

      {/* License badge - bottom right */}
      {license && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            display: 'flex',
            backgroundColor: licenseBorder || colors.cardHighlight,
            padding: '3px 10px',
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes[2],
            fontWeight: theme.fontWeights.bold,
            color: '#ffffff',
          }}
        >
          {license}
        </div>
      )}
    </div>
  );
};

export default CardLayoutOG;
