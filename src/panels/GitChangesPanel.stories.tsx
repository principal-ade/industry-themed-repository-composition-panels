import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useCallback } from 'react';
import { ThemeProvider } from '@principal-ade/industry-theme';
import {
  GitChangesPanelContent,
  GitChangesPanelPreview,
} from './GitChangesPanel';
import type { GitChangeSelectionStatus } from '../types';
import type {
  FileTree,
  GitStatusWithFiles,
} from '@principal-ai/repository-abstraction';

/**
 * GitChangesPanelContent displays git status changes in a full file tree format with git status overlays.
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
const sampleGitStatus: GitStatusWithFiles = {
  repoPath: '/Users/developer/my-project',
  branch: 'main',
  isDirty: true,
  hasUntracked: true,
  hasStaged: true,
  ahead: 0,
  behind: 0,
  watchingEnabled: false,
  stagedFiles: ['src/components/Button.tsx', 'src/styles/theme.css'],
  modifiedFiles: ['README.md', 'package.json', 'src/utils/helpers.ts'],
  untrackedFiles: ['src/new-feature.tsx', 'src/components/NewComponent.tsx'],
  deletedFiles: ['src/deprecated/old-file.ts'],
  createdFiles: [],
  hash: 'mock-hash-123',
};

const emptyGitStatus: GitStatusWithFiles = {
  repoPath: '/Users/developer/my-project',
  branch: 'main',
  isDirty: false,
  hasUntracked: false,
  hasStaged: false,
  ahead: 0,
  behind: 0,
  watchingEnabled: false,
  stagedFiles: [],
  modifiedFiles: [],
  untrackedFiles: [],
  deletedFiles: [],
  createdFiles: [],
  hash: 'empty',
};

// Sample file tree structure - matches @principal-ai/repository-abstraction FileTree interface
const sampleFileTree: FileTree = {
  sha: 'mock-sha-123',
  root: {
    name: 'my-project',
    path: '/Users/developer/my-project',
    relativePath: '',
    fileCount: 8,
    totalSize: 25600,
    depth: 0,
    children: [
      {
        name: 'src',
        path: '/Users/developer/my-project/src',
        relativePath: 'src',
        fileCount: 6,
        totalSize: 20480,
        depth: 1,
        children: [
          {
            name: 'components',
            path: '/Users/developer/my-project/src/components',
            relativePath: 'src/components',
            fileCount: 2,
            totalSize: 5120,
            depth: 2,
            children: [
              {
                name: 'Button.tsx',
                path: '/Users/developer/my-project/src/components/Button.tsx',
                relativePath: 'src/components/Button.tsx',
                extension: '.tsx',
                size: 2560,
                lastModified: new Date('2024-01-15'),
                isDirectory: false,
              },
              {
                name: 'NewComponent.tsx',
                path: '/Users/developer/my-project/src/components/NewComponent.tsx',
                relativePath: 'src/components/NewComponent.tsx',
                extension: '.tsx',
                size: 2560,
                lastModified: new Date('2024-01-16'),
                isDirectory: false,
              },
            ],
          },
          {
            name: 'styles',
            path: '/Users/developer/my-project/src/styles',
            relativePath: 'src/styles',
            fileCount: 1,
            totalSize: 1024,
            depth: 2,
            children: [
              {
                name: 'theme.css',
                path: '/Users/developer/my-project/src/styles/theme.css',
                relativePath: 'src/styles/theme.css',
                extension: '.css',
                size: 1024,
                lastModified: new Date('2024-01-14'),
                isDirectory: false,
              },
            ],
          },
          {
            name: 'utils',
            path: '/Users/developer/my-project/src/utils',
            relativePath: 'src/utils',
            fileCount: 1,
            totalSize: 2048,
            depth: 2,
            children: [
              {
                name: 'helpers.ts',
                path: '/Users/developer/my-project/src/utils/helpers.ts',
                relativePath: 'src/utils/helpers.ts',
                extension: '.ts',
                size: 2048,
                lastModified: new Date('2024-01-13'),
                isDirectory: false,
              },
            ],
          },
          {
            name: 'deprecated',
            path: '/Users/developer/my-project/src/deprecated',
            relativePath: 'src/deprecated',
            fileCount: 1,
            totalSize: 1024,
            depth: 2,
            children: [
              {
                name: 'old-file.ts',
                path: '/Users/developer/my-project/src/deprecated/old-file.ts',
                relativePath: 'src/deprecated/old-file.ts',
                extension: '.ts',
                size: 1024,
                lastModified: new Date('2023-12-01'),
                isDirectory: false,
              },
            ],
          },
          {
            name: 'new-feature.tsx',
            path: '/Users/developer/my-project/src/new-feature.tsx',
            relativePath: 'src/new-feature.tsx',
            extension: '.tsx',
            size: 3072,
            lastModified: new Date('2024-01-17'),
            isDirectory: false,
          },
        ],
      },
      {
        name: 'README.md',
        path: '/Users/developer/my-project/README.md',
        relativePath: 'README.md',
        extension: '.md',
        size: 2048,
        lastModified: new Date('2024-01-10'),
        isDirectory: false,
      },
      {
        name: 'package.json',
        path: '/Users/developer/my-project/package.json',
        relativePath: 'package.json',
        extension: '.json',
        size: 3072,
        lastModified: new Date('2024-01-12'),
        isDirectory: false,
      },
    ],
  },
  allFiles: [
    {
      name: 'Button.tsx',
      path: '/Users/developer/my-project/src/components/Button.tsx',
      relativePath: 'src/components/Button.tsx',
      extension: '.tsx',
      size: 2560,
      lastModified: new Date('2024-01-15'),
      isDirectory: false,
    },
    {
      name: 'NewComponent.tsx',
      path: '/Users/developer/my-project/src/components/NewComponent.tsx',
      relativePath: 'src/components/NewComponent.tsx',
      extension: '.tsx',
      size: 2560,
      lastModified: new Date('2024-01-16'),
      isDirectory: false,
    },
    {
      name: 'theme.css',
      path: '/Users/developer/my-project/src/styles/theme.css',
      relativePath: 'src/styles/theme.css',
      extension: '.css',
      size: 1024,
      lastModified: new Date('2024-01-14'),
      isDirectory: false,
    },
    {
      name: 'helpers.ts',
      path: '/Users/developer/my-project/src/utils/helpers.ts',
      relativePath: 'src/utils/helpers.ts',
      extension: '.ts',
      size: 2048,
      lastModified: new Date('2024-01-13'),
      isDirectory: false,
    },
    {
      name: 'old-file.ts',
      path: '/Users/developer/my-project/src/deprecated/old-file.ts',
      relativePath: 'src/deprecated/old-file.ts',
      extension: '.ts',
      size: 1024,
      lastModified: new Date('2023-12-01'),
      isDirectory: false,
    },
    {
      name: 'new-feature.tsx',
      path: '/Users/developer/my-project/src/new-feature.tsx',
      relativePath: 'src/new-feature.tsx',
      extension: '.tsx',
      size: 3072,
      lastModified: new Date('2024-01-17'),
      isDirectory: false,
    },
    {
      name: 'README.md',
      path: '/Users/developer/my-project/README.md',
      relativePath: 'README.md',
      extension: '.md',
      size: 2048,
      lastModified: new Date('2024-01-10'),
      isDirectory: false,
    },
    {
      name: 'package.json',
      path: '/Users/developer/my-project/package.json',
      relativePath: 'package.json',
      extension: '.json',
      size: 3072,
      lastModified: new Date('2024-01-12'),
      isDirectory: false,
    },
  ],
  allDirectories: [],
  stats: {
    totalFiles: 8,
    totalDirectories: 5,
    totalSize: 25600,
    maxDepth: 3,
  },
  metadata: {
    id: 'mock-tree-id',
    timestamp: new Date('2024-01-17T10:00:00Z'),
    sourceType: 'mock',
    sourceInfo: {},
  },
};

/**
 * Default panel with various git changes
 */
