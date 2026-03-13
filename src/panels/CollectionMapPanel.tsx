/**
 * CollectionMapPanel - Visualize Alexandria Collections as overworld maps
 */

import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  useDropZone,
  type PanelDragData,
} from '@principal-ade/panel-framework-core';
import { Viewport } from 'pixi-viewport';
import { trace, type Span } from '@opentelemetry/api';
import type {
  PanelComponentProps,
  PanelActions,
  RepositoryMetadata,
  DataSlice,
} from '../types';
import { OverworldMapPanelContent } from './overworld-map/OverworldMapPanel';
import type { RegionLayout, GenericNode } from './overworld-map/genericMapper';
import { nodesToUnifiedOverworldMap } from './overworld-map/genericMapper';
import { REGION_SIZE_TILES } from './overworld-map/types';
import { domEventToGridCoords } from './overworld-map/isometricUtils';
import { extractPackageInfo } from './overworld-map/packageExpansion';
import { getDecorationSizeBonus } from './overworld-map/starDecoration';
import { getCollaboratorDecorationSizeBonus } from './overworld-map/collaboratorDecoration';
import type { AlexandriaEntry } from '@principal-ai/alexandria-core-library/types';
import { calculateRepositorySize } from '../utils/repositoryScaling';
import { calculateAgingMetrics } from '../utils/repositoryAging';
import type { PackageLayer, FrameworkLayer } from '../types/composition';
import type {
  CustomRegion,
  RepositoryLayoutData,
  Collection,
  CollectionMembership,
} from '@principal-ai/alexandria-collections';

// Helper to get tracer lazily (after provider is registered)
const getTracer = () => trace.getTracer('collection-map-panel', '0.6.9');

/**
 * Compute a simple hash to detect repository array reference/content changes
 * Uses length + sum of metrics to detect if file tree data changed
 */
function computeRepositoriesHash(
  repositories: AlexandriaEntryWithMetrics[]
): string {
  const totalFiles = repositories.reduce(
    (sum, r) => sum + (r.metrics?.fileCount || 0),
    0
  );
  const totalLines = repositories.reduce(
    (sum, r) => sum + (r.metrics?.lineCount || 0),
    0
  );
  return `${repositories.length}:${totalFiles}:${totalLines}`;
}

/**
 * Get the latest lastEditedAt timestamp from repositories
 */
function getLatestEditTimestamp(
  repositories: AlexandriaEntryWithMetrics[]
): string | undefined {
  let latest: string | undefined;
  for (const repo of repositories) {
    const edited = repo.metrics?.lastEditedAt;
    if (edited && (!latest || edited > latest)) {
      latest = edited;
    }
  }
  return latest;
}

/**
 * Extended Alexandria Entry with metrics for visualization sizing
 * (Local extension until metrics are added to upstream)
 */
export interface AlexandriaEntryWithMetrics extends AlexandriaEntry {
  /** Repository metrics for visualization sizing */
  metrics?: {
    fileCount?: number;
    lineCount?: number;
    commitCount?: number;
    contributors?: number;
    lastEditedAt?: string; // ISO timestamp of last edit (for aging/weathering)
    createdAt?: string; // ISO timestamp of creation (for future architectural style)
  };

  /** Optional array of packages for monorepos */
  packages?: PackageLayer[];

  /** Detected frameworks (React, Storybook, Jest, etc.) */
  frameworks?: FrameworkLayer[];

  /** Extended github fields (supplement to AlexandriaEntry.github) */
  github?: AlexandriaEntry['github'] & {
    ownerAvatar?: string; // URL to owner's avatar image
  };
}

/**
 * Callbacks for region management
 */
export interface RegionCallbacks {
  /** Create a new custom region */
  onRegionCreated: (
    collectionId: string,
    region: Omit<CustomRegion, 'id'>
  ) => Promise<CustomRegion>;

  /** Update an existing region */
  onRegionUpdated: (
    collectionId: string,
    regionId: string,
    updates: Partial<CustomRegion>
  ) => Promise<void>;

  /** Delete a region */
  onRegionDeleted: (collectionId: string, regionId: string) => Promise<void>;

  /** Assign a repository to a region (used when manually adding repos) */
  onRepositoryAssigned: (
    collectionId: string,
    repositoryId: string,
    regionId: string
  ) => Promise<void>;

  /** Update a repository's manual position (used when dragging sprites) */
  onRepositoryPositionUpdated: (
    collectionId: string,
    repositoryId: string,
    layout: RepositoryLayoutData
  ) => Promise<void>;

  /**
   * Batch initialize layout (regions + assignments + positions)
   * Called once when collection loads to compute initial layout
   * Reduces re-renders from N to 1
   */
  onBatchLayoutInitialized: (
    collectionId: string,
    updates: {
      regions?: CustomRegion[];
      assignments?: Array<{ repositoryId: string; regionId: string }>;
      positions?: Array<{ repositoryId: string; layout: RepositoryLayoutData }>;
    }
  ) => Promise<void>;
}

/**
 * Actions interface required by CollectionMapPanel
 * Extends PanelActions with region management callbacks and repository addition
 */
export interface CollectionMapPanelActions
  extends PanelActions, RegionCallbacks {
  /** Add a repository to a collection (for drag-drop integration) */
  addRepositoryToCollection: (
    collectionId: string,
    repositoryPath: string,
    repositoryMetadata: RepositoryMetadata
  ) => Promise<void>;

  /** Callback when a repository is clicked (without being moved), or null when clicking empty space to deselect */
  onRepositoryClicked?: (repositoryId: string | null) => void;

  /** Currently selected repository ID */
  selectedRepositoryId?: string | null;
}

