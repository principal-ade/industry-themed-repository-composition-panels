/**
 * Collaborator Decoration System
 * Defines tiers and decorations for repository collaborators
 */

export interface CollaboratorTier {
  min: number;
  max: number;
  name: string;
  decorationType: 'bench' | 'pavilion' | 'gazebo' | 'bandstand';
  color: number;
}

/**
 * Tier definitions for collaborator decorations
 * Uses community space metaphor: bench → pavilion → gazebo → bandstand
 */
export const COLLABORATOR_TIERS: CollaboratorTier[] = [
  { min: 1, max: 3, name: 'Solo', decorationType: 'bench', color: 0x8b7355 }, // Brown
  {
    min: 4,
    max: 10,
    name: 'Small Team',
    decorationType: 'bench',
    color: 0xa0826d,
  }, // Light brown
  {
    min: 11,
    max: 25,
    name: 'Active Team',
    decorationType: 'pavilion',
    color: 0x94a3b8,
  }, // Silver
  {
    min: 26,
    max: 50,
    name: 'Large Team',
    decorationType: 'pavilion',
    color: 0xfbbf24,
  }, // Gold
  {
    min: 51,
    max: 100,
    name: 'Community',
    decorationType: 'gazebo',
    color: 0xa855f7,
  }, // Purple
  {
    min: 101,
    max: 250,
    name: 'Major Project',
    decorationType: 'gazebo',
    color: 0x3b82f6,
  }, // Blue
  {
    min: 251,
    max: Number.POSITIVE_INFINITY,
    name: 'Open Source Hub',
    decorationType: 'bandstand',
    color: 0x10b981,
  }, // Green
];

/**
 * Get the collaborator tier for a given count
 */
export function getCollaboratorTier(count: number): CollaboratorTier | null {
  if (count <= 0) return null;
  return (
    COLLABORATOR_TIERS.find((tier) => count >= tier.min && count <= tier.max) ||
    null
  );
}

/**
 * Calculate size bonus for layout to accommodate decoration
 * Community spaces are compact, so smaller bonuses than stars
 */
export function getCollaboratorDecorationSizeBonus(count: number): number {
  const tier = getCollaboratorTier(count);
  if (!tier) return 0;

  switch (tier.decorationType) {
    case 'bench':
      return 0.15; // Small footprint
    case 'pavilion':
      return 0.2; // Medium footprint
    case 'gazebo':
      return 0.25; // Larger structure
    case 'bandstand':
      return 0.3; // Largest structure
    default:
      return 0.15;
  }
}

/**
 * Format collaborator count for display
 */
export function formatCollaboratorCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}k`;
  } else {
    return `${(count / 1000000).toFixed(1)}M`;
  }
}