export const Default: Story = {
  args: {
    gitStatus: sampleGitStatus,
    fileTree: sampleFileTree,
    rootPath: '/Users/developer/my-project',
    onFileClick: (_filePath: string, _status?: GitChangeSelectionStatus) => {},
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    gitStatus: emptyGitStatus,
    fileTree: sampleFileTree,
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
    fileTree: sampleFileTree,
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
      repoPath: '/Users/developer/my-project',
      branch: 'main',
      isDirty: true,
      hasUntracked: false,
      hasStaged: true,
      ahead: 0,
      behind: 0,
      watchingEnabled: false,
      stagedFiles: [
        'src/index.ts',
        'src/components/App.tsx',
        'src/styles/main.css',
      ],
      modifiedFiles: [],
      untrackedFiles: [],
      deletedFiles: [],
      createdFiles: [],
      hash: 'only-staged',
    },
    fileTree: sampleFileTree,
    rootPath: '/Users/developer/my-project',
  },
};

/**
 * Only unstaged modifications
 */
export const OnlyUnstaged: Story = {
  args: {
    gitStatus: {
      repoPath: '/Users/developer/my-project',
      branch: 'main',
      isDirty: true,
      hasUntracked: false,
      hasStaged: false,
      ahead: 0,
      behind: 0,
      watchingEnabled: false,
      stagedFiles: [],
      modifiedFiles: ['package.json', 'tsconfig.json', 'src/config.ts'],
      untrackedFiles: [],
      deletedFiles: [],
      createdFiles: [],
      hash: 'only-unstaged',
    },
    fileTree: sampleFileTree,
    rootPath: '/Users/developer/my-project',
  },
};