/**
 * Context interface for CollectionMapPanel data slices
 * The panel expects the host to provide data for the SELECTED collection only
 */
export interface CollectionMapPanelContext {
  selectedCollectionView: DataSlice<{
    /** The selected collection to display (null when no collection is selected) */
    collection: Collection | null;
    /** Repositories ONLY for the selected collection (already filtered by host) */
    repositories: AlexandriaEntryWithMetrics[];
    /** Optional dependency graph for connections between repos */
    dependencies?: Record<string, string[]>;
  }>;
}

/**
 * Type alias for the selectedCollectionView property
 * Exported for convenience so hosts don't need to use indexed access types
 */
export type SelectedCollectionView =
  CollectionMapPanelContext['selectedCollectionView'];

export interface CollectionMapPanelProps {
  /** The collection to visualize as an overworld map */
  collection: Collection;

  /** Full repository data */
  repositories: AlexandriaEntryWithMetrics[];

  /** Optional dependency graph for connections between repos */
  dependencies?: Record<string, string[]>;

  /** Region layout configuration (columns, rows, fill direction) */
  regionLayout?: RegionLayout;

  /** Panel width */
  width?: number;

  /** Panel height */
  height?: number;

  /** Loading state */
  isLoading?: boolean;

  /** Callbacks for region management operations (REQUIRED) */
  regionCallbacks: RegionCallbacks;

  /** Add a repository to the collection (for drag-drop) */
  addRepositoryToCollection: (
    collectionId: string,
    repositoryPath: string,
    repositoryMetadata: RepositoryMetadata
  ) => Promise<void>;

  /** Callback when a repository is clicked (without being moved), or null when clicking empty space to deselect */
  onRepositoryClicked?: (repositoryId: string | null) => void;

  /** Currently selected repository ID */
  selectedRepositoryId?: string | null;

  /** Callback when hovering over a package within a monorepo */
  onPackageHover?: (repositoryId: string, packageName: string) => void;

  /** Callback when hover ends on a package within a monorepo */
  onPackageHoverEnd?: (repositoryId: string, packageName: string) => void;

  /** Callback when clicking on a package within a monorepo */
  onPackageClick?: (repositoryId: string, packageName: string) => void;
}

/**
 * CollectionMapPanelContent Component
 * Converts Alexandria Collections to overworld map visualization
 */
