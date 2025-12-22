import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useCallback } from 'react';
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

/**
 * Interactive story to test dynamic changes
 */
const InteractiveGitChangesPanel = () => {
  const [gitStatus, setGitStatus] = useState<GitStatus>({
    staged: [],
    unstaged: [],
    untracked: [],
    deleted: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const addStagedFile = useCallback(() => {
    setGitStatus(prev => ({
      ...prev,
      staged: [...prev.staged, `src/components/NewComponent${prev.staged.length + 1}.tsx`],
    }));
  }, []);

  const addUnstagedFile = useCallback(() => {
    setGitStatus(prev => ({
      ...prev,
      unstaged: [...prev.unstaged, `src/utils/helper${prev.unstaged.length + 1}.ts`],
    }));
  }, []);

  const addUntrackedFile = useCallback(() => {
    setGitStatus(prev => ({
      ...prev,
      untracked: [...prev.untracked, `src/new/file${prev.untracked.length + 1}.tsx`],
    }));
  }, []);

  const addDeletedFile = useCallback(() => {
    setGitStatus(prev => ({
      ...prev,
      deleted: [...prev.deleted, `src/old/deprecated${prev.deleted.length + 1}.ts`],
    }));
  }, []);

  const clearAllChanges = useCallback(() => {
    setGitStatus({
      staged: [],
      unstaged: [],
      untracked: [],
      deleted: [],
    });
  }, []);

  const addMultipleChanges = useCallback(() => {
    setGitStatus({
      staged: ['src/components/Button.tsx', 'src/styles/theme.css'],
      unstaged: ['README.md', 'package.json'],
      untracked: ['src/new-feature.tsx'],
      deleted: ['src/deprecated/old-file.ts'],
    });
  }, []);

  const simulateLoading = useCallback(() => {
    setIsLoading(true);
    setGitStatus({
      staged: [],
      unstaged: [],
      untracked: [],
      deleted: [],
    });
    setTimeout(() => {
      setGitStatus({
        staged: ['src/components/Button.tsx'],
        unstaged: ['README.md', 'package.json'],
        untracked: ['src/new-feature.tsx'],
        deleted: [],
      });
      setIsLoading(false);
    }, 1500);
  }, []);

  const totalChanges =
    gitStatus.staged.length +
    gitStatus.unstaged.length +
    gitStatus.untracked.length +
    gitStatus.deleted.length;

  return (
    <ThemeProvider>
      <div style={{ height: '100vh', background: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>
        {/* Control Panel */}
        <div style={{
          padding: '12px',
          background: '#2a2a2a',
          borderBottom: '1px solid #444',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <span style={{ color: '#888', fontSize: '12px', marginRight: '8px' }}>
            Changes: {totalChanges} | Loading: {isLoading ? 'Yes' : 'No'}
          </span>
          <button onClick={addStagedFile} style={buttonStyle('#22c55e')}>+ Staged</button>
          <button onClick={addUnstagedFile} style={buttonStyle('#f59e0b')}>+ Unstaged</button>
          <button onClick={addUntrackedFile} style={buttonStyle('#3b82f6')}>+ Untracked</button>
          <button onClick={addDeletedFile} style={buttonStyle('#ef4444')}>+ Deleted</button>
          <button onClick={addMultipleChanges} style={buttonStyle('#8b5cf6')}>Add Multiple</button>
          <button onClick={clearAllChanges} style={buttonStyle('#666')}>Clear All</button>
          <button onClick={simulateLoading} style={buttonStyle('#0ea5e9')}>Simulate Load</button>
        </div>

        {/* Panel */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <GitChangesPanelContent
            gitStatus={gitStatus}
            rootPath="/Users/developer/my-project"
            isLoading={isLoading}
            onFileClick={(filePath, status) => console.log('Clicked:', filePath, status)}
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

const buttonStyle = (color: string): React.CSSProperties => ({
  padding: '6px 12px',
  fontSize: '12px',
  background: color,
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
});

export const Interactive: StoryObj = {
  render: () => <InteractiveGitChangesPanel />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive story to test dynamic git status changes and view switching behavior.',
      },
    },
  },
};
