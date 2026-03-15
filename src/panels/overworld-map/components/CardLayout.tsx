/**
 * CardLayout - Shared card layout component
 *
 * Provides the card chrome (borders, badges, content panel) used by both
 * RepoSprite (live WebGL) and RepoCardStatic (static PNG) for visual consistency.
 */

import React, { useEffect } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import {
  licenseBorderColors,
  formatCount,
  parseColor,
  generateCardColors,
  type GeneratedCardColors,
} from './cardThemes';

/** Get star color based on quantity */
const getStarColor = (count: number): string => {
  if (count >= 100000) return '#ffd700'; // Gold
  if (count >= 10000) return '#c0c0c0'; // Silver
  if (count >= 5000) return '#cd7f32'; // Bronze
  return '#f97316'; // Orange
};

/** Get name plate style based on star count (complexity increases with stars) */
const getStarNamePlateStyle = (count: number): NamePlateStyle => {
  if (count >= 100000) return 'ribbon'; // Gold - most ornate
  if (count >= 10000) return 'tag'; // Silver - subtle pointed ends
  if (count >= 5000) return 'box'; // Bronze - full border rectangle
  return 'flat'; // Orange - top/bottom borders only
};

/** Get foil effect type based on star count */
type FoilEffect = 'none' | 'silver' | 'gold';
const getStarFoilEffect = (count: number): FoilEffect => {
  if (count >= 100000) return 'gold';
  if (count >= 10000) return 'silver';
  return 'none';
};

/** Get badge colors based on repository age (prestige tiers) */
const getAgeBadgeColors = (isoDate: string): { bg: string; text: string } => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffYears =
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);

  if (diffYears < 1) return { bg: '#22c55e', text: '#ffffff' }; // Green - fresh
  if (diffYears < 5) return { bg: '#cd7f32', text: '#ffffff' }; // Bronze
  if (diffYears < 10) return { bg: '#a8a9ad', text: '#1a1a1a' }; // Silver
  return { bg: '#ffd700', text: '#1a1a1a' }; // Gold - legendary
};

