/**
 * Panel Extension Type Definitions
 *
 * Re-exports core types from @principal-ade/panel-framework-core
 */

// Re-export composition types
export type {
  PackageLayer,
  PackageCommand,
  ConfigFile,
  QualityMetrics,
  LensOperation,
  BaseLayer,
  FilePattern,
  FileSet,
} from './composition';

// Re-export dependencies panel types
export type {
  DependencyItem,
  PackageSummary,
  PackagesSliceData,
} from './dependencies';

// Re-export all core types from panel-framework-core
export type {
  // Core data types
  DataSlice,
  WorkspaceMetadata,
  RepositoryMetadata,
  FileTreeSource,
  ActiveFileSlice,

  // Event system
  PanelEventType,
  PanelEvent,
  PanelEventEmitter,

  // Panel interface
  PanelActions,
  PanelContextValue,
  PanelComponentProps,

  // Panel definition
  PanelMetadata,
  PanelLifecycleHooks,
  PanelDefinition,
  PanelModule,

  // Registry types
  PanelRegistryEntry,
  PanelLoader,
  PanelRegistryConfig,

  // Tool types (UTCP-compatible)
  PanelTool,
  PanelToolsMetadata,
  JsonSchema,
  PanelEventCallTemplate,
} from '@principal-ade/panel-framework-core';

import type {
  PanelActions as CorePanelActions,
  PanelComponentProps as CorePanelComponentProps,
  DataSlice,
} from '@principal-ade/panel-framework-core';
import type {
  FileTree,
  GitStatusWithFiles,
} from '@principal-ai/repository-abstraction';
import type { PackagesSliceData } from './dependencies';

// Re-export file tree types
export type { GitFileStatus } from '@principal-ade/dynamic-file-tree';
export type {
  FileTree,
  GitStatusWithFiles,
} from '@principal-ai/repository-abstraction';

/**
 * Git status data - categorized file paths
 */
export interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
  deleted: string[];
}

/**
 * Git change selection status for callbacks
 */
export type GitChangeSelectionStatus =
  | 'staged'
  | 'unstaged'
  | 'untracked'
  | 'deleted';

// ============================================================================
// Typed Panel Interfaces (v0.4.2+)
// ============================================================================

/**
 * Typed context for GitChangesPanel
 *
 * Note: Slices use `DataSlice<T | null>` to distinguish between:
 * - `null` = "not fetched yet" or "not available"
 * - Empty data = "fetched successfully, no items"
 */
export interface GitChangesPanelContext {
  gitStatusWithFiles: DataSlice<GitStatusWithFiles | null>;
  fileTree: DataSlice<FileTree | null>;
}

/**
 * Typed panel props for GitChangesPanel
 */
export type GitChangesPanelPropsTyped = CorePanelComponentProps<
  CorePanelActions,
  GitChangesPanelContext
>;

/**
 * Typed context for PackageCompositionPanel
 */
export interface PackageCompositionPanelContext {
  packages: DataSlice<PackagesSliceData | null>;
}

/**
 * Typed panel props for PackageCompositionPanel
 */
export type PackageCompositionPanelPropsTyped = CorePanelComponentProps<
  CorePanelActions,
  PackageCompositionPanelContext
>;

/**
 * Typed context for SearchPanel
 */
export interface SearchPanelContext {
  fileTree: DataSlice<FileTree | null>;
}

/**
 * Typed panel props for SearchPanel
 */
export type SearchPanelPropsTyped = CorePanelComponentProps<
  CorePanelActions,
  SearchPanelContext
>;

/**
 * Typed context for DependencyGraphPanel
 */
export interface DependencyGraphPanelContext {
  packages: DataSlice<PackagesSliceData | null>;
}

/**
 * Typed panel props for DependencyGraphPanel
 */
export type DependencyGraphPanelPropsTyped = CorePanelComponentProps<
  CorePanelActions,
  DependencyGraphPanelContext
>;

/**
 * Typed context for TelemetryCoveragePanel
 */
export interface TelemetryCoveragePanelContext {
  packages: DataSlice<PackagesSliceData | null>;
  fileTree: DataSlice<FileTree | null>;
}

/**
 * Typed panel props for TelemetryCoveragePanel
 */
export type TelemetryCoveragePanelPropsTyped = CorePanelComponentProps<
  CorePanelActions,
  TelemetryCoveragePanelContext
>;
