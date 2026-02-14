/**
 * CollectionMapPanel - Visualize Alexandria Collections as overworld maps
 */

import React, { useMemo, useCallback } from 'react';
import { useDropZone, type PanelDragData } from '@principal-ade/panel-framework-core';
import type { PanelComponentProps } from '../types';
import { GitProjectsMapPanelContent, type GitProject } from './GitProjectsMapPanel';
import type { RegionLayout } from './overworld-map/genericMapper';

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
  metadata?: Record<string, unknown>;
}

export interface AlexandriaRepository {
  name: string;
  registeredAt: string;
  provider?: {
    type: 'github' | 'gitlab' | 'bitbucket' | 'generic';
    metadata?: any;
    url?: string;
  };
  lastChecked?: string;
  theme?: string;
}

export interface CollectionMembership {
  repositoryId: string;
  collectionId: string;
  addedAt: number;
  metadata?: {
    pinned?: boolean;
    notes?: string;
    [key: string]: unknown;
  };
}

export interface CollectionMapPanelProps {
  /** The collection to visualize as an overworld map */
  collection: Collection;

  /** Repositories in this collection */
  memberships: CollectionMembership[];

  /** Full repository data */
  repositories: AlexandriaRepository[];

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
}) => {

  // Handle dropped projects
  const handleProjectDrop = useCallback((data: PanelDragData, event: React.DragEvent) => {
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
    });

    onProjectAdded(repositoryPath, repositoryMetadata);
  }, [collection.id, onProjectAdded]);

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

        // Determine category from provider or metadata
        let category: string | undefined;
        // Support both AlexandriaEntry (with github field) and AlexandriaRepository (with provider field)
        if (repo.provider?.type === 'github' || (repo as any).github) {
          category = 'git-repo';
        } else {
          category = repo.theme || 'git-repo';
        }

        // Get importance from metadata (pinned items have higher importance)
        const importance = membership.metadata?.pinned ? 95 : 75;

        const project: GitProject = {
          id: membership.repositoryId,
          name: repo.name,
          path: repo.name, // Could derive from clones in future
          category,
          importance,
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
      </div>

      {/* Overworld map */}
      <GitProjectsMapPanelContent
        projects={projects}
        regionLayout={regionLayout}
        width={width}
        height={height}
        isLoading={isLoading}
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
  repositories: AlexandriaRepository[];
  loading: boolean;
  error?: string;
}

/**
 * Main panel component that integrates with the panel framework
 */
export const CollectionMapPanel: React.FC<PanelComponentProps> = ({ context }) => {
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
    // Call context method to add repository to collection
    // This will need to be implemented in the host application's context
    if ((context as any).addRepositoryToCollection) {
      (context as any).addRepositoryToCollection(selectedCollectionId, repositoryPath, repositoryMetadata);
    } else {
      console.warn('Context does not support addRepositoryToCollection - drag-drop feature requires context integration');
    }
  }, [context, selectedCollectionId]);

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
      />
    </div>
  );
};
