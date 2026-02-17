/**
 * CollectionMapPanel - Visualize Alexandria Collections as overworld maps
 */

import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { useDropZone, type PanelDragData } from '@principal-ade/panel-framework-core';
import type { PanelComponentProps, PanelActions } from '../types';
import { OverworldMapPanelContent } from './overworld-map/OverworldMapPanel';
import type { RegionLayout, GenericNode } from './overworld-map/genericMapper';
import { nodesToUnifiedOverworldMap } from './overworld-map/genericMapper';
import { REGION_SIZE_TILES } from './overworld-map/types';
import type { AlexandriaEntry } from '@principal-ai/alexandria-core-library/types';
import { calculateRepositorySize } from '../utils/repositoryScaling';
import { calculateAgingMetrics, type AgingMetrics } from '../utils/repositoryAging';
import type {
  CustomRegion,
  CollectionMetadata,
  RepositoryLayoutData,
  CollectionMembershipMetadata,
  Collection,
  CollectionMembership,
} from '@principal-ai/alexandria-collections';

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
 * Generate a unique region ID
 */
function generateRegionId(): string {
  return `region-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Callbacks for region management
 */
export interface RegionCallbacks {
  /** Create a new custom region */
  onRegionCreated: (collectionId: string, region: Omit<CustomRegion, 'id' | 'createdAt'>) => Promise<CustomRegion>;

  /** Update an existing region */
  onRegionUpdated: (collectionId: string, regionId: string, updates: Partial<CustomRegion>) => Promise<void>;

  /** Delete a region */
  onRegionDeleted: (collectionId: string, regionId: string) => Promise<void>;

  /** Assign a repository to a region (used when manually adding repos) */
  onRepositoryAssigned: (collectionId: string, repositoryId: string, regionId: string) => Promise<void>;

  /** Update a repository's manual position (used when dragging sprites) */
  onRepositoryPositionUpdated: (collectionId: string, repositoryId: string, layout: RepositoryLayoutData) => Promise<void>;

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
export interface CollectionMapPanelActions extends PanelActions, RegionCallbacks {
  /** Add a repository to a collection (for drag-drop integration) */
  addRepositoryToCollection?: (
    collectionId: string,
    repositoryPath: string,
    repositoryMetadata: any
  ) => Promise<void>;
}

/**
 * Context interface for CollectionMapPanel data slices
 * The panel expects the host to provide data for the SELECTED collection only
 */
export interface CollectionMapPanelContext {
  selectedCollectionView: {
    data: {
      /** The selected collection to display */
      collection: Collection;
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
  onProjectAdded?: (repositoryPath: string, repositoryMetadata: any) => void;

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
  width,
  height,
  isLoading = false,
  onProjectMoved,
  onProjectAdded,
  regionCallbacks,
}) => {
  // Log component mount/unmount
  React.useEffect(() => {
    console.info('[CollectionMapPanelContent] 🎬 Component MOUNTED for collection:', collection.name);
    return () => {
      console.info('[CollectionMapPanelContent] 💀 Component UNMOUNTING for collection:', collection.name);
    };
  }, []);

  const customRegions = collection.metadata?.customRegions || [];

  // Region editing state
  const [isEditingRegions, setIsEditingRegions] = React.useState(false);

  // Note: We no longer force creation of a default region
  // Instead, we let the layout algorithm create age-based regions on first load
  // and save them (handled in the effect after projects is defined)

  // Handle renaming a region
  const handleRenameRegion = useCallback(async (regionId: string, name: string) => {
    await regionCallbacks.onRegionUpdated(collection.id, regionId, { name });
  }, [regionCallbacks, collection.id]);

  // Handle deleting a region
  const handleDeleteRegion = useCallback(async (regionId: string) => {
    // Prevent deleting the last region - always keep at least one
    if (customRegions.length <= 1) {
      console.warn('Cannot delete the last region - at least one region must exist');
      alert('Cannot delete the last region. At least one region must exist.');
      return;
    }

    await regionCallbacks.onRegionDeleted(collection.id, regionId);
  }, [regionCallbacks, collection.id, customRegions.length]);

  // Handle project moved (save position to metadata)
  const handleProjectMoved = useCallback(async (projectId: string, gridX: number, gridY: number) => {
    // Find which region this repository belongs to
    const membership = memberships.find(m => m.repositoryId === projectId);
    const regionId = membership?.metadata?.regionId;

    // Find the region to get its bounds
    const region = customRegions.find(r => r.id === regionId);

    // Calculate region bounds (same logic as in genericMapper.ts)
    const regionOrder = region?.order ?? 0;
    const regionRow = Math.floor(regionOrder / 10);
    const regionCol = regionOrder % 10;
    const regionBoundsX = regionCol * REGION_SIZE_TILES;
    const regionBoundsY = regionRow * REGION_SIZE_TILES;

    // Convert from absolute map coordinates to region-relative coordinates
    const relativeGridX = gridX - regionBoundsX;
    const relativeGridY = gridY - regionBoundsY;

    console.info('[CollectionMapPanel] 💾 Saving position:', {
      projectId,
      absolute: { gridX, gridY },
      region: region?.name || 'none',
      regionBounds: { x: regionBoundsX, y: regionBoundsY },
      relative: { gridX: relativeGridX, gridY: relativeGridY }
    });

    const layout: RepositoryLayoutData = {
      gridX: relativeGridX,
      gridY: relativeGridY,
    };

    await regionCallbacks.onRepositoryPositionUpdated(collection.id, projectId, layout);
  }, [collection.id, regionCallbacks, memberships, customRegions]);

  // Handle dropped projects
  const handleProjectDrop = useCallback(async (data: PanelDragData, event: React.DragEvent) => {
    if (!onProjectAdded) {
      console.warn('No onProjectAdded callback provided - cannot add project to collection');
      return;
    }

    // Extract repository info from dropped data
    const repositoryPath = data.primaryData;
    const repositoryMetadata = data.metadata || {};

    // First add the repository to the collection
    onProjectAdded(repositoryPath, repositoryMetadata);

    // If regions exist, assign to appropriate region
    if (customRegions.length > 0) {
      // Determine target region based on repository age if available
      let targetRegionId = customRegions[0]?.id;

      // Check if metadata has lastEditedAt property and use it for age-based assignment
      const lastEditedAt = 'lastEditedAt' in repositoryMetadata ? repositoryMetadata.lastEditedAt : null;
      if (lastEditedAt && customRegions.length >= 4) {
        // Try to assign to age-appropriate region
        const now = Date.now();
        const editTime = new Date(lastEditedAt as string | number).getTime();
        const daysAgo = (now - editTime) / (1000 * 60 * 60 * 24);

        let regionIndex = 0;
        if (daysAgo > 365) regionIndex = 3; // Older
        else if (daysAgo > 90) regionIndex = 2; // Last Year
        else if (daysAgo > 30) regionIndex = 1; // Last 3 Months
        // else regionIndex = 0; // Last Month

        targetRegionId = customRegions[regionIndex]?.id || customRegions[0]?.id;
      }

      // Assign repository to the determined region
      if (targetRegionId) {
        await regionCallbacks.onRepositoryAssigned(collection.id, repositoryPath, targetRegionId);
      }
    }
    // If no regions exist yet, the initialization effect will create them and assign repos
  }, [collection.id, onProjectAdded, customRegions, regionCallbacks]);

  // Set up drop zone
  const { isDragOver, ...dropZoneProps } = useDropZone({
    handlers: [
      {
        dataType: 'repository-project',
        onDrop: handleProjectDrop,
      },
    ],
    showVisualFeedback: true,
  });

  // Convert Alexandria repositories to GenericNode format
  const nodes = useMemo<GenericNode[]>(() => {
    console.info('[CollectionMapPanel] 📦 Recomputing nodes for collection:', collection.name);
    // Filter memberships for this collection
    const collectionMemberships = memberships.filter(
      (m) => m.collectionId === collection.id
    );

    // Map to generic nodes
    return collectionMemberships
      .map((membership) => {
        // Match against github.id (owner/repo format) or name as fallback
        const repo = repositories.find((r) => {
          const repoId = (r as any).github?.id || r.name;
          return repoId === membership.repositoryId;
        });

        if (!repo) {
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
          language = (repo as any).github?.language || (repo as any).github?.primaryLanguage;
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

        if (membership.metadata?.layout) {
          console.info('[CollectionMapPanel] 📍 Node', repo.name, 'has saved layout:', membership.metadata.layout);
        }

        return node;
      })
      .filter((n): n is GenericNode => n !== null);
  }, [collection.id, memberships, repositories, dependencies]);

  // Compute and save BOTH regions and layout in one pass
  // This eliminates duplication between region assignment and layout computation
  const hasComputedLayout = useRef(false);
  useEffect(() => {
    console.info('[CollectionMapPanel] 🏗️ Layout effect running, hasComputedLayout:', hasComputedLayout.current, 'nodes:', nodes.length);

    // Only run once per collection
    if (hasComputedLayout.current) {
      console.info('[CollectionMapPanel] 🏗️ Skipping - already computed layout');
      return;
    }
    if (nodes.length === 0) {
      console.info('[CollectionMapPanel] 🏗️ Skipping - no nodes');
      return;
    }

    // Check if we need to initialize anything
    const needsRegions = customRegions.length === 0 && !nodes.some(n => n.regionId);
    const needsLayout = nodes.some(node =>
      !node.layout || node.layout.gridX === undefined || node.layout.gridY === undefined
    );

    console.info('[CollectionMapPanel] 🏗️ needsRegions:', needsRegions, 'needsLayout:', needsLayout);

    if (!needsRegions && !needsLayout) {
      console.info('[CollectionMapPanel] 🏗️ All nodes have layout, setting hasComputedLayout=true');
      hasComputedLayout.current = true;
      return;
    }

    // Run layout engine - it will create regions AND compute positions
    const map = nodesToUnifiedOverworldMap(nodes, {
      regionLayout,
      customRegions,
    });

    (async () => {
      const updates: {
        regions?: CustomRegion[];
        assignments?: Array<{ repositoryId: string; regionId: string }>;
        positions?: Array<{ repositoryId: string; layout: RepositoryLayoutData }>;
      } = {};

      // Prepare regions if needed
      if (needsRegions && map.regions.length > 0) {
        updates.regions = map.regions.map((region, index) => ({
          id: region.id,
          name: region.name,
          order: index,
          createdAt: Date.now(),
        }));
      }

      // Prepare positions for nodes that need them
      updates.positions = map.nodes
        .filter(node => {
          const originalNode = nodes.find(n => n.id === node.id);
          const needsUpdate = !originalNode?.layout || originalNode.layout.gridX === undefined || originalNode.layout.gridY === undefined;
          if (!needsUpdate) {
            console.info('[CollectionMapPanel] 🏗️ Skipping', node.id, '- already has layout:', originalNode?.layout);
          }
          return needsUpdate;
        })
        .map(node => ({
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
            const originalNode = nodes.find(n => n.id === nodeId);
            // Include assignment if node needs position update OR is missing regionId
            const needsAssignment =
              !originalNode?.regionId ||
              updates.positions?.some(p => p.repositoryId === nodeId);

            if (needsAssignment) {
              updates.assignments.push({
                repositoryId: nodeId,
                regionId: region.id,
              });
            }
          }
        }
        console.info('[CollectionMapPanel] 🏗️ Creating', updates.assignments.length, 'region assignments');
      }

      console.info('[CollectionMapPanel] 🏗️ Initializing layout for', updates.positions?.length, 'nodes');

      // Single batched update - 1 re-render!
      await regionCallbacks.onBatchLayoutInitialized(collection.id, updates);
      console.info('[CollectionMapPanel] 🏗️ Layout initialized, setting hasComputedLayout=true');
      hasComputedLayout.current = true;
    })();
  }, [collection.id, nodes, regionLayout, customRegions, regionCallbacks]);

  // Reset layout flag when collection changes (not on initial mount)
  const prevCollectionIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevCollectionIdRef.current === null) {
      // Initial mount - don't reset
      console.info('[CollectionMapPanel] 🔄 Initial collection:', collection.id, '- keeping hasComputedLayout as is');
      prevCollectionIdRef.current = collection.id;
    } else if (prevCollectionIdRef.current !== collection.id) {
      // Collection actually changed - reset layout
      console.info('[CollectionMapPanel] 🔄 Collection changed from', prevCollectionIdRef.current, 'to', collection.id, '- resetting hasComputedLayout to false');
      hasComputedLayout.current = false;
      prevCollectionIdRef.current = collection.id;
    }
  }, [collection.id]);


  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        border: isDragOver ? '2px solid #3b82f6' : 'none',
        transition: 'border 0.2s ease',
      }}
      {...dropZoneProps}
    >
      {/* Edit Regions button */}
      <button
        onClick={() => setIsEditingRegions(!isEditingRegions)}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 100,
          backgroundColor: isEditingRegions ? 'rgba(251, 191, 36, 0.9)' : 'rgba(0, 0, 0, 0.7)',
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
          e.currentTarget.style.backgroundColor = isEditingRegions ? 'rgba(251, 191, 36, 1)' : 'rgba(75, 85, 99, 0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isEditingRegions ? 'rgba(251, 191, 36, 0.9)' : 'rgba(0, 0, 0, 0.7)';
        }}
      >
        {isEditingRegions ? 'Done Editing' : 'Edit Layout'}
      </button>

      {/* Overworld map (always visible) */}
      <OverworldMapPanelContent
        nodes={nodes}
        regionLayout={regionLayout}
        isLoading={isLoading}
        isEditingRegions={isEditingRegions}
        customRegions={customRegions}
        collectionKey={collection.id}
        onProjectMoved={handleProjectMoved}
        onAddRegion={async (position: { row: number; col: number }) => {
          // Calculate order from grid position (row-major order)
          const order = position.row * 10 + position.col; // Assume max 10 columns

          // Generate region name
          const name = `Region ${customRegions.length + 1}`;

          await regionCallbacks.onRegionCreated(collection.id, { name, order });
        }}
        onRenameRegion={handleRenameRegion}
        onDeleteRegion={handleDeleteRegion}
      />

    </div>
  );
};

/**
 * Data slice for user collections
 */
export interface UserCollectionsSlice {
  collections: Collection[];
  memberships: CollectionMembership[];
  loading: boolean;
  error?: string;
}

/**
 * Data slice for Alexandria repositories
 */
export interface AlexandriaRepositoriesSlice {
  repositories: AlexandriaEntryWithMetrics[];
  loading: boolean;
  error?: string;
}

/**
 * Main panel component that integrates with the panel framework
 */
export const CollectionMapPanel: React.FC<PanelComponentProps<CollectionMapPanelActions, CollectionMapPanelContext>> = ({ context, actions }) => {
  // Log component mount/unmount
  React.useEffect(() => {
    console.info('[CollectionMapPanel] 🎬 Panel component MOUNTED');
    return () => {
      console.info('[CollectionMapPanel] 💀 Panel component UNMOUNTING');
    };
  }, []);

  // Get data from typed context - host provides filtered data for selected collection only
  const { selectedCollectionView } = context;
  const selectedCollection = selectedCollectionView?.data?.collection;
  const memberships = selectedCollectionView?.data?.memberships || [];
  const repositories = selectedCollectionView?.data?.repositories || [];
  const dependencies = selectedCollectionView?.data?.dependencies || {};
  const isLoading = selectedCollectionView?.loading ?? false;

  // Debug logging for memberships changes
  React.useEffect(() => {
    console.info('[CollectionMapPanel] 📊 Memberships updated for collection:', selectedCollection?.name);
    console.info('[CollectionMapPanel] 📊 Memberships:', memberships.map(m => ({
      repo: m.repositoryId,
      regionId: m.metadata?.regionId,
      layout: m.metadata?.layout
    })));
  }, [memberships, selectedCollection?.name]);

  // Handle adding a project to the collection
  const handleProjectAdded = useCallback((repositoryPath: string, repositoryMetadata: any) => {
    if (!selectedCollection) return;
    // Call actions method to add repository to collection
    // This is provided by the host application's context provider
    if (actions.addRepositoryToCollection) {
      actions.addRepositoryToCollection(selectedCollection.id, repositoryPath, repositoryMetadata);
    } else {
      console.warn('Actions does not support addRepositoryToCollection - drag-drop feature requires context integration');
    }
  }, [actions, selectedCollection]);

  // Create region management callbacks (must be before early return)
  // Actions is now typed as CollectionMapPanelActions, so these methods are guaranteed to exist
  const regionCallbacks: RegionCallbacks = useMemo(() => ({
    onRegionCreated: actions.onRegionCreated,
    onRegionUpdated: actions.onRegionUpdated,
    onRegionDeleted: actions.onRegionDeleted,
    onRepositoryAssigned: actions.onRepositoryAssigned,
    onRepositoryPositionUpdated: actions.onRepositoryPositionUpdated,
    onBatchLayoutInitialized: actions.onBatchLayoutInitialized,
  }), [actions]);

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
        <div style={{ fontSize: '18px', fontWeight: 500 }}>No Collection Selected</div>
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
