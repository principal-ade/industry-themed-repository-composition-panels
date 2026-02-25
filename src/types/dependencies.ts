/**
 * Dependencies Panel Type Definitions
 */

import type {
  PackageLayer,
  PackageSummary,
  PackagesSliceData,
} from '@principal-ai/codebase-composition';

// Re-export for convenience
export type { PackageLayer, PackageSummary, PackagesSliceData };

/**
 * Dependency type
 */
export type DependencyType = 'production' | 'development' | 'peer';

/**
 * Basic dependency item for display
 * Supports multiple dependency types for packages that appear in multiple categories
 */
export interface DependencyItem {
  name: string;
  version: string;
  /** Primary dependency type (for sorting) */
  dependencyType: DependencyType;
  /** All dependency types this package belongs to */
  dependencyTypes: DependencyType[];
  /** Package scope/namespace (e.g., '@scope' from '@scope/package') */
  namespace?: string;
  /** Package name without scope */
  packageName: string;
}
