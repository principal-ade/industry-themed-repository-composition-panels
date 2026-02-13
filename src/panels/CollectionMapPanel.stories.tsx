import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
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
