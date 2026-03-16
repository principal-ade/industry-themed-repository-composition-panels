/**
 * Shared card theme definitions and utilities
 *
 * Used by both RepoSprite (live WebGL) and RepoCardStatic (static PNG)
 * to ensure visual consistency.
 */

/** Card color theme */
export type CardTheme = 'blue' | 'red' | 'green' | 'purple' | 'gold' | 'dark';

/**
 * Language to color mapping for repository visualization
 * Colors are chosen to match common language branding
 */
export const languageColors: Record<string, number> = {
  TypeScript: 0x3178c6,
  JavaScript: 0xf7df1e,
  Python: 0xffd43b,
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
export const DEFAULT_LANGUAGE_COLOR = 0xd2691e;

/**
 * Darken a hex color by a percentage
 */
export function darkenColor(color: number, percent: number): string {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - percent));
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - percent));
  const b = Math.max(0, (color & 0xff) * (1 - percent));
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

/**
 * Lighten a hex color by a percentage
 */
export function lightenColor(color: number, percent: number): string {
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
 * Convert HSL to hex color number
 */
export function hslToHex(h: number, s: number, l: number): number {
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
 * Derive a color from a string (used as fallback for name-based coloring)
 */
export function hashStringToColor(str: string): number {
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
 * Parse color from number or string format
 */
export function parseColor(color: number | string): number {
  if (typeof color === 'number') return color;
  if (color.startsWith('#')) return parseInt(color.slice(1), 16);
  return hashStringToColor(color);
}

/** Generated card colors from a base color */
export interface GeneratedCardColors {
  cardBg: string;
  cardBorder: string;
  cardHighlight: string;
  windowGradient: [string, string];
  panelGradient: [string, string];
  panelBorder: string;
}

/**
 * Generate card theme colors from a base color
 */
export function generateCardColors(baseColor: number): GeneratedCardColors {
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

/** Repository-like object for color resolution */
export interface RepositoryColorSource {
  name: string;
  bookColor?: string;
  github?: {
    primaryLanguage?: string;
  };
}

/**
 * Get color for a repository based on its primary language or name
 */
export function getRepositoryColor(repository: RepositoryColorSource): number {
  // First try bookColor if set
  if (repository.bookColor) {
    return parseColor(repository.bookColor);
  }

  // Then try primary language
  const language = repository.github?.primaryLanguage;
  if (language && languageColors[language]) {
    return languageColors[language];
  }

  // Fallback to hash of name for consistent coloring
  return hashStringToColor(repository.name);
}

/** Color scheme for card themes */
export interface CardThemeColors {
  cardBg: string;
  cardBorder: string;
  cardHighlight: string;
  windowGradient: [string, string];
  panelGradient: [string, string];
  panelBorder: string;
}

export const cardThemes: Record<CardTheme, CardThemeColors> = {
  blue: {
    cardBg: '#3b4a6b',
    cardBorder: '#2a3654',
    cardHighlight: '#4a5d8a',
    windowGradient: ['#1a1a2e', '#16213e'],
    panelGradient: ['#4a5d8a', '#3b4a6b'],
    panelBorder: '#5a6d9a',
  },
  red: {
    cardBg: '#6b3b3b',
    cardBorder: '#542a2a',
    cardHighlight: '#8a4a4a',
    windowGradient: ['#2e1a1a', '#3e1616'],
    panelGradient: ['#8a4a4a', '#6b3b3b'],
    panelBorder: '#9a5a5a',
  },
  green: {
    cardBg: '#3b6b4a',
    cardBorder: '#2a5436',
    cardHighlight: '#4a8a5d',
    windowGradient: ['#1a2e1f', '#163e21'],
    panelGradient: ['#4a8a5d', '#3b6b4a'],
    panelBorder: '#5a9a6d',
  },
  purple: {
    cardBg: '#5b3b6b',
    cardBorder: '#442a54',
    cardHighlight: '#7a4a8a',
    windowGradient: ['#261a2e', '#30163e'],
    panelGradient: ['#7a4a8a', '#5b3b6b'],
    panelBorder: '#8a5a9a',
  },
  gold: {
    cardBg: '#6b5a3b',
    cardBorder: '#54462a',
    cardHighlight: '#8a754a',
    windowGradient: ['#2e271a', '#3e3216'],
    panelGradient: ['#8a754a', '#6b5a3b'],
    panelBorder: '#9a855a',
  },
  dark: {
    cardBg: '#2a2a2a',
    cardBorder: '#1a1a1a',
    cardHighlight: '#3a3a3a',
    windowGradient: ['#0a0a0a', '#151515'],
    panelGradient: ['#3a3a3a', '#2a2a2a'],
    panelBorder: '#4a4a4a',
  },
};

/** License border colors - matches licenseSignSprites visual language */
export const licenseBorderColors: Record<string, string> = {
  MIT: '#228b22', // Forest green - open/welcoming
  BSD: '#228b22', // Same as MIT
  'BSD-3-Clause': '#228b22',
  ISC: '#228b22',
  'Apache-2.0': '#d97706', // Amber/orange - formal but welcoming
  'GPL-3.0': '#2255aa', // GNU blue
  'LGPL-3.0': '#2255aa',
  'GPL-2.0': '#2255aa',
  'AGPL-3.0': '#2255aa',
  'MPL-2.0': '#8b5cf6', // Purple
  UNLICENSED: '#dc2626', // Red - restrictive
};

/**
 * Format number for display (e.g., 1.2k, 45.3k)
 */
export function formatCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}M`;
}
