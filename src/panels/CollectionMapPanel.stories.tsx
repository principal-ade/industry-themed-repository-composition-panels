import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { CollectionMapPanel, CollectionMapPanelContent } from './CollectionMapPanel';
import type {
  Collection,
  AlexandriaRepository,
  CollectionMembership,
  UserCollectionsSlice,
  AlexandriaRepositoriesSlice,
} from './CollectionMapPanel';
import type { PanelContextValue, PanelActions, PanelEventEmitter } from '../types';
import type { RegionLayout } from './overworld-map/genericMapper';

/**
 * CollectionMapPanel visualizes Alexandria Collections as 8-bit overworld maps.
 * Each collection becomes a named world with repositories as buildings.
 */

// Mock context factory
const createMockContext = (
  selectedCollection: Collection | null,
  collections: Collection[],
  memberships: CollectionMembership[],
  repositories: AlexandriaRepository[]
): PanelContextValue => {
  const userCollectionsSlice: UserCollectionsSlice = {
    collections,
    memberships,
    loading: false,
  };

  const alexandriaRepositoriesSlice: AlexandriaRepositoriesSlice = {
    repositories,
    loading: false,
  };

  return {
    selectedCollection,
    getSlice: (sliceName: string) => {
      if (sliceName === 'userCollections') {
        return { data: userCollectionsSlice, loading: false };
      }
      if (sliceName === 'alexandriaRepositories') {
        return { data: alexandriaRepositoriesSlice, loading: false };
      }
      return undefined;
    },
    hasSlice: () => true,
    isSliceLoading: () => false,
    refresh: async () => {},
    addEventListener: () => () => {},
    removeEventListener: () => {},
  } as any;
};

const meta = {
  title: 'Panels/CollectionMapPanel',
  component: CollectionMapPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Visualizes Alexandria Collections as 8-bit overworld maps. Collections become named worlds, repositories become buildings. Drag buildings to reorganize, pan the map to explore.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CollectionMapPanel>;

export default meta;
type Story = Omit<StoryObj<typeof meta>, 'args'> & { render: () => React.ReactElement };

// Example collection
const activeProjectsCollection: Collection = {
  id: 'active-projects',
  name: 'Active Projects',
  description: 'Currently working on these',
  icon: '🚀',
  isDefault: true,
  createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
  updatedAt: Date.now(),
};

const readingListCollection: Collection = {
  id: 'reading-list',
  name: 'Reading List',
  description: 'Repos to explore',
  icon: '📚',
  createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
  updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
};

const archiveCollection: Collection = {
  id: 'archive',
  name: 'Archive',
  description: 'Completed or deprecated projects',
  icon: '📦',
  createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
  updatedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
};

// Example repositories
const repositories: AlexandriaRepository[] = [
  {
    name: 'web-ade',
    registeredAt: new Date().toISOString(),
    provider: { type: 'github' },
    theme: 'frontend',
  },
  {
    name: 'mobile-app',
    registeredAt: new Date().toISOString(),
    provider: { type: 'github' },
    theme: 'frontend',
  },
  {
    name: 'backend-api',
    registeredAt: new Date().toISOString(),
    provider: { type: 'github' },
    theme: 'backend',
  },
  {
    name: 'auth-service',
    registeredAt: new Date().toISOString(),
    provider: { type: 'github' },
    theme: 'backend',
  },
  {
    name: 'database',
    registeredAt: new Date().toISOString(),
    provider: { type: 'github' },
    theme: 'backend',
  },
  {
    name: 'shared-ui',
    registeredAt: new Date().toISOString(),
    provider: { type: 'github' },
    theme: 'library',
  },
  {
    name: 'api-client',
    registeredAt: new Date().toISOString(),
    provider: { type: 'github' },
    theme: 'library',
  },
  {
    name: 'shared-types',
    registeredAt: new Date().toISOString(),
    provider: { type: 'github' },
    theme: 'library',
  },
  {
    name: 'cli-tool',
    registeredAt: new Date().toISOString(),
    provider: { type: 'github' },
    theme: 'tool',
  },
  {
    name: 'docs',
    registeredAt: new Date().toISOString(),
    provider: { type: 'github' },
    theme: 'frontend',
  },
];

/**
 * Active Projects collection - Current working repos with dependencies
 */
export const ActiveProjects: Story = {
  render: () => {
    const memberships: CollectionMembership[] = [
      {
        repositoryId: 'web-ade',
        collectionId: 'active-projects',
        addedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
        metadata: { pinned: true, notes: 'Main frontend app' },
      },
      {
        repositoryId: 'backend-api',
        collectionId: 'active-projects',
        addedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
        metadata: { pinned: true, notes: 'Core API server' },
      },
      {
        repositoryId: 'shared-ui',
        collectionId: 'active-projects',
        addedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      },
      {
        repositoryId: 'api-client',
        collectionId: 'active-projects',
        addedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      },
      {
        repositoryId: 'database',
        collectionId: 'active-projects',
        addedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      },
      {
        repositoryId: 'auth-service',
        collectionId: 'active-projects',
        addedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      },
    ];

    const context = createMockContext(
      activeProjectsCollection,
      [activeProjectsCollection, readingListCollection, archiveCollection],
      memberships,
      repositories
    );

    const mockActions: PanelActions = {};
    const mockEvents: PanelEventEmitter = {
      emit: () => {},
      on: () => () => {},
      off: () => {},
    } as any;

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <CollectionMapPanel context={context} actions={mockActions} events={mockEvents} />
      </div>
    );
  },
};

