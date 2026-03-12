/**
 * Shared card theme definitions
 *
 * Used by both RepoSprite (live WebGL) and RepoCardStatic (static PNG)
 * to ensure visual consistency.
 */

/** Card color theme */
export type CardTheme = 'blue' | 'red' | 'green' | 'purple' | 'gold' | 'dark';

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
