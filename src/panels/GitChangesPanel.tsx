import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@principal-ade/industry-theme';
import { GitStatusFileTree, type GitFileStatus } from '@principal-ade/dynamic-file-tree';
import type { FileTree, GitStatusWithFiles, DirectoryInfo, FileTreeNode } from '@principal-ai/repository-abstraction';
import { Copy, FileSymlink, ExternalLink, FolderOpen } from 'lucide-react';
import type { GitChangeSelectionStatus, PanelComponentProps } from '../types';
import './GitChangesPanel.css';

// Stable default object to prevent new references on each render
const EMPTY_GIT_STATUS: GitStatusWithFiles = {
  repoPath: '',
  branch: '',
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

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodePath: string;
  isFolder: boolean;
}

export type ContextMenuAction =
  | { type: 'copyFullPath'; path: string }
  | { type: 'copyRelativePath'; path: string }
  | { type: 'openFile'; path: string }
  | { type: 'openFolder'; path: string };

export interface GitChangesPanelProps {
  /** Git status data with categorized file paths */
  gitStatus: GitStatusWithFiles;
  /** Complete file tree structure - git status will be overlaid on this tree */
  fileTree: FileTree;
  /** Root path for the repository */
  rootPath?: string;
  /** Whether git status is currently loading */
  isLoading?: boolean;
  /** Callback when a file is clicked */
  onFileClick?: (filePath: string, status?: GitChangeSelectionStatus) => void;
  /** Callback when a context menu action is triggered */
  onContextMenuAction?: (action: ContextMenuAction) => void;
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
  onContextMenuAction,
  emptyMessage = 'No git changes to display',
  loadingMessage = 'Loading git changes...',
  selectedFile,
}) => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    nodePath: '',
    isFolder: false,
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu.visible]);

  // Determine file status based on git status data
  const getFileStatus = useCallback(
    (filePath: string): GitChangeSelectionStatus | undefined => {
      if (gitStatus.stagedFiles.includes(filePath)) {
        return 'staged';
      }
      if (gitStatus.deletedFiles.includes(filePath)) {
        return 'deleted';
      }
      if (gitStatus.untrackedFiles.includes(filePath)) {
        return 'untracked';
      }
      if (gitStatus.modifiedFiles.includes(filePath)) {
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

  // Context menu handlers
  const handleContextMenu = useCallback(
    (event: React.MouseEvent, nodePath: string, isFolder: boolean) => {
      event.preventDefault();
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        nodePath,
        isFolder,
      });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const getFullPath = useCallback(
    (nodePath: string) => {
      if (rootPath && !nodePath.startsWith(rootPath)) {
        return `${rootPath}/${nodePath}`;
      }
      return nodePath;
    },
    [rootPath],
  );

  const handleCopyFullPath = useCallback(() => {
    const fullPath = getFullPath(contextMenu.nodePath);
    navigator.clipboard.writeText(fullPath);
    onContextMenuAction?.({ type: 'copyFullPath', path: fullPath });
    closeContextMenu();
  }, [contextMenu.nodePath, getFullPath, onContextMenuAction, closeContextMenu]);

  const handleCopyRelativePath = useCallback(() => {
    navigator.clipboard.writeText(contextMenu.nodePath);
    onContextMenuAction?.({ type: 'copyRelativePath', path: contextMenu.nodePath });
    closeContextMenu();
  }, [contextMenu.nodePath, onContextMenuAction, closeContextMenu]);

  const handleOpenFile = useCallback(() => {
    const fullPath = getFullPath(contextMenu.nodePath);
    onContextMenuAction?.({ type: 'openFile', path: fullPath });
    closeContextMenu();
  }, [contextMenu.nodePath, getFullPath, onContextMenuAction, closeContextMenu]);

  const handleOpenFolder = useCallback(() => {
    const fullPath = getFullPath(contextMenu.nodePath);
    onContextMenuAction?.({ type: 'openFolder', path: fullPath });
    closeContextMenu();
  }, [contextMenu.nodePath, getFullPath, onContextMenuAction, closeContextMenu]);

  const gitChangesData = useMemo(() => {
    if (isLoading) {
      return null;
    }

    // Helper function to expand directories using the fileTree
    const expandDirectories = (paths: string[]): string[] => {
      if (!fileTree.allFiles) return paths;

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
    const expandedUntracked = expandDirectories(gitStatus.untrackedFiles);

    const statusData: GitFileStatus[] = [
      ...gitStatus.stagedFiles.map((filePath) => ({
        filePath,
        indexStatus: 'A',
        workingTreeStatus: ' ',
        status: 'A' as const,
      })),
      ...gitStatus.modifiedFiles.map((filePath) => ({
        filePath,
        indexStatus: ' ',
        workingTreeStatus: 'M',
        status: 'M' as const,
      })),
      ...gitStatus.deletedFiles.map((filePath) => ({
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

    // Filter statusData based on search term
    const filteredStatusData = searchTerm
      ? statusData.filter((item) =>
          item.filePath.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : statusData;

    // Filter fileTree to only include matching files and their parent directories
    let filteredTree = fileTree;
    if (searchTerm && fileTree.allFiles) {
      const rootPath = fileTree.root.path;

      // Convert relative paths to absolute paths for matching
      const matchingPaths = new Set<string>();

      filteredStatusData.forEach((item) => {
        // Add the absolute path
        const absolutePath = `${rootPath}/${item.filePath}`;
        matchingPaths.add(absolutePath);

        // Also include parent directories
        const parts = item.filePath.split('/');
        for (let i = 1; i < parts.length; i++) {
          const parentPath = `${rootPath}/${parts.slice(0, i).join('/')}`;
          matchingPaths.add(parentPath);
        }
      });

      // Always include the root directory
      matchingPaths.add(rootPath);

      // Filter allFiles and allDirectories
      const filteredAllFiles = fileTree.allFiles.filter((file) => matchingPaths.has(file.path));
      const filteredAllDirectories = fileTree.allDirectories.filter((dir) => matchingPaths.has(dir.path));

      // Recursively filter the directory tree structure
      const filterDirectoryTree = (dir: DirectoryInfo): DirectoryInfo => {
        const filteredChildren: FileTreeNode[] = dir.children
          .filter((child) => matchingPaths.has(child.path))
          .map((child) => {
            if ('children' in child) {
              return filterDirectoryTree(child as DirectoryInfo);
            }
            return child;
          });

        return {
          ...dir,
          children: filteredChildren,
          fileCount: filteredChildren.filter((child) => !('children' in child)).length,
        };
      };

      const filteredRoot = filterDirectoryTree(fileTree.root);

      filteredTree = {
        ...fileTree,
        root: filteredRoot,
        allFiles: filteredAllFiles,
        allDirectories: filteredAllDirectories,
        stats: {
          ...fileTree.stats,
          totalFiles: filteredAllFiles.length,
          totalDirectories: filteredAllDirectories.length,
        },
      };
    }

    return { tree: filteredTree, statusData: filteredStatusData };
  }, [isLoading, fileTree, gitStatus, searchTerm]);

  // Render content based on state
  const renderContent = () => {
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

    if (!gitChangesData) {
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

    return (
      <GitStatusFileTree
        fileTree={gitChangesData.tree}
        theme={theme}
        gitStatusData={gitChangesData.statusData}
        onFileSelect={handleFileSelect}
        onContextMenu={handleContextMenu}
        selectedFile={selectedFile}
        transparentBackground={true}
        horizontalNodePadding="16px"
        verticalPadding="16px"
        openByDefault={!!searchTerm}
        enableDragAndDrop={false}
      />
    );
  };

  // Context menu button style
  const contextMenuButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: theme.fontSizes[1],
    color: theme.colors.text,
    textAlign: 'left',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search bar - 40px total height including border */}
      <div
        style={{
          padding: '6px 16px',
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.background,
          height: '40px',
          boxSizing: 'border-box',
        }}
      >
        <input
          type="text"
          placeholder="Filter files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '4px 10px',
            fontSize: theme.fontSizes[1],
            fontFamily: theme.fonts.body,
            color: theme.colors.text,
            backgroundColor: theme.colors.backgroundSecondary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '4px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = theme.colors.primary;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.colors.border;
          }}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {renderContent()}
      </div>

      {/* Context menu - rendered as portal */}
      {contextMenu.visible &&
        createPortal(
          <div
            ref={contextMenuRef}
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              minWidth: '180px',
              padding: '4px 0',
              fontFamily: theme.fonts.body,
              ['--theme-bg-tertiary' as string]: theme.colors.backgroundTertiary,
            }}
          >
            {/* Open file/folder action */}
            <button
              onClick={contextMenu.isFolder ? handleOpenFolder : handleOpenFile}
              className="context-menu-item"
              style={contextMenuButtonStyle}
            >
              {contextMenu.isFolder ? <FolderOpen size={14} /> : <ExternalLink size={14} />}
              {contextMenu.isFolder ? 'Open Folder' : 'Open File'}
            </button>

            <div
              style={{
                height: '1px',
                backgroundColor: theme.colors.border,
                margin: '4px 0',
              }}
            />

            {/* Copy full path */}
            <button
              onClick={handleCopyFullPath}
              className="context-menu-item"
              style={contextMenuButtonStyle}
            >
              <Copy size={14} />
              Copy Full Path
            </button>

            {/* Copy relative path */}
            <button
              onClick={handleCopyRelativePath}
              className="context-menu-item"
              style={contextMenuButtonStyle}
            >
              <FileSymlink size={14} />
              Copy Relative Path
            </button>
          </div>,
          document.body
        )}
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
export const GitChangesPanel: React.FC<PanelComponentProps> = ({ context, events }) => {

  // Get data slices from context
  const gitSlice = context.getSlice<GitStatusWithFiles>('gitStatusWithFiles');
  const fileTreeSlice = context.getSlice<FileTree>('fileTree');

  // Extract data with stable defaults to prevent unnecessary re-renders
  const gitStatus = gitSlice?.data ?? EMPTY_GIT_STATUS;
  const fileTree = fileTreeSlice?.data;
  const isLoading = gitSlice?.loading || fileTreeSlice?.loading || false;

  // Get repository path from context scope
  const rootPath = context.currentScope.type === 'repository'
    ? context.currentScope.repository?.path
    : undefined;

  // Handle file click - emit file:open event
  const handleFileClick = useCallback(
    (filePath: string, status?: GitChangeSelectionStatus) => {
      events?.emit({
        type: 'file:open',
        source: 'git-changes-panel',
        timestamp: Date.now(),
        payload: { path: filePath, gitStatus: status },
      });
    },
    [events]
  );

  // Handle context menu actions - emit appropriate events
  const handleContextMenuAction = useCallback(
    (action: ContextMenuAction) => {
      events?.emit({
        type: `contextMenu:${action.type}`,
        source: 'git-changes-panel',
        timestamp: Date.now(),
        payload: { path: action.path },
      });
    },
    [events]
  );

  // Don't render if fileTree is not available
  if (!fileTree) {
    return null;
  }

  return (
    <GitChangesPanelContent
      gitStatus={gitStatus}
      fileTree={fileTree}
      rootPath={rootPath}
      isLoading={isLoading}
      onFileClick={handleFileClick}
      onContextMenuAction={handleContextMenuAction}
    />
  );
};
