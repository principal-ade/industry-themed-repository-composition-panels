import { GitChangesPanel } from './panels/GitChangesPanel';
import { PackageCompositionPanel } from './panels/PackageCompositionPanel';
import { SearchPanel } from './panels/SearchPanel';
import { DependencyGraphPanel } from './panels/dependency-graph';
import { CollectionMapPanel, CollectionMapPanelActions } from './panels/CollectionMapPanel';
import { TelemetryCoveragePanel } from './panels/TelemetryCoveragePanel';
import type { PanelDefinition, PanelContextValue, PanelActions } from './types';

/**
 * Export array of panel definitions.
 * This is the required export for panel extensions.
 *
 * Note: Uses `any` for TActions because this is a heterogeneous array containing
 * panels with different action type requirements (e.g., CollectionMapPanelActions).
 * Each panel definition is still individually type-checked.
 */
export const panels: ReadonlyArray<PanelDefinition<any, {}>> = [
  {
    metadata: {
      id: 'industry-theme.git-changes',
      name: 'Git Changes',
      icon: 'GitBranch',
      version: '0.1.0',
      author: 'Industry Theme',
      description: 'View repository git changes with file tree visualization',
      slices: ['git', 'fileTree'],
    },
    component: GitChangesPanel,

    onMount: async (context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Git Changes Panel mounted');

      // Refresh git status if available
      if (
        context.hasSlice('git') &&
        !context.isSliceLoading('git')
      ) {
        await context.refresh('repository', 'git');
      }
    },

    onUnmount: async (_context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Git Changes Panel unmounting');
    },
  },
  {
    metadata: {
      id: 'industry-theme.package-composition',
      name: 'Package Composition',
      icon: 'Package',
      version: '0.1.0',
      author: 'Industry Theme',
      description: 'View detected packages, dependencies, configs, and available commands',
      slices: ['packages'],
    },
    component: PackageCompositionPanel,

    onMount: async (context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Package Composition Panel mounted');

      // Refresh packages if available
      if (
        context.hasSlice('packages') &&
        !context.isSliceLoading('packages')
      ) {
        await context.refresh('repository', 'packages');
      }
    },

    onUnmount: async (_context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Package Composition Panel unmounting');
    },
  },
  {
    metadata: {
      id: 'industry-theme.search',
      name: 'Search',
      icon: 'Search',
      version: '0.1.0',
      author: 'Industry Theme',
      description: 'Search files in the repository by filename',
      slices: ['fileTree'],
    },
    component: SearchPanel,

    onMount: async (context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Search Panel mounted');

      // Refresh fileTree if available
      if (
        context.hasSlice('fileTree') &&
        !context.isSliceLoading('fileTree')
      ) {
        await context.refresh('repository', 'fileTree');
      }
    },

    onUnmount: async (_context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Search Panel unmounting');
    },
  },
  {
    metadata: {
      id: 'industry-theme.dependency-graph',
      name: 'Dependency Graph',
      icon: 'GitBranch',
      version: '0.1.0',
      author: 'Industry Theme',
      description: 'Visualize monorepo package dependencies as an interactive graph',
      slices: ['packages'],
    },
    component: DependencyGraphPanel,

    onMount: async (context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Dependency Graph Panel mounted');

      // Refresh packages if available
      if (
        context.hasSlice('packages') &&
        !context.isSliceLoading('packages')
      ) {
        await context.refresh('repository', 'packages');
      }
    },

    onUnmount: async (_context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Dependency Graph Panel unmounting');
    },
  },
  {
    metadata: {
      id: 'industry-theme.collection-map',
      name: 'Collection Map',
      icon: 'Map',
      version: '0.1.0',
      author: 'Industry Theme',
      description: 'Visualize Alexandria Collections as 8-bit overworld maps',
      slices: [],
    },
    component: CollectionMapPanel,

    onMount: async (_context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Collection Map Panel mounted');
    },

    onUnmount: async (_context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Collection Map Panel unmounting');
    },
  },
  {
    metadata: {
      id: 'industry-theme.telemetry-coverage',
      name: 'Telemetry Coverage',
      icon: 'Activity',
      version: '0.1.0',
      author: 'Industry Theme',
      description: 'View OpenTelemetry test coverage across packages',
      slices: ['packages', 'fileTree'],
    },
    component: TelemetryCoveragePanel,

    onMount: async (context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Telemetry Coverage Panel mounted');

      // Refresh packages and fileTree if available
      if (
        context.hasSlice('packages') &&
        !context.isSliceLoading('packages')
      ) {
        await context.refresh('repository', 'packages');
      }
      if (
        context.hasSlice('fileTree') &&
        !context.isSliceLoading('fileTree')
      ) {
        await context.refresh('repository', 'fileTree');
      }
    },

    onUnmount: async (_context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Telemetry Coverage Panel unmounting');
    },
  },
];

