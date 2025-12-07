/**
 * Dependencies Panel Type Definitions
 */

import type { PackageLayer } from './composition';

// Re-export for convenience
export type { PackageLayer };

/**
 * Basic dependency item for display
 */
export interface DependencyItem {
  name: string;
  version: string;
  dependencyType: 'production' | 'development' | 'peer';
}

/**
 * Package summary from the packages slice
 */
export interface PackageSummary {
  isMonorepo: boolean;
  rootPackageName?: string;
  totalPackages: number;
  workspacePackages: Array<{ name?: string; path: string }>;
  totalDependencies: number;
  totalDevDependencies: number;
  availableScripts: string[];
}

/**
 * Packages slice data structure
 */
export interface PackagesSliceData {
  packages: PackageLayer[];
  summary: PackageSummary;
}
