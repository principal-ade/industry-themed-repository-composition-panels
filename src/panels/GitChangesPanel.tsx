import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { GitStatusFileTree, type GitFileStatus } from '@principal-ade/dynamic-file-tree';
import { PathsFileTreeBuilder, type FileTree } from '@principal-ai/repository-abstraction';
import type { GitStatus, GitChangeSelectionStatus, PanelComponentProps } from '../types';

export interface GitChangesPanelProps {
  /** Git status data with categorized file paths */
  gitStatus: GitStatus;
  /** Optional file tree for "Full Tree" view mode */
  fileTree?: FileTree | null;
  /** Root path for the repository (used for building file trees) */
  rootPath?: string;
  /** Whether git status is currently loading */
  isLoading?: boolean;
  /** Callback when a file is clicked */
  onFileClick?: (filePath: string, status?: GitChangeSelectionStatus) => void;
  /** Message to display when there are no changes */
  emptyMessage?: string;
  /** Message to display while loading */
  loadingMessage?: string;
  /** Currently selected file path */
  selectedFile?: string;
}

/**
 * GitChangesPanelContent - Internal component that renders the git changes UI
 * Can be used directly with props or via the framework wrapper
 */
export const GitChangesPanelContent: React.FC<GitChangesPanelProps> = ({
  gitStatus,
  fileTree,
  rootPath,
  isLoading = false,
  onFileClick,
  emptyMessage = 'No git changes to display',
  loadingMessage = 'Loading git changes...',
  selectedFile,
}) => {
  const { theme } = useTheme();

  // Calculate if there are changes
  const hasChanges =
    gitStatus.staged.length > 0 ||
    gitStatus.unstaged.length > 0 ||
    gitStatus.untracked.length > 0 ||
    gitStatus.deleted.length > 0;

  // State for toggling between full tree and changes only
  const [showFullTree, setShowFullTree] = useState(false);
  const userHasToggledView = useRef(false);

  // Update default view mode based on whether there are changes
  useEffect(() => {
    if (!isLoading && !userHasToggledView.current) {
      const rafId = requestAnimationFrame(() => {
        setShowFullTree(!hasChanges);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [hasChanges, isLoading]);

  // Determine file status based on git status data
  const getFileStatus = useCallback(
    (filePath: string): GitChangeSelectionStatus | undefined => {
      if (gitStatus.staged.includes(filePath)) {
        return 'staged';
      }
      if (gitStatus.deleted.includes(filePath)) {
        return 'deleted';
      }
      if (gitStatus.untracked.includes(filePath)) {
        return 'untracked';
      }
      if (gitStatus.unstaged.includes(filePath)) {
        return 'unstaged';
      }
      return undefined;
    },
    [gitStatus],
  );

  const handleFileSelect = useCallback(
    (filePath: string) => {
      const status = getFileStatus(filePath);
      onFileClick?.(filePath, status);
    },
    [getFileStatus, onFileClick],
  );

  const gitChangesData = useMemo(() => {
    if (isLoading) {
      return null;
    }

    // Helper function to expand directories using the fileTree
    const expandDirectories = (paths: string[]): string[] => {
      if (!fileTree?.allFiles) return paths;

      const expandedPaths: string[] = [];

      for (const path of paths) {
        const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
        const matchingFiles = fileTree.allFiles.filter(
          (file) =>
            file.path.startsWith(normalizedPath + '/') ||
            file.path === normalizedPath,
        );

        if (matchingFiles.length > 0) {
          expandedPaths.push(...matchingFiles.map((f) => f.path));
        } else {
          expandedPaths.push(normalizedPath);
        }
      }

      return expandedPaths;
    };

    // Expand untracked directories to show all files
    const expandedUntracked = expandDirectories(gitStatus.untracked);

    const statusData: GitFileStatus[] = [
      ...gitStatus.staged.map((filePath) => ({
        filePath,
        indexStatus: 'A',
        workingTreeStatus: ' ',
        status: 'A' as const,
      })),
      ...gitStatus.unstaged.map((filePath) => ({
        filePath,
        indexStatus: ' ',
        workingTreeStatus: 'M',
        status: 'M' as const,
      })),
      ...gitStatus.deleted.map((filePath) => ({
        filePath,
        indexStatus: ' ',
        workingTreeStatus: 'D',
        status: 'D' as const,
      })),
      ...expandedUntracked.map((filePath) => ({
        filePath,
        indexStatus: '?',
        workingTreeStatus: '?',
        status: '??' as const,
      })),
    ];

    // If showing full tree, use the complete fileTree
    if (showFullTree && fileTree) {
      return { tree: fileTree, statusData };
    }

    // Changes only mode - show only changed files
    if (!hasChanges) {
      return null;
    }

    const allChangedFiles = [
      ...gitStatus.staged,
      ...gitStatus.unstaged,
      ...expandedUntracked,
      ...gitStatus.deleted,
    ].sort((a, b) => a.localeCompare(b));

    const builder = new PathsFileTreeBuilder();
    const tree = builder.build({ files: allChangedFiles, rootPath: rootPath ?? '' });

    return { tree, statusData };
  }, [isLoading, hasChanges, fileTree, gitStatus, rootPath, showFullTree]);

  // Toggle button component
  const ToggleButtons = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: theme.colors.backgroundTertiary,
        width: '100%',
        height: '100%',
      }}
    >
      <button
        onClick={() => {
          userHasToggledView.current = true;
          setShowFullTree(true);
        }}
        style={{
          flex: 1,
          padding: '6px 12px',
          fontSize: theme.fontSizes[1],
          backgroundColor: showFullTree
            ? theme.colors.backgroundSecondary
            : 'transparent',
          color: showFullTree ? theme.colors.text : theme.colors.textSecondary,
          border: showFullTree
            ? `1px solid ${theme.colors.border}`
            : '1px solid transparent',
          cursor: 'pointer',
          fontWeight: showFullTree ? 600 : 400,
          transition: 'all 0.2s',
        }}
      >
        Full Tree
      </button>
      <button
        onClick={() => {
          userHasToggledView.current = true;
          setShowFullTree(false);
        }}
        style={{
          flex: 1,
          padding: '6px 12px',
          fontSize: theme.fontSizes[1],
          backgroundColor: !showFullTree
            ? theme.colors.backgroundSecondary
            : 'transparent',
          color: !showFullTree ? theme.colors.text : theme.colors.textSecondary,
          border: !showFullTree
            ? `1px solid ${theme.colors.border}`
            : '1px solid transparent',
          cursor: 'pointer',
          fontWeight: !showFullTree ? 600 : 400,
          transition: 'all 0.2s',
        }}
      >
        Changes Only
      </button>
    </div>
  );

  // Content area
  const Content = () => {
    if (isLoading) {
      return (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: theme.colors.textSecondary,
          }}
        >
          {loadingMessage}
        </div>
      );
    }

    if (!hasChanges && !showFullTree) {
      return (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: theme.colors.textSecondary,
          }}
        >
          {emptyMessage}
        </div>
      );
    }

    if (!gitChangesData) {
      return null;
    }

    return (
      <GitStatusFileTree
        key={showFullTree ? 'full' : 'changes'}
        fileTree={gitChangesData.tree}
        theme={theme}
        gitStatusData={gitChangesData.statusData}
        onFileSelect={handleFileSelect}
        selectedFile={selectedFile}
        transparentBackground={true}
        horizontalNodePadding="16px"
        openByDefault={!showFullTree}
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: 40, borderBottom: `1px solid ${theme.colors.border}` }}>
        <ToggleButtons />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Content />
      </div>
    </div>
  );
};