/**
 * Only untracked files
 */
export const OnlyUntracked: Story = {
  args: {
    gitStatus: {
      repoPath: '/Users/developer/my-project',
      branch: 'main',
      isDirty: true,
      hasUntracked: true,
      hasStaged: false,
      ahead: 0,
      behind: 0,
      watchingEnabled: false,
      stagedFiles: [],
      modifiedFiles: [],
      untrackedFiles: [
        'src/new-feature/index.ts',
        'src/new-feature/component.tsx',
        'src/new-feature/styles.css',
        'docs/NEW_FEATURE.md',
      ],
      deletedFiles: [],
      createdFiles: [],
      hash: 'only-untracked',
    },
    fileTree: sampleFileTree,
    rootPath: '/Users/developer/my-project',
  },
};

/**
 * Only deleted files
 */
export const OnlyDeleted: Story = {
  args: {
    gitStatus: {
      repoPath: '/Users/developer/my-project',
      branch: 'main',
      isDirty: true,
      hasUntracked: false,
      hasStaged: false,
      ahead: 0,
      behind: 0,
      watchingEnabled: false,
      stagedFiles: [],
      modifiedFiles: [],
      untrackedFiles: [],
      deletedFiles: [
        'src/deprecated/old-component.tsx',
        'src/deprecated/legacy-utils.ts',
        'src/deprecated/index.ts',
      ],
      createdFiles: [],
      hash: 'only-deleted',
    },
    fileTree: sampleFileTree,
    rootPath: '/Users/developer/my-project',
  },
};

/**
 * Many changes - stress test
 */
export const ManyChanges: Story = {
  args: {
    gitStatus: {
      repoPath: '/Users/developer/large-project',
      branch: 'main',
      isDirty: true,
      hasUntracked: true,
      hasStaged: true,
      ahead: 0,
      behind: 0,
      watchingEnabled: false,
      stagedFiles: Array.from(
        { length: 10 },
        (_, i) => `src/components/Component${i}.tsx`
      ),
      modifiedFiles: Array.from(
        { length: 15 },
        (_, i) => `src/utils/util${i}.ts`
      ),
      untrackedFiles: Array.from(
        { length: 8 },
        (_, i) => `src/new/file${i}.tsx`
      ),
      deletedFiles: ['src/old/deprecated.ts', 'src/old/legacy.ts'],
      createdFiles: [],
      hash: 'many-changes',
    },
    fileTree: sampleFileTree,
    rootPath: '/Users/developer/large-project',
  },
};

