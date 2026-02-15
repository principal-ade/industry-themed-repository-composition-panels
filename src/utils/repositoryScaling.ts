/**
 * Repository Scaling Utilities
 *
 * Provides logarithmic scaling functions to size repository visualizations
 * based on metrics like file count, lines of code, etc.
 */

export interface RepositoryMetrics {
  fileCount?: number;
  lineCount?: number;
  commitCount?: number;
  contributors?: number;
}

/**
 * Calculate sprite size multiplier based on file count using logarithmic scaling
 *
 * Scaling formula:
 * - ≤100 files → 1.0x (minimum)
 * - 1,000 files → 2.0x
 * - 10,000 files → 3.0x
 * - 100,000+ files → 4.0x (maximum)
 *
 * @param fileCount - Number of files in the repository
 * @returns Size multiplier between 1.0x and 4.0x
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
  return Math.min(Math.max(size, 1.0), 4.0);
}

/**
 * Calculate sprite size multiplier based on lines of code using logarithmic scaling
 *
 * Similar to file count, but adjusted for typical LOC ranges:
 * - ≤10,000 LOC → 1.0x (minimum)
 * - 100,000 LOC → 2.0x
 * - 1,000,000 LOC → 3.0x
 * - 10,000,000+ LOC → 4.0x (maximum)
 *
 * @param lineCount - Total lines of code
 * @returns Size multiplier between 1.0x and 4.0x
 */
export function calculateSizeFromLineCount(lineCount: number): number {
  if (lineCount <= 0) return 1.0;
  if (lineCount <= 10000) return 1.0; // Small repos (≤10K LOC)

  const logScale = Math.log10(lineCount);
  // Linear interpolation: log10(10000)=4 → 1.0x, log10(10000000)=7 → 4.0x
  // slope = (4.0 - 1.0) / (7 - 4) = 1.0
  const size = 1.0 + (logScale - 4) * 1.0;

  return Math.min(Math.max(size, 1.0), 4.0);
}

/**
 * Calculate sprite size using a composite metric
 * Weights multiple metrics to produce a balanced size
 *
 * Default weights:
 * - File count: 40%
 * - Line count: 40%
 * - Commit count: 15%
 * - Contributors: 5%
 *
 * @param metrics - Repository metrics object
 * @param weights - Optional custom weights (must sum to 1.0)
 * @returns Size multiplier between 1.5x and 4.0x
 */
export function calculateSizeFromCompositeMetrics(
  metrics: RepositoryMetrics,
  weights: {
    fileCount?: number;
    lineCount?: number;
    commitCount?: number;
    contributors?: number;
  } = {}
): number {
  // Default weights
  const w = {
    fileCount: weights.fileCount ?? 0.4,
    lineCount: weights.lineCount ?? 0.4,
    commitCount: weights.commitCount ?? 0.15,
    contributors: weights.contributors ?? 0.05,
  };

  let totalWeight = 0;
  let weightedSize = 0;

  // File count contribution
  if (metrics.fileCount && metrics.fileCount > 0) {
    weightedSize += calculateSizeFromFileCount(metrics.fileCount) * w.fileCount;
    totalWeight += w.fileCount;
  }

  // Line count contribution
  if (metrics.lineCount && metrics.lineCount > 0) {
    weightedSize += calculateSizeFromLineCount(metrics.lineCount) * w.lineCount;
    totalWeight += w.lineCount;
  }

  // Commit count contribution
  if (metrics.commitCount && metrics.commitCount > 0) {
    const commitSize = 1.0 + (Math.log10(metrics.commitCount) - 1) * 0.5;
    weightedSize += Math.min(Math.max(commitSize, 1.0), 3.5) * w.commitCount;
    totalWeight += w.commitCount;
  }

  // Contributors contribution
  if (metrics.contributors && metrics.contributors > 0) {
    const contributorSize = 1.0 + (Math.log10(Math.max(metrics.contributors, 1)) * 0.5);
    weightedSize += Math.min(Math.max(contributorSize, 1.0), 3.0) * w.contributors;
    totalWeight += w.contributors;
  }

  // If no metrics available, return minimum size
  if (totalWeight === 0) return 1.0;

  // Normalize by actual total weight
  const finalSize = weightedSize / totalWeight;

  return Math.min(Math.max(finalSize, 1.5), 4.0);
}

/**
 * Main function to calculate repository sprite size
 * Automatically selects the best calculation method based on available metrics
 *
 * Priority:
 * 1. Composite metrics (if multiple metrics available)
 * 2. File count (most reliable single metric)
 * 3. Line count (fallback)
 * 4. Default size (1.0x)
 *
 * @param metrics - Repository metrics object
 * @returns Size multiplier between 1.0x and 4.0x
 */
export function calculateRepositorySize(metrics?: RepositoryMetrics): number {
  if (!metrics) return 1.0;

  // Count available metrics
  const availableMetrics = [
    metrics.fileCount,
    metrics.lineCount,
    metrics.commitCount,
    metrics.contributors,
  ].filter((m) => m !== undefined && m > 0).length;

  // Use composite if we have multiple metrics
  if (availableMetrics >= 2) {
    return calculateSizeFromCompositeMetrics(metrics);
  }

  // Use file count if available (preferred single metric)
  if (metrics.fileCount && metrics.fileCount > 0) {
    return calculateSizeFromFileCount(metrics.fileCount);
  }

  // Fallback to line count
  if (metrics.lineCount && metrics.lineCount > 0) {
    return calculateSizeFromLineCount(metrics.lineCount);
  }

  // Default size
  return 1.0;
}