/**
 * Optional: Called once when the entire package is loaded.
 */
export const onPackageLoad = async () => {
  // eslint-disable-next-line no-console
  console.log('Repository Composition Panels package loaded');
};

/**
 * Optional: Called once when the package is unloaded.
 */
export const onPackageUnload = async () => {
  // eslint-disable-next-line no-console
  console.log('Repository Composition Panels package unloading');
};

// Re-export components for direct usage (e.g., in Storybook)
export { GitChangesPanel, GitChangesPanelContent, GitChangesPanelPreview } from './panels/GitChangesPanel';
export type { GitChangesPanelProps, ContextMenuAction } from './panels/GitChangesPanel';
export { PackageCompositionPanel, PackageCompositionPanelContent, PackageCompositionPanelPreview } from './panels/PackageCompositionPanel';
export type { PackageCompositionPanelProps } from './panels/PackageCompositionPanel';
export { SearchPanel, SearchPanelContent, SearchPanelPreview } from './panels/SearchPanel';
export type { SearchPanelProps } from './panels/SearchPanel';
export {
  DependencyGraphPanel,
  DependencyGraphPanelContent,
  DependencyGraphPanelPreview,
  dependencyTreeToCanvas,
  applyForceLayout,
  applySugiyamaLayout,
} from './panels/dependency-graph';
export type {
  DependencyGraphPanelProps,
  DependencyCanvasOptions,
  ForceLayoutOptions,
  SugiyamaLayoutOptions,
} from './panels/dependency-graph';

// Overworld map visualization components and utilities
export {
  OverworldMapPanelContent,
  // Generic converters (use for repos, services, any nodes!)
  nodesToOverworldMap,
  nodesToUnifiedOverworldMap,
  nodesToOverworldMapCollection,
  // Utilities
  gridToScreen,
  screenToGrid,
  MAX_NODES_PER_MAP,
} from './panels/overworld-map';
export type {
  OverworldMapPanelProps,
  OverworldMap,
  OverworldMapCollection,
  MapRegion,
  LocationNode,
  PathConnection,
  GenericNode,
  GenericMapperOptions,
} from './panels/overworld-map';

export {
  TelemetryCoveragePanel,
  TelemetryCoveragePanelContent,
  TelemetryCoveragePanelPreview,
} from './panels/TelemetryCoveragePanel';
export type {
  TelemetryCoveragePanelProps,
  PackageTelemetryCoverage,
} from './panels/TelemetryCoveragePanel';

export {
  CollectionMapPanel,
  CollectionMapPanelContent,
} from './panels/CollectionMapPanel';
export type {
  CollectionMapPanelProps,
  AlexandriaEntryWithMetrics,
  RegionCallbacks,
  CollectionMapPanelActions,
} from './panels/CollectionMapPanel';

// Re-export alexandria-collections types for backwards compatibility
export type {
  Collection,
  CollectionMembership,
  CustomRegion,
  CollectionMetadata,
  CollectionMembershipMetadata,
  RepositoryLayoutData,
} from '@principal-ai/alexandria-collections';

// Re-export types
export type {
  GitStatus,
  GitChangeSelectionStatus,
  GitFileStatus,
  FileTree,
  PanelComponentProps,
  PanelDefinition,
  PanelContextValue,
  PackageLayer,
  PackageCommand,
  ConfigFile,
  QualityMetrics,
  DependencyItem,
  PackageSummary,
  PackagesSliceData,
} from './types';