/**
 * With selected file
 */
export const WithSelectedFile: Story = {
  args: {
    gitStatus: sampleGitStatus,
    fileTree: sampleFileTree,
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
      <div
        style={{ width: '200px', background: '#1a1a1a', borderRadius: '8px' }}
      >
        <GitChangesPanelPreview />
      </div>
    </ThemeProvider>
  ),
};

/**
 * Interactive story to test dynamic changes
 */
const InteractiveGitChangesPanel = () => {
  const [gitStatus, setGitStatus] = useState<GitStatusWithFiles>({
    repoPath: '/Users/developer/my-project',
    branch: 'main',
    isDirty: false,
    hasUntracked: false,
    hasStaged: false,
    ahead: 0,
    behind: 0,
    watchingEnabled: false,
    stagedFiles: [],
    modifiedFiles: [],
    untrackedFiles: [],
    deletedFiles: [],
    createdFiles: [],
    hash: 'interactive',
  });
  const [isLoading, setIsLoading] = useState(false);

  const addStagedFile = useCallback(() => {
    setGitStatus((prev) => ({
      ...prev,
      isDirty: true,
      hasStaged: true,
      stagedFiles: [
        ...prev.stagedFiles,
        `src/components/NewComponent${prev.stagedFiles.length + 1}.tsx`,
      ],
    }));
  }, []);

  const addUnstagedFile = useCallback(() => {
    setGitStatus((prev) => ({
      ...prev,
      isDirty: true,
      modifiedFiles: [
        ...prev.modifiedFiles,
        `src/utils/helper${prev.modifiedFiles.length + 1}.ts`,
      ],
    }));
  }, []);

  const addUntrackedFile = useCallback(() => {
    setGitStatus((prev) => ({
      ...prev,
      isDirty: true,
      hasUntracked: true,
      untrackedFiles: [
        ...prev.untrackedFiles,
        `src/new/file${prev.untrackedFiles.length + 1}.tsx`,
      ],
    }));
  }, []);

  const addDeletedFile = useCallback(() => {
    setGitStatus((prev) => ({
      ...prev,
      isDirty: true,
      deletedFiles: [
        ...prev.deletedFiles,
        `src/old/deprecated${prev.deletedFiles.length + 1}.ts`,
      ],
    }));
  }, []);

  const clearAllChanges = useCallback(() => {
    setGitStatus({
      repoPath: '/Users/developer/my-project',
      branch: 'main',
      isDirty: false,
      hasUntracked: false,
      hasStaged: false,
      ahead: 0,
      behind: 0,
      watchingEnabled: false,
      stagedFiles: [],
      modifiedFiles: [],
      untrackedFiles: [],
      deletedFiles: [],
      createdFiles: [],
      hash: 'cleared',
    });
  }, []);

  const addMultipleChanges = useCallback(() => {
    setGitStatus({
      repoPath: '/Users/developer/my-project',
      branch: 'main',
      isDirty: true,
      hasUntracked: true,
      hasStaged: true,
      ahead: 0,
      behind: 0,
      watchingEnabled: false,
      stagedFiles: ['src/components/Button.tsx', 'src/styles/theme.css'],
      modifiedFiles: ['README.md', 'package.json'],
      untrackedFiles: ['src/new-feature.tsx'],
      deletedFiles: ['src/deprecated/old-file.ts'],
      createdFiles: [],
      hash: 'multiple',
    });
  }, []);

  const simulateLoading = useCallback(() => {
    setIsLoading(true);
    setGitStatus({
      repoPath: '/Users/developer/my-project',
      branch: 'main',
      isDirty: false,
      hasUntracked: false,
      hasStaged: false,
      ahead: 0,
      behind: 0,
      watchingEnabled: false,
      stagedFiles: [],
      modifiedFiles: [],
      untrackedFiles: [],
      deletedFiles: [],
      createdFiles: [],
      hash: 'loading',
    });
    setTimeout(() => {
      setGitStatus({
        repoPath: '/Users/developer/my-project',
        branch: 'main',
        isDirty: true,
        hasUntracked: true,
        hasStaged: true,
        ahead: 0,
        behind: 0,
        watchingEnabled: false,
        stagedFiles: ['src/components/Button.tsx'],
        modifiedFiles: ['README.md', 'package.json'],
        untrackedFiles: ['src/new-feature.tsx'],
        deletedFiles: [],
        createdFiles: [],
        hash: 'loaded',
      });
      setIsLoading(false);
    }, 1500);
  }, []);

  const totalChanges =
    gitStatus.stagedFiles.length +
    gitStatus.modifiedFiles.length +
    gitStatus.untrackedFiles.length +
    gitStatus.deletedFiles.length;

  return (
    <ThemeProvider>
      <div
        style={{
          height: '100vh',
          background: '#1a1a1a',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Control Panel */}
        <div
          style={{
            padding: '12px',
            background: '#2a2a2a',
            borderBottom: '1px solid #444',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#888', fontSize: '12px', marginRight: '8px' }}>
            Changes: {totalChanges} | Loading: {isLoading ? 'Yes' : 'No'}
          </span>
          <button onClick={addStagedFile} style={buttonStyle('#22c55e')}>
            + Staged
          </button>
          <button onClick={addUnstagedFile} style={buttonStyle('#f59e0b')}>
            + Unstaged
          </button>
          <button onClick={addUntrackedFile} style={buttonStyle('#3b82f6')}>
            + Untracked
          </button>
          <button onClick={addDeletedFile} style={buttonStyle('#ef4444')}>
            + Deleted
          </button>
          <button onClick={addMultipleChanges} style={buttonStyle('#8b5cf6')}>
            Add Multiple
          </button>
          <button onClick={clearAllChanges} style={buttonStyle('#666')}>
            Clear All
          </button>
          <button onClick={simulateLoading} style={buttonStyle('#0ea5e9')}>
            Simulate Load
          </button>
        </div>

        {/* Panel */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <GitChangesPanelContent
            gitStatus={gitStatus}
            fileTree={sampleFileTree}
            rootPath="/Users/developer/my-project"
            isLoading={isLoading}
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
        story:
          'Interactive story to test dynamic git status changes and view switching behavior.',
      },
    },
  },
};

/**
 * Two panels side-by-side - tests the DnD backend conflict fix
 */
const TwoPanelsDemo = () => {
  return (
    <ThemeProvider>
      <div
        style={{
          height: '100vh',
          background: '#1a1a1a',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with info */}
        <div
          style={{
            padding: '16px',
            background: '#e8f5e9',
            borderBottom: '2px solid #4caf50',
            color: '#1b5e20',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>
            ✅ DnD Backend Conflict Test - Multiple Git Changes Panels
          </h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            <strong>Testing:</strong> Two GitChangesPanel instances rendered
            simultaneously
          </p>
          <p style={{ margin: '0', fontSize: '14px' }}>
            <strong>Expected:</strong> No "Cannot have two HTML5 backends at the
            same time" error
          </p>
        </div>

        {/* Two panels side-by-side */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1px',
            background: '#444',
            overflow: 'hidden',
          }}
        >
          {/* Left Panel */}
          <div
            style={{
              background: '#1a1a1a',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '8px',
                background: '#2a2a2a',
                borderBottom: '1px solid #444',
                fontSize: '12px',
                color: '#888',
                fontWeight: 'bold',
              }}
            >
              Panel 1 - Repository A
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <GitChangesPanelContent
                gitStatus={{
                  repoPath: '/Users/developer/repository-a',
                  branch: 'main',
                  isDirty: true,
                  hasUntracked: true,
                  hasStaged: true,
                  ahead: 0,
                  behind: 0,
                  watchingEnabled: false,
                  stagedFiles: [
                    'src/components/Button.tsx',
                    'src/styles/theme.css',
                    'src/utils/helpers.ts',
                  ],
                  modifiedFiles: ['README.md', 'package.json'],
                  untrackedFiles: [
                    'src/new-feature.tsx',
                    'src/components/NewComponent.tsx',
                  ],
                  deletedFiles: ['src/deprecated/old-file.ts'],
                  createdFiles: [],
                  hash: 'panel-1',
                }}
                fileTree={sampleFileTree}
                rootPath="/Users/developer/repository-a"
              />
            </div>
          </div>

          {/* Right Panel */}
          <div
            style={{
              background: '#1a1a1a',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '8px',
                background: '#2a2a2a',
                borderBottom: '1px solid #444',
                fontSize: '12px',
                color: '#888',
                fontWeight: 'bold',
              }}
            >
              Panel 2 - Repository B
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <GitChangesPanelContent
                gitStatus={{
                  repoPath: '/Users/developer/repository-b',
                  branch: 'develop',
                  isDirty: true,
                  hasUntracked: true,
                  hasStaged: true,
                  ahead: 2,
                  behind: 0,
                  watchingEnabled: false,
                  stagedFiles: ['docs/API.md', 'src/index.ts'],
                  modifiedFiles: [
                    'tsconfig.json',
                    'webpack.config.js',
                    'src/App.tsx',
                    'src/config.ts',
                  ],
                  untrackedFiles: ['src/experimental/feature.tsx'],
                  deletedFiles: [],
                  createdFiles: [],
                  hash: 'panel-2',
                }}
                fileTree={sampleFileTree}
                rootPath="/Users/developer/repository-b"
              />
            </div>
          </div>
        </div>

        {/* Footer with test instructions */}
        <div
          style={{
            padding: '12px',
            background: '#2a2a2a',
            borderTop: '1px solid #444',
            fontSize: '12px',
            color: '#888',
          }}
        >
          <strong>Test Actions:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>✅ Both panels should render without errors</li>
            <li>✅ Hover over files in both panels - highlights should work</li>
            <li>✅ Expand/collapse folders in both panels</li>
            <li>✅ Check browser console - should see NO DnD backend errors</li>
          </ul>
        </div>
      </div>
    </ThemeProvider>
  );
};

export const TwoPanelsSideBySide: StoryObj = {
  name: 'Two Panels Side-by-Side (DnD Test)',
  render: () => <TwoPanelsDemo />,
  parameters: {
    docs: {
      description: {
        story: `
**Testing Multiple Git Changes Panels - DnD Backend Conflict Fix**

This story renders **two GitChangesPanel instances simultaneously** to verify the fix for the React DnD backend conflict.

The Git Changes panel now displays the full repository file tree with git status indicators overlaid.

**The Problem (Before @principal-ade/dynamic-file-tree@0.1.36):**
- Each panel's file tree created its own \`DndProvider\` with \`HTML5Backend\`
- React DnD error: "Cannot have two HTML5 backends at the same time"
- Hover and click events didn't work correctly
- Multiple panels couldn't coexist

**The Solution (v0.1.36+):**
- Drag-and-drop is disabled by default in dynamic-file-tree (\`enableDragAndDrop={false}\`)
- Trees pass \`disableDrag\` and \`disableDrop\` to react-arborist
- No DndProvider is created, preventing backend conflicts
- Multiple tree instances work perfectly together

**Expected Results:**
1. ✅ Both panels render without errors
2. ✅ File tree interactions work correctly in both panels
3. ✅ No console errors about DnD backends
4. ✅ Hover states and click events work properly

**Background:**
This issue occurred when opening both the Git Changes panel (from repository-composition-panels)
and File City panel (from file-city-panels) simultaneously in Principal ADE.
        `,
      },
    },
  },
};
