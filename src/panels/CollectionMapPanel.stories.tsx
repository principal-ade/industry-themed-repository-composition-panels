import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { CollectionMapPanel } from './CollectionMapPanel';
import type {
  Collection,
  AlexandriaRepository,
  CollectionMembership,
  UserCollectionsSlice,
  AlexandriaRepositoriesSlice,
} from './CollectionMapPanel';
import type { PanelContextValue, PanelActions, PanelEventEmitter } from '../types';

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
