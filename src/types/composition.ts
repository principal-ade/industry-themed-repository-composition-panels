/**
 * Types re-exported from @principal-ai/codebase-composition
 *
 * This file re-exports types from the core library to avoid duplication.
 * All composition-related types should be imported from here.
 */

// Re-export all layer types from codebase-composition
export type {
  // Base types
  FilePattern,
  FileSet,
  BaseLayer,

  // Package types
  PackageCommand,
  ConfigFile,
  PackageLayer,

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
} from '@principal-ai/codebase-composition';
