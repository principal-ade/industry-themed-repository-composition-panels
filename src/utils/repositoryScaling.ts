/**
 * Repository Scaling Utilities
 *
 * Provides logarithmic scaling functions to size repository visualizations
 * based on metrics like file count, lines of code, etc.
 *
 * Sizes are rounded to discrete tiers to ensure boundaries cover whole tiles.
 */

export interface RepositoryMetrics {
  fileCount?: number;
}

/**
 * Available size tiers for repository visualization
 * These ensure that boundaries (4 × size) always cover whole numbers of tiles
 */
export const SIZE_TIERS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0] as const;

/**
 * Round size to nearest tier
 * Ensures boundaries always cover whole numbers of tiles
 */
function roundToNearestTier(size: number): number {
  return SIZE_TIERS.reduce((prev, curr) =>
    Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
  );
}

/**
 * Calculate sprite size multiplier based on file count using logarithmic scaling
 *
 * Scaling formula (before rounding):
 * - ≤100 files → 1.0x (minimum)
 * - 1,000 files → 2.0x
 * - 10,000 files → 3.0x
 * - 100,000+ files → 4.0x (maximum)
 *
 * Result is rounded to nearest tier (1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0)
 *
 * @param fileCount - Number of files in the repository
 * @returns Size multiplier from SIZE_TIERS
 */
export function calculateSizeFromFileCount(fileCount: number): number {
  if (fileCount <= 0) return 1.0; // Minimum size for empty/unknown repos
  if (fileCount <= 100) return 1.0; // Small repos (≤100 files)

  // Log base 10 scaling
  // Maps log10(fileCount) to a size range of 1.0x - 4.0x
  const logScale = Math.log10(fileCount);

  // Linear interpolation: log10(100)=2 → 1.0x, log10(100000)=5 → 4.0x
  // slope = (4.0 - 1.0) / (5 - 2) = 1.0
  const size = 1.0 + (logScale - 2) * 1.0;

  // Clamp between minimum and maximum
  const clamped = Math.min(Math.max(size, 1.0), 4.0);

  // Round to nearest tier
  return roundToNearestTier(clamped);
}


/**
 * Main function to calculate repository sprite size
 * Uses file count as the primary metric
 *
 * @param metrics - Repository metrics object
 * @returns Size multiplier from SIZE_TIERS (1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0)
 */
export function calculateRepositorySize(metrics?: RepositoryMetrics): number {
  if (!metrics) return 1.0;

  // Use file count if available
  if (metrics.fileCount && metrics.fileCount > 0) {
    return calculateSizeFromFileCount(metrics.fileCount);
  }

  // Default size
  return 1.0;
}
