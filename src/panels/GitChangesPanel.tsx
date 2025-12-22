import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@principal-ade/industry-theme';
import { GitStatusFileTree, type GitFileStatus } from '@principal-ade/dynamic-file-tree';
import { PathsFileTreeBuilder, type FileTree } from '@principal-ai/repository-abstraction';
import { Copy, FileSymlink, ExternalLink, FolderOpen } from 'lucide-react';
import type { GitStatus, GitChangeSelectionStatus, PanelComponentProps } from '../types';
import './GitChangesPanel.css';

// Stable default object to prevent new references on each render
const EMPTY_GIT_STATUS: GitStatus = {
  staged: [],
  unstaged: [],
  untracked: [],
  deleted: [],
};

// Memoized toggle buttons component to prevent re-renders
interface ToggleButtonsProps {
  showFullTree: boolean;
  onShowFullTree: () => void;
  onShowChanges: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}

const ToggleButtons = React.memo<ToggleButtonsProps>(({ showFullTree, onShowFullTree, onShowChanges, theme }) => (
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
      onClick={onShowFullTree}
      style={{
        flex: 1,
        padding: '6px 12px',
        fontSize: theme.fontSizes[1],
        backgroundColor: showFullTree
          ? theme.colors.backgroundSecondary
          : 'transparent',
        color: showFullTree ? theme.colors.text : theme.colors.textSecondary,
        border: 'none',
        cursor: 'pointer',
        fontWeight: showFullTree ? 600 : 400,
        transition: 'all 0.2s',
      }}
    >
      Full Tree
    </button>
    <button
      onClick={onShowChanges}
      style={{
        flex: 1,
        padding: '6px 12px',
        fontSize: theme.fontSizes[1],
        backgroundColor: !showFullTree
          ? theme.colors.backgroundSecondary
          : 'transparent',
        color: !showFullTree ? theme.colors.text : theme.colors.textSecondary,
        border: 'none',
        cursor: 'pointer',
        fontWeight: !showFullTree ? 600 : 400,
        transition: 'all 0.2s',
      }}
    >
      Changes
    </button>
  </div>
));

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
  gitStatus: GitStatus;
  /** Optional file tree for "Full Tree" view mode */
  fileTree?: FileTree | null;
  /** Root path for the repository (used for building file trees) */
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

  // Calculate if there are changes - memoized to prevent downstream effect re-runs
  const hasChanges = useMemo(
    () =>
      gitStatus.staged.length > 0 ||
      gitStatus.unstaged.length > 0 ||
      gitStatus.untracked.length > 0 ||
      gitStatus.deleted.length > 0,
    [gitStatus.staged.length, gitStatus.unstaged.length, gitStatus.untracked.length, gitStatus.deleted.length]
  );

  // State for toggling between full tree and changes only
  const [showFullTree, setShowFullTree] = useState(false);
  const userHasToggledView = useRef(false);

  // Auto-switch view based on whether there are changes
  // Once user manually toggles, respect their choice
  useEffect(() => {
    if (!isLoading && !userHasToggledView.current) {
      setShowFullTree(!hasChanges);
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

  // Memoized toggle handlers to prevent re-renders
  const handleShowFullTree = useCallback(() => {
    userHasToggledView.current = true;
    setShowFullTree(true);
  }, []);

  const handleShowChanges = useCallback(() => {
    userHasToggledView.current = true;
    setShowFullTree(false);
  }, []);

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
        key={showFullTree ? 'full-tree' : 'changes-only'}
        fileTree={gitChangesData.tree}
        theme={theme}
        gitStatusData={gitChangesData.statusData}
        onFileSelect={handleFileSelect}
        onContextMenu={handleContextMenu}
        selectedFile={selectedFile}
        transparentBackground={true}
        horizontalNodePadding="16px"
        openByDefault={!showFullTree}
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
      <div style={{ height: 40, borderBottom: `1px solid ${theme.colors.border}` }}>
        <ToggleButtons
          showFullTree={showFullTree}
          onShowFullTree={handleShowFullTree}
          onShowChanges={handleShowChanges}
          theme={theme}
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
  const gitSlice = context.getSlice<GitStatus>('git');
  const fileTreeSlice = context.getSlice<FileTree>('fileTree');

  // Extract data with stable defaults to prevent unnecessary re-renders
  const gitStatus = gitSlice?.data ?? EMPTY_GIT_STATUS;
  const fileTree = fileTreeSlice?.data ?? null;
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
