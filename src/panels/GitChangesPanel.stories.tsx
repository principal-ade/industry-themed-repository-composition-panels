import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from '@principal-ade/industry-theme';
import { GitChangesPanelContent, GitChangesPanelPreview } from './GitChangesPanel';
import type { GitStatus, GitChangeSelectionStatus } from '../types';

/**
 * GitChangesPanelContent displays git status changes in a file tree format.
 * It supports two view modes: "Full Tree" (complete file structure) and "Changes Only" (modified files only).
 *
 * Note: This is the direct-props version. The GitChangesPanel component is the Panel Framework wrapper.
 */
const meta = {
  title: 'Panels/GitChangesPanel',
  component: GitChangesPanelContent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A panel that displays git changes with color-coded status indicators. Supports both panel and tab variants.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div style={{ height: '100vh', background: '#1a1a1a' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof GitChangesPanelContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample git status data
const sampleGitStatus: GitStatus = {
  staged: [
    'src/components/Button.tsx',
    'src/styles/theme.css',
  ],
  unstaged: [
    'README.md',
    'package.json',
    'src/utils/helpers.ts',
  ],
  untracked: [
    'src/new-feature.tsx',
    'src/components/NewComponent.tsx',
  ],
  deleted: [
    'src/deprecated/old-file.ts',
  ],
};

const emptyGitStatus: GitStatus = {
  staged: [],
  unstaged: [],
  untracked: [],
  deleted: [],
};

/**
 * Default panel with various git changes
 */
export const Default: Story = {
  args: {
    gitStatus: sampleGitStatus,
    rootPath: '/Users/developer/my-project',
    onFileClick: (filePath: string, status?: GitChangeSelectionStatus) => {
      console.log('File clicked:', filePath, 'Status:', status);
    },
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    gitStatus: emptyGitStatus,
    isLoading: true,
    loadingMessage: 'Fetching git status...',
  },
};

/**
 * No changes - clean working directory
 */
export const NoChanges: Story = {
  args: {
    gitStatus: emptyGitStatus,
    rootPath: '/Users/developer/my-project',
    emptyMessage: 'Working directory clean - no changes',
  },
};

/**
 * Only staged changes
 */
export const OnlyStaged: Story = {
  args: {
    gitStatus: {
      staged: [
        'src/index.ts',
        'src/components/App.tsx',
        'src/styles/main.css',
      ],
      unstaged: [],
      untracked: [],
      deleted: [],
    },
    rootPath: '/Users/developer/my-project',
  },
};

/**
 * Only unstaged modifications
 */
export const OnlyUnstaged: Story = {
  args: {
    gitStatus: {
      staged: [],
      unstaged: [
        'package.json',
        'tsconfig.json',
        'src/config.ts',
      ],
      untracked: [],
      deleted: [],
    },
    rootPath: '/Users/developer/my-project',
  },
};

/**
 * Only untracked files
 */
export const OnlyUntracked: Story = {
  args: {
    gitStatus: {
      staged: [],
      unstaged: [],
      untracked: [
        'src/new-feature/index.ts',
        'src/new-feature/component.tsx',
        'src/new-feature/styles.css',
        'docs/NEW_FEATURE.md',
      ],
      deleted: [],
    },
    rootPath: '/Users/developer/my-project',
  },
};

/**
 * Only deleted files
 */
export const OnlyDeleted: Story = {
  args: {
    gitStatus: {
      staged: [],
      unstaged: [],
      untracked: [],
      deleted: [
        'src/deprecated/old-component.tsx',
        'src/deprecated/legacy-utils.ts',
        'src/deprecated/index.ts',
      ],
    },
    rootPath: '/Users/developer/my-project',
  },
};

/**
 * Many changes - stress test
 */
export const ManyChanges: Story = {
  args: {
    gitStatus: {
      staged: Array.from({ length: 10 }, (_, i) => `src/components/Component${i}.tsx`),
      unstaged: Array.from({ length: 15 }, (_, i) => `src/utils/util${i}.ts`),
      untracked: Array.from({ length: 8 }, (_, i) => `src/new/file${i}.tsx`),
      deleted: [
        'src/old/deprecated.ts',
        'src/old/legacy.ts',
      ],
    },
    rootPath: '/Users/developer/large-project',
  },
};

/**
 * With selected file
 */
export const WithSelectedFile: Story = {
  args: {
    gitStatus: sampleGitStatus,
    rootPath: '/Users/developer/my-project',
    selectedFile: 'src/components/Button.tsx',
  },
};

/**
 * Preview component - shown in panel switcher
 */
export const Preview: StoryObj<typeof GitChangesPanelPreview> = {
  render: () => (
    <ThemeProvider>
      <div style={{ width: '200px', background: '#1a1a1a', borderRadius: '8px' }}>
        <GitChangesPanelPreview />
      </div>
    </ThemeProvider>
  ),
};
