/**
 * CollectionMapPanel - Visualize Alexandria Collections as overworld maps
 */

import React, { useMemo, useCallback } from 'react';
import { useDropZone, type PanelDragData } from '@principal-ade/panel-framework-core';
import type { PanelComponentProps } from '../types';
import { GitProjectsMapPanelContent, type GitProject } from './GitProjectsMapPanel';
import type { RegionLayout } from './overworld-map/genericMapper';
import type { AlexandriaEntry } from '@principal-ai/alexandria-core-library/types';
import { calculateRepositorySize } from '../utils/repositoryScaling';
import { calculateAgingMetrics, type AgingMetrics } from '../utils/repositoryAging';

/**
 * Custom region definition for manual layout
 */
export interface CustomRegion {
  id: string;
  name: string;
  description?: string;
  color?: string; // Optional theme color (hex)
  order: number; // Display order (0-based)
  createdAt: number;
}

/**
 * Collection metadata for manual regions
 */
export interface CollectionMetadata {
  /** Custom regions defined by the user */
  customRegions?: CustomRegion[];

  /** Layout mode: 'auto' = age-based, 'manual' = user-defined regions */
  layoutMode?: 'auto' | 'manual';

  /** Allow additional metadata */
  [key: string]: unknown;
}

/**
 * Alexandria Collections types (from @principal-ai/alexandria-collections)
 */
export interface Collection {
  id: string;
  name: string;
  description?: string;
  theme?: string;
  icon?: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
  metadata?: CollectionMetadata;
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
}

/**
 * Manual layout position data
 */
export interface RepositoryLayoutData {
  gridX: number;
  gridY: number;
  isManuallyPositioned: boolean;
}

/**
 * Collection membership metadata
 */
export interface CollectionMembershipMetadata {
  /** Which custom region this repository belongs to */
  regionId?: string;

  /** Manual position override (for manual layout mode) */
  layout?: RepositoryLayoutData;

  /** Whether this repository is pinned (affects importance) */
  pinned?: boolean;

  /** User notes about this repository */
  notes?: string;

  /** Allow additional metadata */
  [key: string]: unknown;
}

export interface CollectionMembership {
  repositoryId: string;
  collectionId: string;
  addedAt: number;
  metadata?: CollectionMembershipMetadata;
}

/**
 * Generate a unique region ID
 */
