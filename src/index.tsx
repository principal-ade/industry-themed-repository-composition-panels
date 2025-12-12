import { GitChangesPanel } from './panels/GitChangesPanel';
import { PackageCompositionPanel } from './panels/PackageCompositionPanel';
import { DependenciesPanel } from './panels/DependenciesPanel';
import { SearchPanel } from './panels/SearchPanel';
import type { PanelDefinition, PanelContextValue } from './types';

/**
 * Export array of panel definitions.
 * This is the required export for panel extensions.
 */
export const panels: PanelDefinition[] = [
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
      id: 'industry-theme.dependencies',
      name: 'Dependencies',
      icon: 'Package',
      version: '0.1.0',
      author: 'Industry Theme',
      description: 'View and explore package dependencies',
      slices: ['packages'],
    },
    component: DependenciesPanel,

    onMount: async (context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Dependencies Panel mounted');

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
      console.log('Dependencies Panel unmounting');
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
export type { GitChangesPanelProps } from './panels/GitChangesPanel';
export { PackageCompositionPanel, PackageCompositionPanelContent, PackageCompositionPanelPreview } from './panels/PackageCompositionPanel';
export type { PackageCompositionPanelProps } from './panels/PackageCompositionPanel';
export { DependenciesPanel } from './panels/DependenciesPanel';
export { SearchPanel, SearchPanelContent, SearchPanelPreview } from './panels/SearchPanel';
export type { SearchPanelProps } from './panels/SearchPanel';

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