/**
 * Reading List - Repos to explore (no dependencies yet)
 */
export const ReadingList: Story = {
  render: () => {
    const memberships: CollectionMembership[] = [
      {
        repositoryId: 'cli-tool',
        collectionId: 'reading-list',
        addedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      },
      {
        repositoryId: 'docs',
        collectionId: 'reading-list',
        addedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
      },
      {
        repositoryId: 'mobile-app',
        collectionId: 'reading-list',
        addedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        metadata: { notes: 'Consider for next sprint' },
      },
    ];

    const context = createMockContext(
      readingListCollection,
      [activeProjectsCollection, readingListCollection, archiveCollection],
      memberships,
      repositories
    );

    const mockActions: PanelActions = {};
    const mockEvents: PanelEventEmitter = {
      emit: () => {},
      on: () => () => {},
      off: () => {},
    } as any;

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <CollectionMapPanel context={context} actions={mockActions} events={mockEvents} />
      </div>
    );
  },
};

/**
 * Archive - Older projects (minimal dependencies shown)
 */
export const Archive: Story = {
  render: () => {
    const memberships: CollectionMembership[] = [
      {
        repositoryId: 'shared-types',
        collectionId: 'archive',
        addedAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
        metadata: { notes: 'Deprecated, use new types package' },
      },
    ];

    const context = createMockContext(
      archiveCollection,
      [activeProjectsCollection, readingListCollection, archiveCollection],
      memberships,
      repositories
    );

    const mockActions: PanelActions = {};
    const mockEvents: PanelEventEmitter = {
      emit: () => {},
      on: () => () => {},
      off: () => {},
    } as any;

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <CollectionMapPanel context={context} actions={mockActions} events={mockEvents} />
      </div>
    );
  },
};

/**
 * Empty Collection - No repositories yet
 */
export const EmptyCollection: Story = {
  render: () => {
    const emptyCollection: Collection = {
      id: 'new-collection',
      name: 'New Collection',
      description: 'Just created',
      icon: '✨',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const context = createMockContext(
      emptyCollection,
      [activeProjectsCollection, readingListCollection, archiveCollection, emptyCollection],
      [],
      []
    );

    const mockActions: PanelActions = {};
    const mockEvents: PanelEventEmitter = {
      emit: () => {},
      on: () => () => {},
      off: () => {},
    } as any;

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <CollectionMapPanel context={context} actions={mockActions} events={mockEvents} />
      </div>
    );
  },
};

/**
 * Large Collection - Many repos (tests performance and pagination)
 */
export const LargeCollection: Story = {
  render: () => {
    const largeCollection: Collection = {
      ...activeProjectsCollection,
      id: 'all-repos',
      name: 'All Repos',
      icon: '🌐',
    };

    const memberships: CollectionMembership[] = repositories.map((repo, index) => ({
      repositoryId: repo.name,
      collectionId: 'all-repos',
      addedAt: Date.now() - index * 24 * 60 * 60 * 1000,
      metadata: index < 2 ? { pinned: true } : undefined,
    }));

    const context = createMockContext(
      largeCollection,
      [activeProjectsCollection, readingListCollection, archiveCollection, largeCollection],
      memberships,
      repositories
    );

    const mockActions: PanelActions = {};
    const mockEvents: PanelEventEmitter = {
      emit: () => {},
      on: () => () => {},
      off: () => {},
    } as any;

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <CollectionMapPanel context={context} actions={mockActions} events={mockEvents} />
      </div>
    );
  },
};