/** Format ISO date - relative if < 1 year, otherwise "Mon YYYY" */
const formatCreatedDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Less than a year old - show relative time
  if (diffDays < 365) {
    if (diffDays < 7) {
      return `Est. ${diffDays}d ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Est. ${weeks}w ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `Est. ${months}mo ago`;
    }
  }

  // Older than a year - show "Est. Month Year"
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

/** Package definition for display in card */
export interface CardPackage {
  name: string;
  color?: number | string;
}

/** Name plate style variants */
export type NamePlateStyle =
  | 'flat'
  | 'box'
  | 'tag'
  | 'ribbon'
  | 'rounded'
  | 'notched'
  | 'beveled';

export interface CardLayoutProps {
  /** Base color for the card theme (derived from language/repo) */
  color: number | string;

  /** Owner/organization name (shown top-left with avatar) */
  owner?: string;

  /** Star count (shown top-right) */
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
  packages?: CardPackage[];

  /** Style variant for the name plate banner */
  namePlateStyle?: NamePlateStyle;

  /** ISO timestamp when repo was created on GitHub */
  createdAt?: string;

  /** The sprite content (canvas container or img element) */
  children: React.ReactNode;
}

/** CSS keyframes for foil shimmer effect */
const FOIL_KEYFRAMES = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
`;

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

/**
 * CardLayout renders the shared card chrome around sprite content.
 */
/** Style config for name plate variants */
interface NamePlateStyleConfig {
  /** Whether this style uses clip-path (needs wrapper for border) */
  usesClipPath: boolean;
  /** Clip-path value if applicable */
  clipPath?: string;
  /** Border radius for non-clip-path styles */
  borderRadius?: string | number;
  /** Extra padding needed for the shape */
  extraPadding?: { left?: number; right?: number };
}

const NAME_PLATE_CONFIGS: Record<NamePlateStyle, NamePlateStyleConfig> = {
  flat: {
    usesClipPath: false,
    borderRadius: 0,
  },
  box: {
    usesClipPath: false,
    borderRadius: 0,
  },
  tag: {
    usesClipPath: true,
    clipPath:
      'polygon(6px 0%, calc(100% - 6px) 0%, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0% 50%)',
    extraPadding: { left: 6, right: 6 },
  },
  ribbon: {
    usesClipPath: true,
    clipPath:
      'polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)',
    extraPadding: { left: 12, right: 12 },
  },
  rounded: {
    usesClipPath: false,
    borderRadius: '14px',
  },
  notched: {
    usesClipPath: true,
    clipPath:
      'polygon(0% 6px, 6px 6px, 6px 0%, calc(100% - 6px) 0%, calc(100% - 6px) 6px, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 6px calc(100% - 6px), 0% calc(100% - 6px))',
  },
  beveled: {
    usesClipPath: true,
    clipPath:
      'polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px)',
  },
};

/** Get styles for name plate - returns outer wrapper and inner content styles */
const getNamePlateStyles = (
  style: NamePlateStyle,
  highlightColor: string,
  bgGradient: string
): { outer: React.CSSProperties; inner: React.CSSProperties } => {
  const config = NAME_PLATE_CONFIGS[style];

  if (config.usesClipPath) {
    // Clip-path styles: outer has border color bg, inner has content bg
    return {
      outer: {
        clipPath: config.clipPath,
        background: highlightColor,
        padding: '2px', // This creates the "border" width
        paddingLeft: config.extraPadding?.left
          ? `${config.extraPadding.left + 2}px`
          : '2px',
        paddingRight: config.extraPadding?.right
          ? `${config.extraPadding.right + 2}px`
          : '2px',
      },
      inner: {
        clipPath: config.clipPath,
        background: bgGradient,
        padding: '6px 8px',
        paddingLeft: config.extraPadding?.left
          ? `${config.extraPadding.left + 8}px`
          : '8px',
        paddingRight: config.extraPadding?.right
          ? `${config.extraPadding.right + 8}px`
          : '8px',
      },
    };
  }

  // Non-clip-path styles: single element with border
  // 'flat' has top/bottom only, others have all 4 borders
  const borderStyle =
    style === 'flat'
      ? {
          borderTop: `2px solid ${highlightColor}`,
          borderBottom: `2px solid ${highlightColor}`,
        }
      : { border: `2px solid ${highlightColor}` };

  return {
    outer: {
      borderRadius: config.borderRadius,
      background: bgGradient,
      padding: '6px 8px',
      ...borderStyle,
    },
    inner: {}, // No separate inner element needed
  };
};

/** Check if style uses clip-path (needs wrapper) */
const styleUsesClipPath = (style: NamePlateStyle): boolean => {
  return NAME_PLATE_CONFIGS[style].usesClipPath;
};

export const CardLayout: React.FC<CardLayoutProps> = ({
  color,
  owner,
  stars,
  label,
  description,
  files,
  language,
  license,
  packages,
  namePlateStyle = 'beveled',
  createdAt,
  children,
}) => {
  const { theme } = useTheme();

  // Generate card colors from the base color
  const baseColor = parseColor(color);
  const colors: GeneratedCardColors = generateCardColors(baseColor);
  const licenseBorder = license ? licenseBorderColors[license] : null;

  const showHeader = owner || (stars !== undefined && stars > 0);
  const hasFoilEffect =
    stars !== undefined && getStarFoilEffect(stars) !== 'none';

  // Inject keyframes for foil effect
  useEffect(() => {
    if (!hasFoilEffect) return;

    const styleId = 'card-layout-foil-keyframes';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = FOIL_KEYFRAMES;
    document.head.appendChild(style);

    return () => {
      // Don't remove - other cards might need it
    };
  }, [hasFoilEffect]);

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
      {/* Header row - owner and stars */}
      {showHeader && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0',
            marginLeft: '-12px',
            marginRight: '-12px',
            marginTop: '-8px',
            minHeight: '24px',
            flexShrink: 0,
          }}
        >
          {/* Owner avatar and name */}
          {owner ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: 0,
                flex: 1,
              }}
            >
              <img
                src={`https://github.com/${owner}.png?size=80`}
                alt={owner}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 0,
                  border: 'none',
                  borderRight: '1px solid rgba(255,255,255,0.3)',
                  borderBottom: '1px solid rgba(255,255,255,0.3)',
                  flexShrink: 0,
                  marginBottom: '-12px',
                  position: 'relative',
                  zIndex: 1,
                  backgroundColor: colors.cardBorder,
                }}
              />
              <span
                style={{
                  fontSize: theme.fontSizes[2],
                  fontWeight: theme.fontWeights.medium,
                  color: '#e0e0e0',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  fontFamily: theme.fonts.body,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  alignSelf: 'flex-end',
                }}
              >
                {owner}
              </span>
            </div>
          ) : (
            <div />
          )}

          {/* Stars badge */}
          {stars !== undefined && stars > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
                alignSelf: 'flex-end',
                marginRight: '12px',
              }}
            >
              <span
                style={{
                  fontSize: theme.fontSizes[2],
                  fontWeight: theme.fontWeights.medium,
                  color: getStarColor(stars),
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  fontFamily: theme.fonts.body,
                }}
              >
                {formatCount(stars)}
              </span>
              <span
                style={{
                  fontSize: theme.fontSizes[2],
                  fontWeight: theme.fontWeights.medium,
                  color: getStarColor(stars),
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                ★
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sprite window frame */}
      <div
        style={{
          width: '100%',
          height: '50%',
          position: 'relative',
          background: `linear-gradient(180deg, ${colors.windowGradient[0]} 0%, ${colors.windowGradient[1]} 100%)`,
          border: `2px solid ${colors.cardHighlight}`,
          boxSizing: 'border-box',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {/* Starfield background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: STARFIELD_BACKGROUND,
            backgroundSize: '100% 100%',
          }}
        />
        {/* Foil effect - behind sprite so it shows through transparent areas */}
        {stars !== undefined &&
          (() => {
            const foilEffect = getStarFoilEffect(stars);
            if (foilEffect === 'none') return null;

            const containerStyle: React.CSSProperties = {
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
            };

            const shimmerStyle: React.CSSProperties = {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              animation: 'shimmer 2.5s ease-in-out infinite',
            };

            if (foilEffect === 'silver') {
              return (
                <div style={containerStyle}>
                  <div
                    style={{
                      ...shimmerStyle,
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(192,192,192,0.25) 25%, rgba(255,255,255,0.4) 50%, rgba(192,192,192,0.25) 75%, transparent 100%)',
                    }}
                  />
                </div>
              );
            }

            if (foilEffect === 'gold') {
              return (
                <div style={containerStyle}>
                  <div
                    style={{
                      ...shimmerStyle,
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.25) 25%, rgba(255,255,200,0.45) 50%, rgba(255,215,0,0.25) 75%, transparent 100%)',
                      animationDuration: '2s',
                    }}
                  />
                </div>
              );
            }

            return null;
          })()}
        {/* Sprite content - z-index ensures it's above the foil effect */}
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
              bottom: '4px',
              right: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '2px 6px',
              borderRadius: 0,
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes[1],
              color: '#e0e0e0',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="#94a3b8">
              <path
                d="M3 1h7l3 3v11H3V1zm7 0v3h3M5 8h6M5 11h6"
                stroke="#94a3b8"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            {formatCount(files)}
          </div>
        )}
      </div>

      {/* Name plate - spans full card width */}
      {label &&
        (() => {
          // Calculate font size to fit label in container
          // Base size 14px fits ~24 chars, shrink proportionally for longer names
          const baseFontSize = 14;
          const minFontSize = 8;
          const charsAtBase = 24;
          const fontSize = Math.max(
            minFontSize,
            Math.min(
              baseFontSize,
              (baseFontSize * charsAtBase) / Math.max(label.length, 1)
            )
          );
          // Use star-based color and style when stars are available
          const hasStars = stars !== undefined && stars > 0;
          const namePlateColor = hasStars
            ? getStarColor(stars)
            : colors.cardHighlight;
          const effectiveStyle = hasStars
            ? getStarNamePlateStyle(stars)
            : namePlateStyle;
          const bgGradient = `linear-gradient(180deg, ${colors.cardBorder} 0%, ${colors.cardBg} 100%)`;
          const { outer, inner } = getNamePlateStyles(
            effectiveStyle,
            namePlateColor,
            bgGradient
          );
          const usesWrapper = styleUsesClipPath(effectiveStyle);

          const textContent = (
            <span
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: theme.fontWeights.bold,
                color: namePlateColor,
                fontFamily: theme.fonts.body,
                whiteSpace: 'nowrap',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {label}
            </span>
          );

          if (usesWrapper) {
            // Clip-path styles need wrapper for border effect
            return (
              <div
                style={{
                  position: 'relative',
                  marginLeft: '-10px',
                  marginRight: '-10px',
                  marginTop: '8px',
                  zIndex: 2,
                  ...outer,
                }}
                title={label}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    ...inner,
                  }}
                >
                  {textContent}
                </div>
              </div>
            );
          }

          // Simple styles without clip-path
          // Flat and box styles have no overhang for a simpler look
          const sideMargin =
            effectiveStyle === 'flat' || effectiveStyle === 'box'
              ? '0px'
              : '-10px';
          return (
            <div
              style={{
                position: 'relative',
                marginLeft: sideMargin,
                marginRight: sideMargin,
                marginTop: '8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2,
                overflow: 'hidden',
                ...outer,
              }}
              title={label}
            >
              {textContent}
            </div>
          );
        })()}

      {/* Card content panel */}
      <div
        style={{
          marginTop: '0',
          padding: '8px',
          background: `linear-gradient(180deg, ${colors.panelGradient[0]} 0%, ${colors.panelGradient[1]} 100%)`,
          borderLeft: `1px solid ${colors.panelBorder}`,
          borderRight: `1px solid ${colors.panelBorder}`,
          borderBottom: `1px solid ${colors.panelBorder}`,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Repository description */}
        {description &&
          (() => {
            // Only shrink font size when description exceeds threshold
            const baseFontSize = 14;
            const minFontSize = 9;
            const shrinkThreshold = 100; // Start shrinking after this many chars
            const maxChars = 250; // At this length, use minimum font size

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
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  lineHeight: 1.4,
                  textAlign: 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
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

      {/* Bottom left corner - created date badge (preferred) or language */}
      {createdAt ? (
        (() => {
          const badgeColors = getAgeBadgeColors(createdAt);
          return (
            <div
              style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                backgroundColor: badgeColors.bg,
                padding: '3px 10px',
                borderRadius: 0,
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes[0],
                fontWeight: theme.fontWeights.bold,
                color: badgeColors.text,
                textShadow:
                  badgeColors.text === '#ffffff'
                    ? '0 1px 1px rgba(0,0,0,0.3)'
                    : 'none',
              }}
            >
              {formatCreatedDate(createdAt)}
            </div>
          );
        })()
      ) : language ? (
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
          {language}
        </div>
      ) : null}

      {/* License badge - bottom right corner, integrated with border */}
      {license && (
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            backgroundColor: licenseBorder || colors.cardHighlight,
            padding: '3px 10px',
            borderRadius: 0,
            fontFamily: theme.fonts.body,
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

export default CardLayout;
