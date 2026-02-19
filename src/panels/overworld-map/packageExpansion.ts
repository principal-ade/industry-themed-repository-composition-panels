/**
 * Package Expansion Utilities
 *
 * Converts repositories with multiple packages into multiple GenericNode instances,
 * with each node sized based on individual package file counts.
 */

import type { FileSet } from '../../types/composition';
import type { AlexandriaEntryWithMetrics } from '../CollectionMapPanel';
import { calculateSizeFromFileCount } from '../../utils/repositoryScaling';

/**
 * Calculate total file count from a package's fileSets
 *
 * @param fileSets - Array of FileSets from PackageLayer.derivedFrom.fileSets
 * @returns Total file count across all file sets
 */
function calculatePackageFileCount(fileSets: FileSet[]): number {
  return fileSets.reduce((total, fileSet) => {
    // Priority 1: Use fileCount if available
    if (fileSet.fileCount !== undefined) {
      return total + fileSet.fileCount;
    }
    // Priority 2: Use matchedFiles length if available
    if (fileSet.matchedFiles?.length) {
      return total + fileSet.matchedFiles.length;
    }
    // No file count data available
    return total;
  }, 0);
}

/**
 * Add package metadata to a repository node for subdivision rendering
 *
 * @param repository - Repository with optional packages array
 * @returns Array of PackageInfo for rendering subdivision, or undefined if no packages
 */
export function extractPackageInfo(
  repository: AlexandriaEntryWithMetrics
): import('./genericMapper').PackageInfo[] | undefined {
  // Check if repository has multiple packages
  if (!repository.packages || repository.packages.length <= 1) {
    return undefined;
  }

  // Extract package info for subdivision rendering
  return repository.packages.map((pkg) => {
    // Calculate file count from package's fileSets
    const fileCount = calculatePackageFileCount(pkg.derivedFrom.fileSets);

    // Calculate sprite size from file count
    const size = calculateSizeFromFileCount(fileCount);

    // Extract language from package type
    let language: string | undefined;
    if (pkg.type !== 'package') {
      // Map package type to language name
      const typeToLanguage: Record<string, string> = {
        node: 'typescript',
        python: 'python',
        cargo: 'rust',
        go: 'go',
      };
      language = typeToLanguage[pkg.type];
    } else if (repository.github) {
      language = repository.github.primaryLanguage;
    }

    return {
      name: pkg.packageData.name,
      size,
      language,
    };
  });
}