/**
 * Multiple Regions with Bridges - Horizontal Layout
 *
 * Enterprise collection with 28+ repos split into regions.
 * Regions are laid out horizontally (default behavior).
 *
 * Features demonstrated:
 * - Automatic region grouping (12 repos per region max)
 * - Vertical water bridges between regions (3 tiles wide)
 * - Region navigation with arrow buttons
 * - Drag to pan across the entire unified map
 * - Region labels showing current position (e.g., "Region 2 of 3")
 */
export const MultipleRegionsHorizontal: Story = {
  render: () => {
    const enterpriseCollection: Collection = {
      id: 'enterprise-monorepo',
      name: 'Enterprise Monorepo',
      description: 'Full-stack enterprise application',
      icon: '🏢',
      createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now(),
    };

    // Create 28 repositories across different categories to show regions
    const largeRepositorySet: AlexandriaRepository[] = [
      // Region 1 - Core & Infrastructure (11 repos)
      { name: 'monorepo-root', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'core-types', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'library' },
      { name: 'shared-utils', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'library' },
      { name: 'config-manager', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'library' },
      { name: 'logger-service', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'database-layer', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'cache-service', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'auth-service', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'api-gateway', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'event-bus', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'message-queue', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },

      // Region 2 - Frontend & UI (11 repos)
      { name: 'design-system', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'ui-components', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'web-app', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'admin-panel', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'mobile-app', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'icons-library', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'library' },
      { name: 'theme-engine', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'library' },
      { name: 'ui-hooks', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'library' },
      { name: 'form-builder', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'data-grid', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'chart-components', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },

      // Region 3 - Tools, Testing & DevOps (6 repos)
      { name: 'cli-tools', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'tool' },
      { name: 'build-scripts', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'tool' },
      { name: 'code-generators', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'tool' },
      { name: 'testing-utils', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'tool' },
      { name: 'e2e-tests', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'tool' },
      { name: 'dev-server', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'tool' },
    ];

    const largeMemberships: CollectionMembership[] = largeRepositorySet.map((repo, index) => ({
      repositoryId: repo.name,
      collectionId: 'enterprise-monorepo',
      addedAt: Date.now() - index * 24 * 60 * 60 * 1000,
      metadata: index === 0 ? { pinned: true, notes: 'Monorepo root' } : undefined,
    }));

    const context = createMockContext(
      enterpriseCollection,
      [activeProjectsCollection, readingListCollection, archiveCollection, enterpriseCollection],
      largeMemberships,
      largeRepositorySet
    );

    const mockActions: PanelActions = {};
    const mockEvents: PanelEventEmitter = {
      emit: () => {},
      on: () => () => {},
      off: () => {},
    } as any;

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <CollectionMapPanel context={context} actions={mockActions} events={mockEvents} />
      </div>
    );
  },
};

/**
 * Multiple Regions - 2x2 Grid Layout
 *
 * Enterprise collection with 28+ repos split into 4 regions arranged in a 2x2 grid.
 * Regions are laid out in a square grid pattern instead of horizontally.
 *
 * Features demonstrated:
 * - Custom regionLayout configuration (2 columns, 2 rows)
 * - Both horizontal and vertical water bridges between regions
 * - Row-major fill direction (fills left-to-right, then top-to-bottom)
 * - Square grid layout for better space utilization
 */
export const MultipleRegionsGridLayout: Story = {
  render: () => {
    const enterpriseCollection: Collection = {
      id: 'enterprise-grid',
      name: 'Enterprise Grid',
      description: 'Full-stack application in 2x2 grid',
      icon: '🏢',
      createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now(),
    };

    // Create 28 repositories across different categories
    const largeRepositorySet: AlexandriaRepository[] = [
      // Region 1 (top-left) - Core & Infrastructure (11 repos)
      { name: 'monorepo-root', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'core-types', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'library' },
      { name: 'shared-utils', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'library' },
      { name: 'config-manager', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'library' },
      { name: 'logger-service', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'database-layer', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'cache-service', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'auth-service', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'api-gateway', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'event-bus', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },
      { name: 'message-queue', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'backend' },

      // Region 2 (top-right) - Frontend & UI (11 repos)
      { name: 'design-system', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'ui-components', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'web-app', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'admin-panel', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'mobile-app', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'icons-library', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'library' },
      { name: 'theme-engine', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'library' },
      { name: 'ui-hooks', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'library' },
      { name: 'form-builder', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'data-grid', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },
      { name: 'chart-components', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'frontend' },

      // Region 3 (bottom-left) - Tools & Testing (6 repos)
      { name: 'cli-tools', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'tool' },
      { name: 'build-scripts', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'tool' },
      { name: 'code-generators', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'tool' },
      { name: 'testing-utils', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'tool' },
      { name: 'e2e-tests', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'tool' },
      { name: 'dev-server', registeredAt: new Date().toISOString(), provider: { type: 'github' }, theme: 'tool' },
    ];

    const largeMemberships: CollectionMembership[] = largeRepositorySet.map((repo, index) => ({
      repositoryId: repo.name,
      collectionId: 'enterprise-grid',
      addedAt: Date.now() - index * 24 * 60 * 60 * 1000,
      metadata: index === 0 ? { pinned: true, notes: 'Monorepo root' } : undefined,
    }));

    // Configure 2x2 grid layout
    const gridLayout: RegionLayout = {
      columns: 2,
      rows: 2,
      fillDirection: 'row-major', // Fill left-to-right, then top-to-bottom
    };

    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <CollectionMapPanelContent
          collection={enterpriseCollection}
          memberships={largeMemberships}
          repositories={largeRepositorySet}
          regionLayout={gridLayout}
        />
      </div>
    );
  },
};

