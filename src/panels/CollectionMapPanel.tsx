/**
 * CollectionMapPanel - Visualize Alexandria Collections as overworld maps
 */

import React, { useMemo } from 'react';
import type { PanelComponentProps } from '../types';
import { GitProjectsMapPanelContent, type GitProject } from './GitProjectsMapPanel';

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

  /** Panel width */
  width?: number;

  /** Panel height */
  height?: number;

  /** Loading state */
  isLoading?: boolean;

  /** Callback when a project is moved (for saving position) */
  onProjectMoved?: (projectId: string, gridX: number, gridY: number) => void;
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
  width = 800,
  height = 600,
  isLoading = false,
  onProjectMoved,
}) => {
  // Convert Alexandria repositories to GitProject format
  const projects = useMemo<GitProject[]>(() => {
    // Filter memberships for this collection
    const collectionMemberships = memberships.filter(
      (m) => m.collectionId === collection.id
    );

    // Map to repositories
    return collectionMemberships
      .map((membership) => {
        const repo = repositories.find((r) => r.name === membership.repositoryId);
        if (!repo) return null;

        // Determine category from provider or metadata
        let category: string | undefined;
        if (repo.provider?.type === 'github') {
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
    <div style={{ position: 'relative', width, height }}>
      {/* Collection name header */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 100,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 16px',
          borderRadius: 8,
          color: 'white',
          fontFamily: 'monospace',
          fontSize: 14,
          fontWeight: 'bold',
          pointerEvents: 'none',
        }}
      >
        {collection.icon && <span style={{ marginRight: 8 }}>{collection.icon}</span>}
        {collection.name}
      </div>

      {/* Overworld map */}
      <GitProjectsMapPanelContent
        projects={projects}
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
    <CollectionMapPanelContent
      collection={selectedCollection}
      memberships={collectionMemberships}
      repositories={repositories}
      dependencies={dependencies}
      isLoading={isLoading}
    />
  );
};
