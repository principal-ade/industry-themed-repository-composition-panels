/**
 * Types re-exported from @principal-ai/codebase-composition
 *
 * This file re-exports types from the core library to avoid duplication.
 * All composition-related types should be imported from here.
 */

import type { PackageLayer as BasePackageLayer } from '@principal-ai/codebase-composition';
import type { AgingMetrics } from '../utils/repositoryAging';

// Re-export all layer types from codebase-composition
export type {
  // Base types
  FilePattern,
  FileSet,
  BaseLayer,

  // Package types
  PackageCommand,
  ConfigFile,

  // Quality types
  QualityMetrics,
  LensOperation,
  LensReadiness,
  LensRequirement,
  LensRequirements,
  RequirementCheckResult,

  // Monorepo types
  MonorepoOrchestrator,
  MonorepoMetadata,
  MonorepoRootRole,
} from '@principal-ai/codebase-composition';

/**
 * Extended PackageLayer with visualization-specific properties
 * Used internally for overworld map rendering
 */
export interface PackageLayer extends BasePackageLayer {
  /** Size multiplier for sprite (1.5x - 4.0x, based on repository metrics) */
  size?: number;

  /** Importance level 0-100 (affects visual prominence) */
  importance?: number;

  /** Aging metrics for weathering and color fade (based on lastEditedAt) */
  aging?: AgingMetrics;
}
