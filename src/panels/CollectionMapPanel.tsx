/**
 * CollectionMapPanel - Visualize Alexandria Collections as overworld maps
 */

import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  useDropZone,
  type PanelDragData,
} from '@principal-ade/panel-framework-core';
import { Viewport } from 'pixi-viewport';
import { trace } from '@opentelemetry/api';
import type {
  PanelComponentProps,
  PanelActions,
  RepositoryMetadata,
} from '../types';
import { OverworldMapPanelContent } from './overworld-map/OverworldMapPanel';
import type { RegionLayout, GenericNode } from './overworld-map/genericMapper';
import { nodesToUnifiedOverworldMap } from './overworld-map/genericMapper';
import { REGION_SIZE_TILES } from './overworld-map/types';
import { domEventToGridCoords } from './overworld-map/isometricUtils';
import type { AlexandriaEntry } from '@principal-ai/alexandria-core-library/types';
import { calculateRepositorySize } from '../utils/repositoryScaling';
import { calculateAgingMetrics } from '../utils/repositoryAging';
import type {
  CustomRegion,
  RepositoryLayoutData,
  Collection,
  CollectionMembership,
} from '@principal-ai/alexandria-collections';

// Create tracer for CollectionMapPanel
const tracer = trace.getTracer('collection-map-panel', '0.6.9');

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
  addRepositoryToCollection?: (
    collectionId: string,
    repositoryPath: string,
    repositoryMetadata: RepositoryMetadata
  ) => Promise<void>;
}

/**
 * Context interface for CollectionMapPanel data slices
 * The panel expects the host to provide data for the SELECTED collection only
 */
export interface CollectionMapPanelContext {
  selectedCollectionView: {
    data: {
      /** The selected collection to display (null when no collection is selected) */
      collection: Collection | null;
      /** Memberships ONLY for the selected collection (already filtered by host) */
      memberships: CollectionMembership[];
      /** Repositories ONLY for the selected collection (already filtered by host) */
      repositories: AlexandriaEntryWithMetrics[];
      /** Optional dependency graph for connections between repos */
      dependencies?: Record<string, string[]>;
    };
    loading: boolean;
    error: string | null;
  };
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

  /** Repositories in this collection */
  memberships: CollectionMembership[];

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

  /** Callback when a project is moved (for saving position) */
  onProjectMoved?: (projectId: string, gridX: number, gridY: number) => void;

  /** Callback when a project is dropped to add to collection */
  onProjectAdded?: (
    repositoryPath: string,
    repositoryMetadata: RepositoryMetadata
  ) => void;

  /** Callbacks for region management operations (REQUIRED) */
  regionCallbacks: RegionCallbacks;
}

/**
 * CollectionMapPanelContent Component
 * Converts Alexandria Collections to overworld map visualization
 */