function generateRegionId(): string {
  return `region-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a default region for a new collection
 */
export function createDefaultRegion(name: string = 'Main'): CustomRegion {
  return {
    id: generateRegionId(),
    name,
    order: 0,
    createdAt: Date.now(),
  };
}

/**
 * Create default age-based regions for auto-layout
 */
export function createDefaultAgeRegions(): CustomRegion[] {
  return [
    {
      id: generateRegionId(),
      name: 'Last Month',
      description: 'Repositories edited in the last 30 days',
      order: 0,
      createdAt: Date.now(),
    },
    {
      id: generateRegionId(),
      name: 'Last 3 Months',
      description: 'Repositories edited in the last 90 days',
      order: 1,
      createdAt: Date.now(),
    },
    {
      id: generateRegionId(),
      name: 'Last Year',
      description: 'Repositories edited in the last 365 days',
      order: 2,
      createdAt: Date.now(),
    },
    {
      id: generateRegionId(),
      name: 'Older',
      description: 'Repositories not edited in over a year',
      order: 3,
      createdAt: Date.now(),
    },
  ];
}


/**
 * Callbacks for region management
 */
export interface RegionCallbacks {
  /** Create a new custom region */
  onRegionCreated?: (collectionId: string, region: Omit<CustomRegion, 'id' | 'createdAt'>) => Promise<CustomRegion>;

  /** Update an existing region */
  onRegionUpdated?: (collectionId: string, regionId: string, updates: Partial<CustomRegion>) => Promise<void>;

  /** Delete a region */
  onRegionDeleted?: (collectionId: string, regionId: string) => Promise<void>;

  /** Assign a repository to a region */
  onRepositoryAssigned?: (collectionId: string, repositoryId: string, regionId: string) => Promise<void>;

  /** Initialize default age-based regions */
  onInitializeDefaultRegions?: (collectionId: string, regions: CustomRegion[]) => Promise<void>;

  /** Switch collection layout mode */
  onSwitchLayoutMode?: (collectionId: string, mode: 'auto' | 'manual') => Promise<void>;
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

  /** Callbacks for region management operations */
  regionCallbacks?: RegionCallbacks;
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

  // Determine layout mode
  const layoutMode = collection.metadata?.layoutMode || 'auto';
  const customRegions = collection.metadata?.customRegions || [];

  // Region editing state
  const [isEditingRegions, setIsEditingRegions] = React.useState(false);

  // Initialize default age-based regions if none exist
  React.useEffect(() => {
    if (customRegions.length === 0 && regionCallbacks?.onInitializeDefaultRegions) {
      const defaultRegions = createDefaultAgeRegions();
      regionCallbacks.onInitializeDefaultRegions(collection.id, defaultRegions);
    }
  }, [collection.id, customRegions.length, regionCallbacks]);

  // Helper to switch to manual mode (when user makes any change)
  const switchToManualMode = useCallback(async () => {
    if (layoutMode === 'auto' && regionCallbacks?.onSwitchLayoutMode) {
      await regionCallbacks.onSwitchLayoutMode(collection.id, 'manual');
    }
  }, [layoutMode, collection.id, regionCallbacks]);


  // Handle renaming a region
  const handleRenameRegion = useCallback(async (regionId: string, name: string) => {
    if (!regionCallbacks?.onRegionUpdated) {
      console.warn('No onRegionUpdated callback provided');
      return;
    }

    // Switch to manual mode on user change
    await switchToManualMode();

    await regionCallbacks.onRegionUpdated(collection.id, regionId, { name });
    console.log('Renamed region:', regionId, name);
  }, [regionCallbacks, collection.id, switchToManualMode]);

  // Handle deleting a region
  const handleDeleteRegion = useCallback(async (regionId: string) => {
    if (!regionCallbacks?.onRegionDeleted) {
      console.warn('No onRegionDeleted callback provided');
      return;
    }

    // Switch to manual mode on user change
    await switchToManualMode();

    await regionCallbacks.onRegionDeleted(collection.id, regionId);
    console.log('Deleted region:', regionId);
  }, [regionCallbacks, collection.id, switchToManualMode]);

  // Handle dropped projects
  const handleProjectDrop = useCallback(async (data: PanelDragData, event: React.DragEvent) => {
    if (!onProjectAdded) {
      console.warn('No onProjectAdded callback provided - cannot add project to collection');
      return;
    }

    // Extract repository info from dropped data
    const repositoryPath = data.primaryData;
    const repositoryMetadata = data.metadata || {};

    console.log('Project dropped on collection map:', {
      path: repositoryPath,
      metadata: repositoryMetadata,
      collectionId: collection.id,
      sourcePanel: data.sourcePanel,
      layoutMode,
    });

    // In manual mode, assign to first region or create default if none exist
    if (layoutMode === 'manual') {
      let targetRegionId: string;

      // If no regions exist, create a default one
      if (customRegions.length === 0 && regionCallbacks?.onRegionCreated) {
        console.log('No regions exist - creating default region');
        const defaultRegion = await regionCallbacks.onRegionCreated(collection.id, {
          name: 'Main',
          order: 0,
        });
        targetRegionId = defaultRegion.id;
      } else {
        // Assign to first region by default (could be enhanced with UI selection)
        targetRegionId = customRegions[0]?.id;
      }

      // Assign repository to region
      if (targetRegionId && regionCallbacks?.onRepositoryAssigned) {
        // First add the repository to the collection
        onProjectAdded(repositoryPath, repositoryMetadata);

        // Then assign it to the region
        // Note: We use repositoryPath as the repositoryId for now
        await regionCallbacks.onRepositoryAssigned(collection.id, repositoryPath, targetRegionId);
      } else {
        console.warn('No region available to assign repository to');
        onProjectAdded(repositoryPath, repositoryMetadata);
      }
    } else {
      // Auto mode - just add the project
      onProjectAdded(repositoryPath, repositoryMetadata);
    }
  }, [collection.id, onProjectAdded, layoutMode, customRegions, regionCallbacks]);

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

  // Convert Alexandria repositories to GitProject format
  const projects = useMemo<GitProject[]>(() => {
    // Filter memberships for this collection
    const collectionMemberships = memberships.filter(
      (m) => m.collectionId === collection.id
    );

    // Map to repositories
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

        const project: GitProject = {
          id: membership.repositoryId,
          name: repo.name,
          path: repo.name, // Could derive from clones in future
          category,
          language, // Pass language for color-based visualization
          importance,
          size,
          aging, // Pass aging metrics for visual weathering
          dependencies: dependencies[membership.repositoryId] || [],
          isRoot: membership.metadata?.pinned || false,
        };

        return project;
      })
      .filter((p): p is GitProject => p !== null);
  }, [collection.id, memberships, repositories, dependencies]);

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
      {/* Collection name header */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 100,
          backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.9)' : 'rgba(0, 0, 0, 0.7)',
          padding: '8px 16px',
          borderRadius: 8,
          color: 'white',
          fontFamily: 'monospace',
          fontSize: 14,
          fontWeight: 'bold',
          pointerEvents: 'none',
          transition: 'background-color 0.2s ease',
        }}
      >
        {collection.icon && <span style={{ marginRight: 8 }}>{collection.icon}</span>}
        {collection.name}
        {isDragOver && <span style={{ marginLeft: 8 }}>+ Drop to add</span>}
        {layoutMode === 'manual' && (
          <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}>
            ({customRegions.length} region{customRegions.length !== 1 ? 's' : ''})
          </span>
        )}
      </div>

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
        {isEditingRegions ? '✓ Done Editing' : '⚙️ Edit Regions'}
      </button>

      {/* Overworld map (always visible) */}
      <GitProjectsMapPanelContent
        projects={projects}
        regionLayout={regionLayout}
        isLoading={isLoading}
        isEditingRegions={isEditingRegions}
        customRegions={customRegions}
        onAddRegion={async (position: { row: number; col: number }) => {
          // Switch to manual mode on user change
          await switchToManualMode();

          // Calculate order from grid position (row-major order)
          const order = position.row * 10 + position.col; // Assume max 10 columns

          // Generate region name
          const name = `Region ${customRegions.length + 1}`;

          if (regionCallbacks?.onRegionCreated) {
            await regionCallbacks.onRegionCreated(collection.id, { name, order });
          }
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
export const CollectionMapPanel: React.FC<PanelComponentProps> = ({ context, actions }) => {
  // Get collections data from context
  const collectionsSlice = context.getSlice<UserCollectionsSlice>('userCollections');
  const collections = collectionsSlice?.data?.collections || [];
  const memberships = collectionsSlice?.data?.memberships || [];
  const collectionsLoading = collectionsSlice?.loading ?? false;

  // Get repositories data from context
  const repositoriesSlice = context.getSlice<AlexandriaRepositoriesSlice>('alexandriaRepositories');
  const repositories = repositoriesSlice?.data?.repositories || [];
  const repositoriesLoading = repositoriesSlice?.loading ?? false;

  // Get selected collection from context (set by UserCollectionsPanel)
  const selectedCollectionId = (context as any).selectedCollection?.id;
  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);

  // Handle adding a project to the collection
  const handleProjectAdded = useCallback((repositoryPath: string, repositoryMetadata: any) => {
    // Call actions method to add repository to collection
    // This is provided by the host application's context provider
    if ((actions as any)?.addRepositoryToCollection) {
      (actions as any).addRepositoryToCollection(selectedCollectionId, repositoryPath, repositoryMetadata);
    } else {
      console.warn('Actions does not support addRepositoryToCollection - drag-drop feature requires context integration');
    }
  }, [actions, selectedCollectionId]);

  // Create region management callbacks (must be before early return)
  const regionCallbacks: RegionCallbacks = useMemo(() => ({
    onInitializeDefaultRegions: async (collectionId: string, regions: CustomRegion[]) => {
      console.log('Initializing default age regions:', { collectionId, regions });
      if ((actions as any)?.initializeDefaultRegions) {
        await (actions as any).initializeDefaultRegions(collectionId, regions);
      } else {
        console.warn('Actions does not support initializeDefaultRegions - region management requires context integration');
      }
    },

    onSwitchLayoutMode: async (collectionId: string, mode: 'auto' | 'manual') => {
      console.log('Switching layout mode:', { collectionId, mode });
      if ((actions as any)?.switchLayoutMode) {
        await (actions as any).switchLayoutMode(collectionId, mode);
      } else {
        console.warn('Actions does not support switchLayoutMode - region management requires context integration');
      }
    },

    onRegionCreated: async (collectionId: string, region: Omit<CustomRegion, 'id' | 'createdAt'>) => {
      // This would be implemented by the host application
      // For now, we'll just log it
      console.log('Region created:', { collectionId, region });

      const newRegion: CustomRegion = {
        ...region,
        id: generateRegionId(),
        createdAt: Date.now(),
      };

      // Call the actions method if available
      if ((actions as any)?.createRegion) {
        await (actions as any).createRegion(collectionId, newRegion);
      } else {
        console.warn('Actions does not support createRegion - region management requires context integration');
      }

      return newRegion;
    },

    onRegionUpdated: async (collectionId: string, regionId: string, updates: Partial<CustomRegion>) => {
      console.log('Region updated:', { collectionId, regionId, updates });
      if ((actions as any)?.updateRegion) {
        await (actions as any).updateRegion(collectionId, regionId, updates);
      }
    },

    onRegionDeleted: async (collectionId: string, regionId: string) => {
      console.log('Region deleted:', { collectionId, regionId });
      if ((actions as any)?.deleteRegion) {
        await (actions as any).deleteRegion(collectionId, regionId);
      }
    },

    onRepositoryAssigned: async (collectionId: string, repositoryId: string, regionId: string) => {
      console.log('Repository assigned to region:', { collectionId, repositoryId, regionId });
      if ((actions as any)?.assignRepositoryToRegion) {
        await (actions as any).assignRepositoryToRegion(collectionId, repositoryId, regionId);
      }
    },
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
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>No Collection Selected</div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>
          Select a collection to view its overworld map
        </div>
      </div>
    );
  }

  // Filter memberships for this collection
  const collectionMemberships = memberships.filter(
    (m) => m.collectionId === selectedCollection.id
  );

  // For now, dependencies are empty - could be enhanced later
  const dependencies: Record<string, string[]> = {};

  const isLoading = collectionsLoading || repositoriesLoading;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <CollectionMapPanelContent
        collection={selectedCollection}
        memberships={collectionMemberships}
        repositories={repositories}
        dependencies={dependencies}
        isLoading={isLoading}
        onProjectAdded={handleProjectAdded}
        regionCallbacks={regionCallbacks}
      />
    </div>
  );
};