/**
 * Drag-and-Drop Demo
 *
 * Tests dropping repository projects onto the collection map.
 * This demonstrates the drop zone integration for adding projects from local projects panel.
 */
export const DragDropDemo: Story = {
  render: () => {
    const [droppedProjects, setDroppedProjects] = useState<string[]>([]);
    const [memberships, setMemberships] = useState<CollectionMembership[]>([
      {
        repositoryId: 'web-ade',
        collectionId: 'active-projects',
        addedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
        metadata: { pinned: true },
      },
    ]);

    // Mock draggable projects for testing
    const mockDraggableProjects = [
      { path: '/Users/dev/backend-api', name: 'backend-api', github: { owner: 'principal', primaryLanguage: 'TypeScript' } },
      { path: '/Users/dev/mobile-app', name: 'mobile-app', github: { owner: 'principal', primaryLanguage: 'Dart' } },
      { path: '/Users/dev/shared-ui', name: 'shared-ui', github: { owner: 'principal', primaryLanguage: 'TypeScript' } },
    ];

    const handleProjectAdded = (repositoryPath: string, repositoryMetadata: any) => {
      console.log('Project dropped:', { repositoryPath, repositoryMetadata });
      setDroppedProjects(prev => [...prev, repositoryMetadata.name || repositoryPath]);

      // Add to memberships (simulating adding to collection)
      const newMembership: CollectionMembership = {
        repositoryId: repositoryMetadata.name || repositoryPath,
        collectionId: 'active-projects',
        addedAt: Date.now(),
      };
      setMemberships(prev => [...prev, newMembership]);
    };

    return (
      <div style={{ display: 'flex', gap: '0', height: '100vh', width: '100vw', backgroundColor: '#0a0a0f' }}>
        {/* Source: Draggable project items */}
        <div style={{ width: '300px', borderRight: '1px solid #333', padding: '16px', overflow: 'auto', backgroundColor: '#1a1a2e' }}>
          <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
            📦 Drag Source (Mock Projects)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mockDraggableProjects.map((project) => (
              <div
                key={project.path}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', project.path);
                  e.dataTransfer.setData('application/x-panel-data', JSON.stringify({
                    dataType: 'repository-project',
                    primaryData: project.path,
                    metadata: {
                      name: project.name,
                      github: project.github,
                    },
                    sourcePanel: 'local-projects',
                    suggestedActions: ['add-to-collection'],
                  }));
                }}
                style={{
                  padding: '12px',
                  backgroundColor: '#16213e',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  cursor: 'grab',
                  transition: 'all 0.2s ease',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.cursor = 'grabbing';
                  e.currentTarget.style.opacity = '0.7';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.cursor = 'grab';
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: '#0f3460', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {project.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.name}
                    </div>
                    <div style={{ color: '#888', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.github.primaryLanguage}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dropped projects list */}
          {droppedProjects.length > 0 && (
            <div style={{ marginTop: '24px', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px' }}>
              <div style={{ color: '#10b981', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                ✓ {droppedProjects.length} Project{droppedProjects.length !== 1 ? 's' : ''} Dropped
              </div>
              <div style={{ fontSize: '11px', color: '#888' }}>
                {droppedProjects.map((name, i) => (
                  <div key={i}>• {name}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Target: Collection Map with drop zone */}
        <div style={{ flex: 1 }}>
          <CollectionMapPanelContent
            collection={activeProjectsCollection}
            memberships={memberships}
            repositories={repositories}
            onProjectAdded={handleProjectAdded}
          />
        </div>
      </div>
    );
  },
};