export const CollectionMapPanelContent: React.FC<CollectionMapPanelProps> = ({
  collection,
  repositories,
  dependencies = {},
  regionLayout,
  isLoading = false,
  regionCallbacks,
  addRepositoryToCollection,
  onRepositoryClicked,
  selectedRepositoryId,
  onPackageHover,
  onPackageHoverEnd,
  onPackageClick,
}) => {
  // Get custom regions directly from collection metadata
  // Wrap in useMemo to maintain stable reference when undefined
  const customRegions = React.useMemo(
    () => collection.metadata?.customRegions || [],
    [collection.metadata?.customRegions]
  );

  // Region editing state
  const [isEditingRegions, setIsEditingRegions] = React.useState(false);

  // Viewport reference for coordinate conversion
  const viewportRef = React.useRef<Viewport | null>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  // Refs for tracking dependency changes (for telemetry trigger detection)
  const prevCollectionIdForMetrics = useRef<string | null>(null);
  const prevMembersLength = useRef<number>(0);
  const prevRepositoriesHash = useRef<string>('');
  const prevDependenciesKeys = useRef<string>('');
  const prevTotalFiles = useRef<number>(0);

  // Emit metrics-received telemetry when repositories change
  // Also emit marker events for two-phase loading detection
  useEffect(() => {
    const currentHash = computeRepositoriesHash(repositories);
    const totalFiles = repositories.reduce(
      (sum, r) => sum + (r.metrics?.fileCount || 0),
      0
    );
    const totalLines = repositories.reduce(
      (sum, r) => sum + (r.metrics?.lineCount || 0),
      0
    );
    const latestEdited = getLatestEditTimestamp(repositories);

    const span = getTracer().startSpan('collection-map.metrics-received');
    span.addEvent('collection-map.metrics-received', {
      'collection.id': collection.id,
      'repositories.count': repositories.length,
      'repositories.ref.hash': currentHash,
      'metrics.total.files': totalFiles,
      'metrics.total.lines': totalLines,
      ...(latestEdited && { 'metrics.latest.edited': latestEdited }),
    });

    // Emit marker events for two-phase loading scenarios
    const isFirstLoadForCollection =
      prevCollectionIdForMetrics.current !== collection.id;

    if (
      isFirstLoadForCollection &&
      totalFiles === 0 &&
      repositories.length > 0
    ) {
      // Phase 1: Initial load without file metrics
      span.addEvent('collection-map.initial-load-no-metrics', {
        'collection.id': collection.id,
        'repositories.count': repositories.length,
      });
    } else if (
      !isFirstLoadForCollection &&
      prevTotalFiles.current === 0 &&
      totalFiles > 0
    ) {
      // Phase 2: File metrics arrived (transition from 0 to >0)
      span.addEvent('collection-map.file-metrics-arrived', {
        'collection.id': collection.id,
        'metrics.total.files': totalFiles,
        'metrics.total.lines': totalLines,
        'prev.total.files': prevTotalFiles.current,
      });
    }

    // Update ref for next comparison
    prevTotalFiles.current = totalFiles;

    span.setStatus({ code: 1 });
    span.end();
  }, [collection.id, repositories]);

  // Note: We no longer force creation of a default region
  // Instead, we let the layout algorithm create age-based regions on first load
  // and save them (handled in the effect after projects is defined)

  // Handle renaming a region (workflow: region-renamed)
  const handleRenameRegion = useCallback(
    async (regionId: string, name: string) => {
      const span = getTracer().startSpan('collection-map.region-renamed');

      try {
        // Look up old name from customRegions
        const oldRegion = customRegions.find((r) => r.id === regionId);
        const oldName = oldRegion?.name || 'Unknown';

        span.addEvent('collection-map.region-renamed', {
          'collection.id': collection.id,
          'region.id': regionId,
          'region.old.name': oldName,
          'region.new.name': name,
        });

        await regionCallbacks.onRegionUpdated(collection.id, regionId, {
          name,
        });

        span.setStatus({ code: 1 });
        span.end();
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2, message: (error as Error).message });
        span.end();
        throw error;
      }
    },
    [regionCallbacks, collection.id, customRegions]
  );

  // Handle deleting a region (workflow: region-deleted)
  const handleDeleteRegion = useCallback(
    async (regionId: string) => {
      // Prevent deleting the last region - always keep at least one
      if (customRegions.length <= 1) {
        console.warn(
          'Cannot delete the last region - at least one region must exist'
        );
        alert('Cannot delete the last region. At least one region must exist.');
        return;
      }

      const span = getTracer().startSpan('collection-map.region-deleted');

      try {
        // Look up region name and count orphaned nodes
        const region = customRegions.find((r) => r.id === regionId);
        const regionName = region?.name || 'Unknown';
        const orphanedCount = collection.members.filter(
          (m) => m.metadata?.regionId === regionId
        ).length;

        span.addEvent('collection-map.region-deleted', {
          'collection.id': collection.id,
          'region.id': regionId,
          'region.name': regionName,
          'nodes.orphaned': orphanedCount,
        });

        await regionCallbacks.onRegionDeleted(collection.id, regionId);

        span.setStatus({ code: 1 });
        span.end();
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2, message: (error as Error).message });
        span.end();
        throw error;
      }
    },
    [regionCallbacks, collection.id, customRegions, collection.members]
  );

  // Handle project moved (save position to metadata)
  // Accepts optional parentSpan for workflow telemetry (from drop handlers)
  const handleProjectMoved = useCallback(
    async (
      projectId: string,
      gridX: number,
      gridY: number,
      metadata?: RepositoryMetadata,
      parentSpan?: Span
    ) => {
      // If no parent span, this is a sprite-drag workflow - create our own span
      const span =
        parentSpan ?? getTracer().startSpan('collection-map.project-moved');
      const ownsSpan = !parentSpan;

      // Check if this is a repo being added for the first time (from drag-drop)
      const isNewRepo = !!metadata;
      const existingMembership = collection.members.find(
        (m) => m.repositoryId === projectId
      );

      // VALIDATION: For existing repos, must have a membership
      if (!isNewRepo && !existingMembership) {
        const error = new Error(
          `[handleProjectMoved] FATAL ERROR: Attempting to move repo "${projectId}" that doesn't exist in collection!\n` +
            `Memberships (${collection.members.length}): [${collection.members.map((m) => m.repositoryId).join(', ')}]\n` +
            `This indicates a sprite was rendered without valid backing data.`
        );
        console.error(error);
        if (ownsSpan) {
          span.recordException(error);
          span.setStatus({ code: 2, message: error.message });
          span.end();
        }
        throw error;
      }

      const isFirstPlacement =
        isNewRepo ||
        (!!existingMembership && !existingMembership.metadata?.regionId);

      // Determine which region this position is in based on absolute coordinates
      // Regions are laid out in a grid: region 0 at (0,0), region 1 at (20,0), etc.
      const regionCol = Math.floor(gridX / REGION_SIZE_TILES);
      const regionRow = Math.floor(gridY / REGION_SIZE_TILES);
      const regionOrder = regionRow * 10 + regionCol;

      // Find the region at this position, or create one if it doesn't exist
      const targetRegion = customRegions.find((r) => r.order === regionOrder);
      let newRegionId = targetRegion?.id;

      // If no region exists at this position, auto-create one
      if (!newRegionId) {
        console.log(
          '[CollectionMapPanel] Creating default region for drop position:',
          { gridX, gridY, regionOrder }
        );

        // Create a new region at this position
        const newRegion = await regionCallbacks.onRegionCreated(collection.id, {
          name:
            customRegions.length === 0
              ? 'Main'
              : `Region ${customRegions.length + 1}`,
          order: regionOrder,
          createdAt: 0,
        });

        newRegionId = newRegion.id;
      }

      // Add project-moved event
      span.addEvent('collection-map.project-moved', {
        'collection.id': collection.id,
        'repository.id': projectId,
        'is.new.repo': isNewRepo,
        'is.first.placement': isFirstPlacement,
        'region.id': newRegionId,
        'grid.x': gridX,
        'grid.y': gridY,
      });

      // If this is a first placement (new repo from drag-drop OR existing membership without regionId)
      if (isFirstPlacement) {
        try {
          // Calculate region bounds
          const regionBoundsX = regionCol * REGION_SIZE_TILES;
          const regionBoundsY = regionRow * REGION_SIZE_TILES;

          // Convert from absolute map coordinates to region-relative coordinates
          const relativeGridX = gridX - regionBoundsX;
          const relativeGridY = gridY - regionBoundsY;

          const layout: RepositoryLayoutData = {
            gridX: relativeGridX,
            gridY: relativeGridY,
          };

          // If it's a new repo (not yet in collection), add it with all metadata in one call
          if (isNewRepo) {
            await addRepositoryToCollection(collection.id, projectId, {
              ...metadata,
              layout,
              regionId: newRegionId,
            });
          } else {
            // Existing repo being placed for first time - update position and region
            await regionCallbacks.onRepositoryPositionUpdated(
              collection.id,
              projectId,
              layout
            );

            await regionCallbacks.onRepositoryAssigned(
              collection.id,
              projectId,
              newRegionId
            );
          }

          // Add position-saved event
          span.addEvent('collection-map.position-saved', {
            'collection.id': collection.id,
            'repository.id': projectId,
            'region.id': newRegionId,
            'region.changed': true,
            'grid.x': relativeGridX,
            'grid.y': relativeGridY,
          });

          if (ownsSpan) {
            span.setStatus({ code: 1 });
            span.end();
          }
        } catch (error) {
          console.error('[PLACEMENT] ✗ ERROR during placement:', error);
          if (ownsSpan) {
            span.recordException(error as Error);
            span.setStatus({ code: 2, message: (error as Error).message });
            span.end();
          }
          throw error;
        }
        return;
      }

      // For existing members, save position and update region if needed
      // Calculate region bounds
      const regionBoundsX = regionCol * REGION_SIZE_TILES;
      const regionBoundsY = regionRow * REGION_SIZE_TILES;

      // Convert from absolute map coordinates to region-relative coordinates
      const relativeGridX = gridX - regionBoundsX;
      const relativeGridY = gridY - regionBoundsY;

      const layout: RepositoryLayoutData = {
        gridX: relativeGridX,
        gridY: relativeGridY,
      };

      // Save both position and region assignment
      await regionCallbacks.onRepositoryPositionUpdated(
        collection.id,
        projectId,
        layout
      );

      // Check if region changed and update assignment if needed
      const membership = collection.members.find(
        (m) => m.repositoryId === projectId
      );
      const oldRegionId = membership?.metadata?.regionId;
      const regionChanged = oldRegionId !== newRegionId;

      if (regionChanged) {
        await regionCallbacks.onRepositoryAssigned(
          collection.id,
          projectId,
          newRegionId
        );
      }

      // Add position-saved event
      span.addEvent('collection-map.position-saved', {
        'collection.id': collection.id,
        'repository.id': projectId,
        'region.id': newRegionId,
        'region.changed': regionChanged,
        'grid.x': relativeGridX,
        'grid.y': relativeGridY,
      });

      if (ownsSpan) {
        span.setStatus({ code: 1 });
        span.end();
      }
    },
    [
      collection.id,
      collection.members,
      regionCallbacks,
      customRegions,
      addRepositoryToCollection,
    ]
  );

  // Handle dropped projects (workflow: external-drop)
  const handleProjectDrop = useCallback(
    async (data: PanelDragData, event: React.DragEvent) => {
      // Create span for external-drop workflow
      const span = getTracer().startSpan('collection-map.project-drop');

      try {
        // Extract repository info from dropped data
        const repositoryPath = data.primaryData as string;
        // Type assertion: drag data metadata is expected to contain RepositoryMetadata from the drag source
        const repositoryMetadata = (data.metadata || {}) as RepositoryMetadata;
        const repoId = repositoryMetadata?.name || repositoryPath;

        // Convert drop position to grid coordinates
        const gridCoords = domEventToGridCoords(
          event.clientX,
          event.clientY,
          viewportRef.current,
          canvasRef.current
        );

        // Snap to nearest tile
        const gridX = Math.round(gridCoords.gridX);
        const gridY = Math.round(gridCoords.gridY);

        // Add project-drop event
        span.addEvent('collection-map.project-drop', {
          'collection.id': collection.id,
          'source.type': 'repository-project',
          'repository.id': repoId,
          'grid.x': gridX,
          'grid.y': gridY,
        });

        // Place immediately at drop position, passing metadata and span
        await handleProjectMoved(
          repoId,
          gridX,
          gridY,
          repositoryMetadata,
          span
        );

        span.setStatus({ code: 1 });
        span.end();
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2, message: (error as Error).message });
        span.end();
        throw error;
      }
    },
    [handleProjectMoved, collection.id]
  );

  // Handle drags from the unplaced drawer (workflow: drawer-drop)
  const handleDrawerDrop = useCallback(
    async (event: React.DragEvent) => {
      const unplacedNodeData = event.dataTransfer.getData(
        'application/x-unplaced-node'
      );
      if (!unplacedNodeData) return; // Not a drawer drag

      event.preventDefault();
      event.stopPropagation();

      // Create span for drawer-drop workflow
      const span = getTracer().startSpan('collection-map.drawer-drop');

      try {
        const { nodeId } = JSON.parse(unplacedNodeData);

        // Convert drop position to grid coordinates
        const gridCoords = domEventToGridCoords(
          event.clientX,
          event.clientY,
          viewportRef.current,
          canvasRef.current
        );

        const gridX = Math.round(gridCoords.gridX);
        const gridY = Math.round(gridCoords.gridY);

        // Add drawer-drop event
        span.addEvent('collection-map.drawer-drop', {
          'collection.id': collection.id,
          'repository.id': nodeId,
          'grid.x': gridX,
          'grid.y': gridY,
        });

        // Place the node (no metadata needed - it's already in the collection)
        await handleProjectMoved(nodeId, gridX, gridY, undefined, span);

        span.setStatus({ code: 1 });
        span.end();
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2, message: (error as Error).message });
        span.end();
        throw error;
      }
    },
    [handleProjectMoved, collection.id]
  );

  // Handle dropped GitHub repositories (from starred/projects panels)
  // Uses the same external-drop workflow as handleProjectDrop
  const handleGitHubDrop = useCallback(
    async (data: PanelDragData, event: React.DragEvent) => {
      // Create span for external-drop workflow
      const span = getTracer().startSpan('collection-map.project-drop');

      try {
        // Extract repository info from dropped data
        // primaryData is the full_name (e.g., "owner/repo")
        const fullName = data.primaryData as string;
        // Type assertion: drag data metadata contains GitHub repo info
        const metadata = (data.metadata || {}) as {
          name?: string;
          owner?: string;
          cloneUrl?: string;
          htmlUrl?: string;
          [key: string]: unknown;
        };

        // Use full_name as the repo ID (matches how collection members are identified)
        const repoId = fullName;

        // Build repository metadata for the collection
        const repositoryMetadata: RepositoryMetadata = {
          name: metadata.name || fullName.split('/')[1] || fullName,
          path: fullName, // Use full_name as path for GitHub repos
          ...metadata,
        };

        // Convert drop position to grid coordinates
        const gridCoords = domEventToGridCoords(
          event.clientX,
          event.clientY,
          viewportRef.current,
          canvasRef.current
        );

        // Snap to nearest tile
        const gridX = Math.round(gridCoords.gridX);
        const gridY = Math.round(gridCoords.gridY);

        // Add project-drop event
        span.addEvent('collection-map.project-drop', {
          'collection.id': collection.id,
          'source.type': 'repository-github',
          'repository.id': repoId,
          'grid.x': gridX,
          'grid.y': gridY,
        });

        // Place immediately at drop position, passing metadata and span
        await handleProjectMoved(
          repoId,
          gridX,
          gridY,
          repositoryMetadata,
          span
        );

        span.setStatus({ code: 1 });
        span.end();
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2, message: (error as Error).message });
        span.end();
        throw error;
      }
    },
    [handleProjectMoved, collection.id]
  );

  // Set up drop zone for BOTH external drags and drawer drags
  const { isDragOver, ...dropZoneProps } = useDropZone({
    handlers: [
      {
        dataType: 'repository-project',
        onDrop: handleProjectDrop,
      },
      {
        dataType: 'repository-github',
        onDrop: handleGitHubDrop,
      },
      {
        dataType: 'application/x-unplaced-node',
        onDrop: async (data, event) => {
          await handleDrawerDrop(event);
        },
      },
    ],
    showVisualFeedback: true,
  });

  // Convert Alexandria repositories to GenericNode format
  // INCLUDES: Both collection members AND pending repos (waiting to be placed)
  const nodes = useMemo<GenericNode[]>(() => {
    // Map collection members to generic nodes
    const memberNodes = collection.members
      .map((membership) => {
        // Match against github.id (owner/repo format) or name as fallback
        const repo = repositories.find((r) => {
          const repoId = r.github?.id || r.name;
          return repoId === membership.repositoryId;
        });

        if (!repo) {
          console.warn(
            '[nodes memo] No repository found for membership:',
            membership.repositoryId
          );
          return null;
        }

        // Determine category from github metadata or theme
        let category: string | undefined;
        if (repo.github) {
          category = 'git-repo';
        } else {
          category = repo.theme || 'git-repo';
        }

        // Extract primary language from github metadata
        let language: string | undefined;
        if (repo.github) {
          language = repo.github.primaryLanguage;
        }

        // Get importance from metadata (pinned items have higher importance)
        const importance = membership.metadata?.pinned ? 95 : 75;

        // Calculate sprite size from repository metrics (logarithmic scaling)
        let size = calculateRepositorySize(repo.metrics);

        // Calculate aging metrics for weathering and color fade
        const aging = calculateAgingMetrics(repo.metrics?.lastEditedAt);

        // NEW: Extract package info for subdivision rendering
        const packages = extractPackageInfo(repo);

        // Extract GitHub stars from metadata and add extra layout space for decorations
        const stars = repo.github?.stars;
        if (stars && stars > 0) {
          const decorationBonus = getDecorationSizeBonus(stars);
          size = size + decorationBonus; // Increase size to accommodate decoration
        }

        // Extract contributor count from metrics
        const collaborators = repo.metrics?.contributors;
        if (collaborators && collaborators > 0) {
          const decorationBonus =
            getCollaboratorDecorationSizeBonus(collaborators);
          size = size + decorationBonus; // Increase size to accommodate decoration
        }

        // Extract license from GitHub metadata
        const license = repo.github?.license;

        // Extract owner avatar from GitHub metadata
        const ownerAvatar = repo.github?.ownerAvatar;

        const node: GenericNode = {
          id: membership.repositoryId,
          name: repo.name,
          category,
          language, // Pass language for color-based visualization
          importance,
          size,
          aging, // Pass aging metrics for visual weathering
          packages, // Package subdivision data
          stars, // GitHub star count for decorations
          collaborators, // Contributor count for community space decorations
          license, // License identifier for sign/ground treatment
          ownerAvatar, // Owner avatar URL for bottom corner display
          dependencies: dependencies[membership.repositoryId] || [],
          isRoot: membership.metadata?.pinned || false,
          regionId: membership.metadata?.regionId, // Preserve region assignment
          layout: membership.metadata?.layout, // Pass saved position data
        };

        return node;
      })
      .filter((n): n is GenericNode => n !== null);

    return memberNodes;
  }, [collection.id, collection.members, repositories, dependencies]);

  // Emit nodes-memo-recalc telemetry when nodes change
  useEffect(() => {
    // Determine what triggered the recalculation by comparing with previous values
    const currentRepositoriesHash = computeRepositoriesHash(repositories);
    const currentDependenciesKeys = Object.keys(dependencies).sort().join(',');

    const triggers: string[] = [];
    if (prevCollectionIdForMetrics.current !== collection.id) {
      triggers.push('collection.id');
    }
    if (prevMembersLength.current !== collection.members.length) {
      triggers.push('members');
    }
    if (prevRepositoriesHash.current !== currentRepositoriesHash) {
      triggers.push('repositories');
    }
    if (prevDependenciesKeys.current !== currentDependenciesKeys) {
      triggers.push('dependencies');
    }

    // Only emit if we have previous values (skip first render)
    if (prevCollectionIdForMetrics.current !== null) {
      const metricsChanged =
        prevRepositoriesHash.current !== currentRepositoriesHash;
      const totalSize = nodes.reduce((sum, n) => sum + (n.size || 0), 0);

      const span = getTracer().startSpan('collection-map.nodes-memo-recalc');
      span.addEvent('collection-map.nodes-memo-recalc', {
        'collection.id': collection.id,
        'nodes.count': nodes.length,
        'trigger.dep': triggers.length > 0 ? triggers.join(', ') : 'initial',
        'trigger.metrics.changed': metricsChanged,
        'computed.total.size': totalSize,
      });
      span.setStatus({ code: 1 });
      span.end();
    }

    // Update refs for next comparison
    prevCollectionIdForMetrics.current = collection.id;
    prevMembersLength.current = collection.members.length;
    prevRepositoriesHash.current = currentRepositoriesHash;
    prevDependenciesKeys.current = currentDependenciesKeys;
  }, [collection.id, collection.members, repositories, dependencies, nodes]);

  // Split nodes into valid (can render) and unplaced (need user placement)
  const { validNodes, unplacedNodes } = useMemo(() => {
    // Check if this is initial load (no positions at all)
    const nodesWithPositions = nodes.filter(
      (n) =>
        n.regionId &&
        n.layout?.gridX !== undefined &&
        n.layout?.gridY !== undefined
    );
    const isInitialLoad = nodesWithPositions.length === 0 && nodes.length > 0;

    // If initial load, skip validation - auto-layout effect will handle it
    if (isInitialLoad) {
      return { validNodes: nodes, unplacedNodes: [] };
    }

    // After initial load, split nodes:
    // Valid states:
    //   1. Has regionId + has layout (manually placed)
    //   2. Has regionId + NO layout (assigned to region, will be auto-positioned with circle packing)
    // Unplaced state:
    //   3. NO regionId (show in bottom drawer for manual placement)
    const valid: GenericNode[] = [];
    const unplaced: GenericNode[] = [];

    nodes.forEach((node) => {
      const hasRegion = !!node.regionId;

      if (hasRegion) {
        valid.push(node);
      } else {
        unplaced.push(node);
      }
    });

    if (unplaced.length > 0) {
      console.warn(
        `[nodeValidation] Found ${unplaced.length} unplaced nodes (no regionId):\n` +
          unplaced.map((n) => `  - ${n.id}`).join('\n')
      );
    }

    return { validNodes: valid, unplacedNodes: unplaced };
  }, [nodes]);

  // Compute and save BOTH regions and layout in one pass
  // This eliminates duplication between region assignment and layout computation
  const hasComputedLayout = useRef(false);
  const prevCollectionIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Reset hasComputedLayout when collection changes
    if (
      prevCollectionIdRef.current !== null &&
      prevCollectionIdRef.current !== collection.id
    ) {
      hasComputedLayout.current = false;
    }
    prevCollectionIdRef.current = collection.id;

    // Only run once per collection
    if (hasComputedLayout.current) {
      return;
    }
    if (nodes.length === 0) {
      return;
    }

    // Check if we need to initialize anything
    const needsRegions =
      customRegions.length === 0 && !nodes.some((n) => n.regionId);

    // Determine if this is initial load vs new repo added
    // Initial load: ALL nodes missing positions/regions
    // New repo: SOME nodes have positions, some don't (new ones go to staging)
    const nodesWithPositions = nodes.filter(
      (n) =>
        n.regionId &&
        n.layout?.gridX !== undefined &&
        n.layout?.gridY !== undefined
    );
    const isInitialLoad = nodesWithPositions.length === 0 && nodes.length > 0;

    // Only auto-layout during initial load
    // After that, new repos without positions go to staging area for manual placement
    const needsLayout = isInitialLoad;

    if (!needsRegions && !needsLayout) {
      hasComputedLayout.current = true;
      return;
    }

    // Mark as computed BEFORE async work to prevent double-computation
    // This ensures we only compute once per collection, even if renders happen
    // while the async initialization is in progress
    hasComputedLayout.current = true;

    // Create parent span for the entire load operation (workflow: collection-load)
    const span = getTracer().startSpan('collection-map.collection-selected');
    span.setAttribute('collection.id', collection.id);

    // Add entry event for collection selected
    span.addEvent('collection-map.collection-selected', {
      'collection.id': collection.id,
      'collection.name': collection.name,
      'members.count': collection.members.length,
    });

    // Add event for node conversion (already happened in useMemo)
    span.addEvent('collection-map.convert-nodes', {
      'collection.id': collection.id,
      'memberships.count': collection.members.length,
      'repositories.count': repositories.length,
      'nodes.created': nodes.length,
    });

    // Add event for node validation
    span.addEvent('collection-map.validate-nodes', {
      'collection.id': collection.id,
      'nodes.total': nodes.length,
      'nodes.valid': validNodes.length,
      'nodes.unplaced': unplacedNodes.length,
      'is.initial.load': isInitialLoad,
    });

    // Run layout engine - it will create regions AND compute positions
    const map = nodesToUnifiedOverworldMap(nodes, {
      regionLayout,
      customRegions,
    });

    // Add event for layout initialization
    span.addEvent('collection-map.initialize-layout', {
      'collection.id': collection.id,
      'nodes.count': nodes.length,
      'needs.regions': needsRegions,
      'needs.layout': needsLayout,
      'regions.computed': map.regions.length,
      'nodes.positioned': map.nodes.length,
    });

    (async () => {
      try {
        const updates: {
          regions?: CustomRegion[];
          assignments?: Array<{ repositoryId: string; regionId: string }>;
          positions?: Array<{
            repositoryId: string;
            layout: RepositoryLayoutData;
          }>;
        } = {};

        // Prepare regions if needed
        if (needsRegions && map.regions.length > 0) {
          updates.regions = map.regions.map((region, index) => ({
            id: region.id,
            name: region.name,
            order: index,
            createdAt: 0, // Deterministic value - regions don't need real timestamps
          }));
        }

        // Prepare positions for nodes that need them
        // If any node is missing regionId, recompute ALL positions for consistency
        const anyMissingRegionId = nodes.some((n) => !n.regionId);
        updates.positions = map.nodes
          .filter((node) => {
            const originalNode = nodes.find((n) => n.id === node.id);
            const needsUpdate =
              anyMissingRegionId ||
              !originalNode?.layout ||
              originalNode.layout.gridX === undefined ||
              originalNode.layout.gridY === undefined;
            return needsUpdate;
          })
          .map((node) => ({
            repositoryId: node.id,
            layout: {
              gridX: node.gridX,
              gridY: node.gridY,
            },
          }));

        // Prepare assignments for ALL nodes that need positions OR missing regionId
        // This ensures regionId is always set when layout is computed
        if (map.regions.length > 0) {
          updates.assignments = [];
          for (const region of map.regions) {
            for (const nodeId of region.nodeIds) {
              const originalNode = nodes.find((n) => n.id === nodeId);
              // Include assignment if node needs position update OR is missing regionId
              const needsAssignment =
                !originalNode?.regionId ||
                updates.positions?.some((p) => p.repositoryId === nodeId);

              if (needsAssignment) {
                updates.assignments.push({
                  repositoryId: nodeId,
                  regionId: region.id,
                });
              }
            }
          }
        }

        await regionCallbacks.onBatchLayoutInitialized(collection.id, updates);

        // Add event for batch save
        span.addEvent('collection-map.batch-save', {
          'collection.id': collection.id,
          'regions.saved': updates.regions?.length || 0,
          'assignments.saved': updates.assignments?.length || 0,
          'positions.saved': updates.positions?.length || 0,
        });

        // Add event for map rendered
        span.addEvent('collection-map.map-rendered', {
          'collection.id': collection.id,
          'nodes.rendered': validNodes.length,
          'regions.rendered': customRegions.length || map.regions.length,
          'unplaced.count': unplacedNodes.length,
        });

        span.setStatus({ code: 1 }); // OK
        span.end();
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
        span.end();
        throw error;
      }
    })();
  }, [
    collection.id,
    collection.name,
    collection.members.length,
    repositories.length,
    nodes,
    validNodes.length,
    unplacedNodes.length,
    regionLayout,
    customRegions,
    regionCallbacks,
  ]);

  // Callback when viewport is ready
  const handleViewportReady = useCallback((viewport: Viewport) => {
    viewportRef.current = viewport;
  }, []);

  // Handle repository clicked (workflow: repository-click)
  const handleRepositoryClicked = useCallback(
    (repositoryId: string | null) => {
      const span = getTracer().startSpan('collection-map.repository-clicked');

      span.addEvent('collection-map.repository-clicked', {
        'collection.id': collection.id,
        'repository.id': repositoryId || '',
        action: repositoryId ? 'selected' : 'deselected',
      });

      span.setStatus({ code: 1 });
      span.end();

      // Call the original callback if provided
      onRepositoryClicked?.(repositoryId);
    },
    [collection.id, onRepositoryClicked]
  );

  // Handle adding a region (workflow: region-created)
  const handleAddRegion = useCallback(
    async (position: { row: number; col: number }) => {
      const span = getTracer().startSpan('collection-map.region-created');

      try {
        // Calculate order from grid position (row-major order)
        const order = position.row * 10 + position.col; // Assume max 10 columns

        // Generate region name
        const name = `Region ${customRegions.length + 1}`;

        const newRegion = await regionCallbacks.onRegionCreated(collection.id, {
          name,
          order,
          createdAt: 0,
        });

        span.addEvent('collection-map.region-created', {
          'collection.id': collection.id,
          'region.id': newRegion.id,
          'region.name': name,
          'region.order': order,
        });

        span.setStatus({ code: 1 });
        span.end();
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2, message: (error as Error).message });
        span.end();
        throw error;
      }
    },
    [collection.id, customRegions.length, regionCallbacks]
  );

  // Manual drag event handlers to ensure drops work for both external and unplaced node drags
  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Allow drops for both external drags (application/x-panel-data) and unplaced node drags
    if (
      e.dataTransfer.types.includes('application/x-unplaced-node') ||
      e.dataTransfer.types.includes('application/x-panel-data')
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      // Handle unplaced node drags manually (useDropZone doesn't handle them properly)
      if (e.dataTransfer.types.includes('application/x-unplaced-node')) {
        e.preventDefault();
        e.stopPropagation();
        handleDrawerDrop(e);
      }
      // For external drags, let dropZoneProps.onDrop handle it
      else if (dropZoneProps.onDrop) {
        dropZoneProps.onDrop(e);
      }
    },
    [handleDrawerDrop, dropZoneProps]
  );

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
        outline: isDragOver ? '2px solid #3b82f6' : 'none',
        outlineOffset: '-2px',
        transition: 'outline-color 0.2s ease',
      }}
      {...dropZoneProps}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Edit Regions button */}
      <button
        onClick={() => setIsEditingRegions(!isEditingRegions)}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 100,
          backgroundColor: isEditingRegions
            ? 'rgba(251, 191, 36, 0.9)'
            : 'rgba(0, 0, 0, 0.7)',
          border: isEditingRegions ? '2px solid #fbbf24' : '2px solid #4b5563',
          padding: '8px 16px',
          borderRadius: 8,
          color: 'white',
          fontFamily: 'monospace',
          fontSize: 14,
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          pointerEvents: 'auto',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isEditingRegions
            ? 'rgba(251, 191, 36, 1)'
            : 'rgba(75, 85, 99, 0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isEditingRegions
            ? 'rgba(251, 191, 36, 0.9)'
            : 'rgba(0, 0, 0, 0.7)';
        }}
      >
        {isEditingRegions ? 'Done Editing' : 'Edit Layout'}
      </button>

      {/* Overworld map - shows all nodes with validated positions */}
      <OverworldMapPanelContent
        nodes={validNodes}
        regionLayout={regionLayout}
        isLoading={isLoading}
        isEditingRegions={isEditingRegions}
        customRegions={customRegions}
        collectionKey={collection.id}
        onProjectMoved={handleProjectMoved}
        onNodeClicked={handleRepositoryClicked}
        selectedNodeId={selectedRepositoryId}
        onPackageHover={onPackageHover}
        onPackageHoverEnd={onPackageHoverEnd}
        onPackageClick={onPackageClick}
        onViewportReady={handleViewportReady}
        onAddRegion={handleAddRegion}
        onRenameRegion={handleRenameRegion}
        onDeleteRegion={handleDeleteRegion}
      />

      {/* Unplaced nodes drawer - shows nodes without regionId */}
      {unplacedNodes.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(20, 20, 30, 0.95)',
            borderTop: '2px solid #ef4444',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '180px',
            zIndex: 200,
            boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'monospace',
            }}
          >
            <span>⚠️ Unplaced Repositories ({unplacedNodes.length})</span>
            <span style={{ fontSize: '11px', color: '#999' }}>
              Drag onto map to place
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              overflowY: 'hidden',
              paddingBottom: '4px',
            }}
          >
            {unplacedNodes.map((node) => (
              <div
                key={node.id}
                draggable
                onDragStart={(e) => {
                  // Set drag data for dropping onto map
                  e.dataTransfer.setData('text/plain', node.id);
                  e.dataTransfer.setData(
                    'application/x-unplaced-node',
                    JSON.stringify({
                      nodeId: node.id,
                      name: node.name,
                    })
                  );
                }}
                style={{
                  flexShrink: 0,
                  minWidth: '120px',
                  padding: '10px 12px',
                  backgroundColor: '#2a2a3e',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  cursor: 'grab',
                  transition: 'all 0.2s',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#353548';
                  e.currentTarget.style.borderColor = '#666';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a3e';
                  e.currentTarget.style.borderColor = '#444';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                  {node.name}
                </div>
                <div style={{ fontSize: '10px', color: '#888' }}>
                  {node.category || 'repository'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main panel component that integrates with the panel framework
 */
export const CollectionMapPanel: React.FC<
  PanelComponentProps<CollectionMapPanelActions, CollectionMapPanelContext>
> = ({ context, actions }) => {
  // Get data from typed context - host provides filtered data for selected collection only
  const { selectedCollectionView } = context;
  const selectedCollection = selectedCollectionView.data?.collection ?? null;
  const repositories = selectedCollectionView.data?.repositories ?? [];
  const dependencies = selectedCollectionView.data?.dependencies || {};
  const isLoading = selectedCollectionView.loading;

  // Create region management callbacks (must be before early return)
  // Actions is now typed as CollectionMapPanelActions, so these methods are guaranteed to exist
  const regionCallbacks: RegionCallbacks = useMemo(
    () => ({
      onRegionCreated: actions.onRegionCreated,
      onRegionUpdated: actions.onRegionUpdated,
      onRegionDeleted: actions.onRegionDeleted,
      onRepositoryAssigned: actions.onRepositoryAssigned,
      onRepositoryPositionUpdated: actions.onRepositoryPositionUpdated,
      onBatchLayoutInitialized: actions.onBatchLayoutInitialized,
    }),
    [actions]
  );

  // If no collection is selected, show a placeholder
  if (!selectedCollection) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '24px',
          color: '#6b7280',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 500 }}>
          No Collection Selected
        </div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>
          Select a collection to view its overworld map
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <CollectionMapPanelContent
        collection={selectedCollection}
        repositories={repositories}
        dependencies={dependencies}
        isLoading={isLoading}
        regionCallbacks={regionCallbacks}
        addRepositoryToCollection={actions.addRepositoryToCollection}
        onRepositoryClicked={actions.onRepositoryClicked}
        selectedRepositoryId={actions.selectedRepositoryId}
      />
    </div>
  );
};