export const GitChangesPanelPreview: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        padding: '12px',
        fontSize: '12px',
        color: theme.colors.text,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#22c55e',
        }}
      >
        <span>+</span>
        <span>new-file.ts</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#f59e0b',
        }}
      >
        <span>M</span>
        <span>modified.ts</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#ef4444',
        }}
      >
        <span>-</span>
        <span>deleted.ts</span>
      </div>
    </div>
  );
};

/**
 * GitChangesPanel - Panel Framework compatible component
 * Uses context.getSlice('git') and context.getSlice('fileTree') to get data
 */
export const GitChangesPanel: React.FC<PanelComponentProps> = ({ context }) => {
  // Get data slices from context
  const gitSlice = context.getSlice<GitStatus>('git');
  const fileTreeSlice = context.getSlice<FileTree>('fileTree');

  // Extract data with defaults
  const gitStatus = gitSlice?.data ?? {
    staged: [],
    unstaged: [],
    untracked: [],
    deleted: [],
  };
  const fileTree = fileTreeSlice?.data ?? null;
  const isLoading = gitSlice?.loading || fileTreeSlice?.loading || false;

  // Get repository path from context scope
  const rootPath = context.currentScope.type === 'repository'
    ? context.currentScope.repository?.path
    : undefined;

  return (
    <GitChangesPanelContent
      gitStatus={gitStatus}
      fileTree={fileTree}
      rootPath={rootPath}
      isLoading={isLoading}
    />
  );
};
