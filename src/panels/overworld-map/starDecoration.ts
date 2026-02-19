/**
 * GitHub Star Decoration System
 * Determines decoration type and visual style based on star count
 */

export interface StarTier {
  min: number;
  max: number;
  name: string;
  decorationType: 'flag' | 'trophy' | 'statue';
  color: number; // Hex color for the decoration
}

export const STAR_TIERS: StarTier[] = [
  // Flags (basic tiers)
  { min: 0, max: 100, name: 'New', decorationType: 'flag', color: 0x94a3b8 }, // Gray
  {
    min: 101,
    max: 500,
    name: 'Growing',
    decorationType: 'flag',
    color: 0x22c55e,
  }, // Green
  {
    min: 501,
    max: 1000,
    name: 'Popular',
    decorationType: 'flag',
    color: 0x06b6d4,
  }, // Cyan

  // Trophies (mid tiers)
  {
    min: 1001,
    max: 5000,
    name: 'Notable',
    decorationType: 'trophy',
    color: 0xf59e0b,
  }, // Amber
  {
    min: 5001,
    max: 10000,
    name: 'Renowned',
    decorationType: 'trophy',
    color: 0xf97316,
  }, // Orange

  // Statues (high tiers)
  {
    min: 10001,
    max: 25000,
    name: 'Famous',
    decorationType: 'statue',
    color: 0xeab308,
  }, // Yellow
  {
    min: 25001,
    max: 50000,
    name: 'Legendary',
    decorationType: 'statue',
    color: 0xfbbf24,
  }, // Gold
  {
    min: 50001,
    max: 100000,
    name: 'Epic',
    decorationType: 'statue',
    color: 0xa855f7,
  }, // Purple
  {
    min: 100001,
    max: 250000,
    name: 'Mythic',
    decorationType: 'statue',
    color: 0x8b5cf6,
  }, // Deep Purple
  {
    min: 250001,
    max: 500000,
    name: 'Godlike',
    decorationType: 'statue',
    color: 0x6366f1,
  }, // Indigo
  {
    min: 500001,
    max: Infinity,
    name: 'Celestial',
    decorationType: 'statue',
    color: 0xec4899,
  }, // Pink
];

/**
 * Get the star tier for a given star count
 */
export function getStarTier(stars: number): StarTier | null {
  if (stars === 0) return null; // No decoration for 0 stars

  for (const tier of STAR_TIERS) {
    if (stars >= tier.min && stars <= tier.max) {
      return tier;
    }
  }

  return STAR_TIERS[STAR_TIERS.length - 1]; // Default to highest tier
}

/**
 * Format star count for display (e.g., 1.2k, 45.3k, 1.2M)
 */
export function formatStarCount(stars: number): string {
  if (stars < 1000) {
    return stars.toString();
  } else if (stars < 1000000) {
    return `${(stars / 1000).toFixed(1)}k`;
  } else {
    return `${(stars / 1000000).toFixed(1)}M`;
  }
}

/**
 * Calculate extra size multiplier needed to accommodate star decorations
 * Decorations need roughly 20-30% extra horizontal space
 *
 * @param stars - GitHub star count
 * @returns Extra size multiplier to add (0.0 - 0.4)
 */
export function getDecorationSizeBonus(stars: number): number {
  if (!stars || stars === 0) return 0;

  const tier = getStarTier(stars);
  if (!tier) return 0;

  // Larger decorations (statues) need more space than smaller ones (flags)
  switch (tier.decorationType) {
    case 'flag':
      return 0.2; // Small flags need 20% extra space
    case 'trophy':
      return 0.25; // Medium trophies need 25% extra
    case 'statue':
      return 0.35; // Large statues need 35% extra
    default:
      return 0;
  }
}
