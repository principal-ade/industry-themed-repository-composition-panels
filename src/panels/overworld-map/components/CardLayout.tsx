/**
 * CardLayout - Shared card layout component
 *
 * Provides the card chrome (borders, badges, content panel) used by both
 * RepoSprite (live WebGL) and RepoCardStatic (static PNG) for visual consistency.
 */

import React from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import {
  licenseBorderColors,
  formatCount,
  parseColor,
  generateCardColors,
  type GeneratedCardColors,
} from './cardThemes';

/** Package definition for display in card */
export interface CardPackage {
  name: string;
  color?: number | string;
}

export interface CardLayoutProps {
  /** Base color for the card theme (derived from language/repo) */
  color: number | string;

  /** Owner/organization name (shown top-left with avatar) */
  owner?: string;

  /** Star count (shown top-right) */
  stars?: number;

  /** Repository/package name */
  label?: string;

  /** File count */
  files?: number;

  /** Primary programming language */
  language?: string;

  /** SPDX license identifier */
  license?: string;

  /** Package list for monorepos */
  packages?: CardPackage[];

  /** The sprite content (canvas container or img element) */
  children: React.ReactNode;
}

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
export const CardLayout: React.FC<CardLayoutProps> = ({
  color,
  owner,
  stars,
  label,
  files,
  language,
  license,
  packages,
  children,
}) => {
  const { theme } = useTheme();

  // Generate card colors from the base color
  const baseColor = parseColor(color);
  const colors: GeneratedCardColors = generateCardColors(baseColor);
  const licenseBorder = license ? licenseBorderColors[license] : null;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.cardBg,
        padding: '36px 12px 28px 12px',
        border: `${licenseBorder ? '5px' : '3px'} solid ${licenseBorder || colors.cardBorder}`,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: licenseBorder
          ? `inset 0 0 0 2px ${licenseBorder}40, 0 0 8px ${licenseBorder}60`
          : `inset 0 0 0 2px ${colors.cardHighlight}`,
      }}
    >
      {/* Owner avatar and name - top left */}
      {owner && (
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
            src={`https://github.com/${owner}.png?size=40`}
            alt={owner}
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
            {owner}
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
            backgroundImage: STARFIELD_BACKGROUND,
            backgroundSize: '100% 100%',
          }}
        />
        {/* Sprite content */}
        {children}
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
        {label && (
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
            title={label}
          >
            {label}
          </div>
        )}

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
      {language && (
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
      )}

      {/* License badge - bottom right corner, integrated with border */}
      {license && (
        <div
          style={{
            position: 'absolute',
            bottom: '-3px',
            right: '-3px',
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
