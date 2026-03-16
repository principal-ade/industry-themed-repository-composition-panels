/**
 * CardLayout - Shared card layout component
 *
 * Wraps CardLayoutOG and adds React-specific features:
 * - useTheme() hook for theme context
 * - Animated foil effects for high-star repositories
 *
 * For Satori/OG image generation, use CardLayoutOG directly.
 */

import React, { useEffect } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import {
  CardLayoutOG,
  DEFAULT_OG_THEME,
  type CardLayoutOGProps,
  type OGTheme,
} from './CardLayoutOG';

/** Re-export types from CardLayoutOG for backward compatibility */
export type { CardPackageOG as CardPackage } from './CardLayoutOG';

/** Name plate style variants (React supports all 7, OG uses simplified 4) */
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

  /** Owner/organization login/username (used for avatar URL) */
  owner?: string;

  /** Custom avatar URL (overrides default GitHub avatar) */
  avatarUrl?: string;

  /** Owner display name (shown in UI, falls back to owner if not provided) */
  ownerDisplayName?: string | null;

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
  packages?: Array<{ name: string; color?: number | string }>;

  /** Style variant for the name plate banner (note: OG uses simplified styles) */
  namePlateStyle?: NamePlateStyle;

  /** ISO timestamp when repo was created on GitHub */
  createdAt?: string;

  /** The sprite content (canvas container or img element) */
  children: React.ReactNode;
}

/** CSS keyframes for foil effects */
const FOIL_KEYFRAMES = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes shimmer-vertical {
  0% { background-position: 0 200%; }
  100% { background-position: 0 -200%; }
}
@keyframes holo {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}
`;

/** Get foil effect type based on star count */
type FoilEffectType = 'none' | 'silver' | 'gold';
const getStarFoilEffect = (count: number): FoilEffectType => {
  if (count >= 100000) return 'gold';
  if (count >= 10000) return 'silver';
  return 'none';
};

/** Foil overlay component for high-star repositories */
const FoilOverlay: React.FC<{ stars: number }> = ({ stars }) => {
  const foilEffect = getStarFoilEffect(stars);

  if (foilEffect === 'none') return null;

  if (foilEffect === 'silver') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          border: '3px solid #c0c0c0',
          boxShadow: 'inset 0 0 4px rgba(255,255,255,0.5)',
        }}
      />
    );
  }

  if (foilEffect === 'gold') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'conic-gradient(from 0deg at 50% 50%, rgba(255,0,0,0.4), rgba(255,255,0,0.4), rgba(0,255,0,0.4), rgba(0,255,255,0.4), rgba(0,0,255,0.4), rgba(255,0,255,0.4), rgba(255,0,0,0.4))',
            animation: 'holo 6s linear infinite',
          }}
        />
      </div>
    );
  }

  return null;
};

/** Convert industry-theme to OG theme format */
const convertToOGTheme = (
  theme: ReturnType<typeof useTheme>['theme']
): OGTheme => {
  return {
    fonts: {
      body: theme.fonts.body,
      heading: theme.fonts.heading,
      monospace: theme.fonts.monospace,
    },
    fontSizes: theme.fontSizes as number[],
    fontWeights: {
      normal: theme.fontWeights.body as number,
      medium: theme.fontWeights.medium as number,
      semibold: theme.fontWeights.semibold as number,
      bold: theme.fontWeights.bold as number,
    },
  };
};

/**
 * CardLayout renders the shared card chrome around sprite content.
 * Wraps CardLayoutOG with React-specific features (hooks, animations).
 */
export const CardLayout: React.FC<CardLayoutProps> = ({
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
  namePlateStyle = 'beveled',
  createdAt,
  children,
}) => {
  const { theme } = useTheme();

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

  // Build foil overlay for sprite window
  const spriteOverlay =
    stars !== undefined && stars > 0 ? (
      <FoilOverlay stars={stars} />
    ) : undefined;

  // Convert theme to OG format
  const ogTheme = convertToOGTheme(theme);

  return (
    <CardLayoutOG
      color={color}
      owner={owner}
      avatarUrl={avatarUrl}
      ownerDisplayName={ownerDisplayName}
      stars={stars}
      label={label}
      description={description}
      files={files}
      language={language}
      license={license}
      packages={packages}
      createdAt={createdAt}
      theme={ogTheme}
      spriteOverlay={spriteOverlay}
    >
      {children}
    </CardLayoutOG>
  );
};

export default CardLayout;
