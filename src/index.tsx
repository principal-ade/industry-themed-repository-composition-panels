import { GitChangesPanel } from './panels/GitChangesPanel';
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

// Re-export types
export type {
  GitStatus,
  GitChangeSelectionStatus,
  GitFileStatus,
  FileTree,
  PanelComponentProps,
  PanelDefinition,
  PanelContextValue,
} from './types';