export const CollectionMapPanelContent: React.FC<CollectionMapPanelProps> = ({
  collection,
  memberships,
  repositories,
  dependencies = {},
  regionLayout,
  isLoading = false,
  onProjectAdded,
  regionCallbacks,
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

  // Note: We no longer force creation of a default region
  // Instead, we let the layout algorithm create age-based regions on first load
  // and save them (handled in the effect after projects is defined)

  // Handle renaming a region
  const handleRenameRegion = useCallback(
    async (regionId: string, name: string) => {
      await regionCallbacks.onRegionUpdated(collection.id, regionId, { name });
    },
    [regionCallbacks, collection.id]
  );

  // Handle deleting a region
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

      await regionCallbacks.onRegionDeleted(collection.id, regionId);
    },
    [regionCallbacks, collection.id, customRegions.length]
  );

  // Handle project moved (save position to metadata)
  const handleProjectMoved = useCallback(
    async (
      projectId: string,
      gridX: number,
      gridY: number,
      metadata?: RepositoryMetadata
    ) => {
      // Check if this is a repo being added for the first time (from drag-drop)
      const isNewRepo = !!metadata;
      const existingMembership = memberships.find(
        (m) => m.repositoryId === projectId
      );

      // VALIDATION: For existing repos, must have a membership
      if (!isNewRepo && !existingMembership) {
        const error = new Error(
          `[handleProjectMoved] FATAL ERROR: Attempting to move repo "${projectId}" that doesn't exist in collection!\n` +
            `Memberships (${memberships.length}): [${memberships.map((m) => m.repositoryId).join(', ')}]\n` +
            `This indicates a sprite was rendered without valid backing data.`
        );
        console.error(error);
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

      // Find the region at this position
      const targetRegion = customRegions.find((r) => r.order === regionOrder);
      const newRegionId = targetRegion?.id;

      if (!newRegionId) {
        console.warn(
          '[CollectionMapPanel] ⚠️ Could not determine region for position:',
          { gridX, gridY, regionOrder }
        );
        return;
      }

      // If this is a first placement (new repo from drag-drop OR existing membership without regionId)
      if (isFirstPlacement) {
        try {
          // If it's a new repo (not yet in collection), add it first
          if (isNewRepo) {
            if (!onProjectAdded) {
              throw new Error('onProjectAdded callback not available');
            }

            await onProjectAdded(projectId, metadata);
          }

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
        } catch (error) {
          console.error('[PLACEMENT] ✗ ERROR during placement:', error);
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
      const membership = memberships.find((m) => m.repositoryId === projectId);
      const oldRegionId = membership?.metadata?.regionId;

      if (oldRegionId !== newRegionId) {
        await regionCallbacks.onRepositoryAssigned(
          collection.id,
          projectId,
          newRegionId
        );
      }
    },
    [collection.id, regionCallbacks, memberships, customRegions, onProjectAdded]
  );

  // Handle dropped projects
  const handleProjectDrop = useCallback(
    async (data: PanelDragData, event: React.DragEvent) => {
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

      // Place immediately at drop position, passing metadata directly
      await handleProjectMoved(repoId, gridX, gridY, repositoryMetadata);
    },
    [handleProjectMoved]
  );

  // Handle drags from the unplaced drawer
  const handleDrawerDrop = useCallback(
    async (event: React.DragEvent) => {
      const unplacedNodeData = event.dataTransfer.getData(
        'application/x-unplaced-node'
      );
      if (!unplacedNodeData) return; // Not a drawer drag

      event.preventDefault();
      event.stopPropagation();

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

      // Place the node (no metadata needed - it's already in the collection)
      await handleProjectMoved(nodeId, gridX, gridY);
    },
    [handleProjectMoved]
  );

  // Set up drop zone for BOTH external drags and drawer drags
  const { isDragOver, ...dropZoneProps } = useDropZone({
    handlers: [
      {
        dataType: 'repository-project',
        onDrop: handleProjectDrop,
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
    return tracer.startActiveSpan('collection-map.convert-nodes', (span) => {
      try {
        span.setAttribute('collection.id', collection.id);
        span.setAttribute('memberships.count', memberships.length);
        span.setAttribute('repositories.count', repositories.length);

        // Filter memberships for this collection
        const collectionMemberships = memberships.filter(
          (m) => m.collectionId === collection.id
        );

        // Map collection members to generic nodes
        const memberNodes = collectionMemberships
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
            const size = calculateRepositorySize(repo.metrics);

            // Calculate aging metrics for weathering and color fade
            const aging = calculateAgingMetrics(repo.metrics?.lastEditedAt);

            const node: GenericNode = {
              id: membership.repositoryId,
              name: repo.name,
              category,
              language, // Pass language for color-based visualization
              importance,
              size,
              aging, // Pass aging metrics for visual weathering
              dependencies: dependencies[membership.repositoryId] || [],
              isRoot: membership.metadata?.pinned || false,
              regionId: membership.metadata?.regionId, // Preserve region assignment
              layout: membership.metadata?.layout, // Pass saved position data
            };

            return node;
          })
          .filter((n): n is GenericNode => n !== null);

        span.setAttribute('nodes.created', memberNodes.length);
        span.end();
        return memberNodes;
      } catch (error) {
        span.recordException(error as Error);
        span.end();
        throw error;
      }
    });
  }, [collection.id, memberships, repositories, dependencies]);

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

    // Run layout engine - it will create regions AND compute positions
    const span = tracer.startSpan('collection-map.initialize-layout');
    span.setAttribute('collection.id', collection.id);
    span.setAttribute('nodes.count', nodes.length);
    span.setAttribute('needs.regions', needsRegions);
    span.setAttribute('needs.layout', needsLayout);

    const map = nodesToUnifiedOverworldMap(nodes, {
      regionLayout,
      customRegions,
    });

    span.setAttribute('regions.computed', map.regions.length);
    span.setAttribute('nodes.positioned', map.nodes.length);

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

        // Single batched update - 1 re-render!
        span.addEvent('batch-layout-update', {
          'regions.count': updates.regions?.length || 0,
          'assignments.count': updates.assignments?.length || 0,
          'positions.count': updates.positions?.length || 0,
        });

        await regionCallbacks.onBatchLayoutInitialized(collection.id, updates);

        span.setStatus({ code: 1 }); // OK
        span.end();
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
        span.end();
        throw error;
      }
    })();
  }, [collection.id, nodes, regionLayout, customRegions, regionCallbacks]);

  // Callback when viewport is ready
  const handleViewportReady = useCallback((viewport: Viewport) => {
    viewportRef.current = viewport;
  }, []);

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
        border: isDragOver ? '2px solid #3b82f6' : '2px solid transparent',
        transition: 'border-color 0.2s ease',
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
        onViewportReady={handleViewportReady}
        onAddRegion={async (position: { row: number; col: number }) => {
          // Calculate order from grid position (row-major order)
          const order = position.row * 10 + position.col; // Assume max 10 columns

          // Generate region name
          const name = `Region ${customRegions.length + 1}`;

          await regionCallbacks.onRegionCreated(collection.id, {
            name,
            order,
            createdAt: 0,
          });
        }}
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
  const selectedCollection = selectedCollectionView.data.collection;
  const memberships = selectedCollectionView.data.memberships;
  const repositories = selectedCollectionView.data.repositories;
  const dependencies = selectedCollectionView.data.dependencies || {};
  const isLoading = selectedCollectionView.loading;

  // Handle adding a project to the collection
  const handleProjectAdded = useCallback(
    (repositoryPath: string, repositoryMetadata: RepositoryMetadata) => {
      if (!selectedCollection) {
        console.warn('[handleProjectAdded] No selected collection');
        return;
      }
      // Call actions method to add repository to collection
      // This is provided by the host application's context provider
      if (actions.addRepositoryToCollection) {
        actions.addRepositoryToCollection(
          selectedCollection.id,
          repositoryPath,
          repositoryMetadata
        );
      } else {
        console.warn(
          'Actions does not support addRepositoryToCollection - drag-drop feature requires context integration'
        );
      }
    },
    [actions, selectedCollection]
  );

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
        memberships={memberships}
        repositories={repositories}
        dependencies={dependencies}
        isLoading={isLoading}
        onProjectAdded={handleProjectAdded}
        regionCallbacks={regionCallbacks}
      />
    </div>
  );
};
