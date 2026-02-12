/**
 * Dependencies Panel Type Definitions
 */

import type { PackageLayer, PackageSummary, PackagesSliceData } from '@principal-ai/codebase-composition';

// Re-export for convenience
export type { PackageLayer, PackageSummary, PackagesSliceData };

/**
 * Basic dependency item for display
 */
export interface DependencyItem {
  name: string;
  version: string;
  dependencyType: 'production' | 'development' | 'peer';
}
