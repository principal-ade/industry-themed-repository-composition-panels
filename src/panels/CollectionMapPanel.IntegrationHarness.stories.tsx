import React, { useState, useCallback, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CollectionMapPanel, CollectionMapPanelActions } from './CollectionMapPanel';
import type { PanelComponentProps } from '@principal-ade/panel-framework-core';
import type { Collection, CollectionMembership, CustomRegion } from '@principal-ai/alexandria-collections';

// Browser-compatible EventEmitter
class SimpleEventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  emit(event: string, ...args: any[]) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(...args));
    }
  }
}

const meta: Meta<typeof CollectionMapPanel> = {
  title: 'Panels/Collection Map/Integration Harness',
  component: CollectionMapPanel,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof CollectionMapPanel>;

// Mock Alexandria repository entries
const createMockRepository = (name: string, language: string, fileCount: number, lineCount: number, daysAgo: number) => ({
  name,
  path: `/Users/mock/${name}`,
  registeredAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
  lastEditedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
  provider: {
    type: 'github' as const,
    url: `https://github.com/mock/${name}`,
  },
  theme: language,
  metrics: {
    fileCount,
    lineCount,
  },
});

const mockRepositories = [
  createMockRepository('active-frontend', 'typescript', 450, 25000, 2),
  createMockRepository('api-service', 'python', 120, 15000, 5),
  createMockRepository('mobile-app', 'kotlin', 380, 32000, 7),
  createMockRepository('data-pipeline', 'rust', 95, 12000, 10),
  createMockRepository('analytics-dashboard', 'typescript', 220, 18000, 15),
  createMockRepository('auth-service', 'go', 85, 8500, 20),
  createMockRepository('notification-service', 'javascript', 110, 9200, 25),
  createMockRepository('legacy-monolith', 'java', 1200, 95000, 45),
  createMockRepository('old-frontend', 'javascript', 340, 28000, 60),
  createMockRepository('prototype-ml', 'python', 75, 6500, 90),
  createMockRepository('archived-experiment', 'ruby', 45, 3200, 180),
  createMockRepository('design-system', 'typescript', 180, 14000, 8),
  createMockRepository('testing-framework', 'typescript', 95, 7800, 30),
  createMockRepository('deployment-scripts', 'shell', 25, 1500, 12),
  createMockRepository('documentation', 'markdown', 60, 4500, 20),
];

// Integration Harness Component
const IntegrationHarness: React.FC<{
  initialCollection: Collection;
  initialMemberships: CollectionMembership[];
}> = ({ initialCollection, initialMemberships }) => {
  const [collection, setCollection] = useState(initialCollection);
  const [memberships, setMemberships] = useState(initialMemberships);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const logEvent = useCallback((message: string) => {
    setEventLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  // Create event emitter
  const eventEmitter = useMemo(() => new SimpleEventEmitter(), []);

  // Region management callbacks
  const onRegionCreated = useCallback(async (collectionId: string, region: Omit<CustomRegion, 'id'>) => {
    logEvent(`Creating region: ${region.name}`);

    const newRegion: CustomRegion = {
      ...region,
      id: `region-${Date.now()}`,
    };

    setCollection((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        customRegions: [...(prev.metadata?.customRegions || []), newRegion],
      },
    }));

    eventEmitter.emit('industry-theme.user-collections:collection:updated', { collectionId, region: newRegion });
    logEvent(`Region created: ${newRegion.id}`);

    return newRegion;
  }, [logEvent, eventEmitter]);

  const onRegionUpdated = useCallback(async (collectionId: string, regionId: string, updates: Partial<CustomRegion>) => {
    logEvent(`Updating region ${regionId}: ${JSON.stringify(updates)}`);

    setCollection((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        customRegions: prev.metadata?.customRegions?.map((r) =>
          r.id === regionId ? { ...r, ...updates } : r
        ),
      },
    }));

    eventEmitter.emit('industry-theme.user-collections:collection:updated', { collectionId, regionId, updates });
    logEvent(`Region updated: ${regionId}`);
  }, [logEvent, eventEmitter]);

  const onRegionDeleted = useCallback(async (collectionId: string, regionId: string) => {
    logEvent(`Deleting region: ${regionId}`);

    setCollection((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        customRegions: prev.metadata?.customRegions?.filter((r) => r.id !== regionId),
      },
    }));

    // Remove region assignments from memberships
    setMemberships((prev) =>
      prev.map((m) => {
        if (m.metadata?.regionId === regionId) {
          const { regionId: _, ...restMetadata } = m.metadata;
          return { ...m, metadata: restMetadata };
        }
        return m;
      })
    );

    eventEmitter.emit('industry-theme.user-collections:collection:updated', { collectionId, regionId, deleted: true });
    logEvent(`Region deleted: ${regionId}`);
  }, [logEvent, eventEmitter]);

  const onRepositoryAssigned = useCallback(async (collectionId: string, repositoryId: string, regionId: string | null) => {
    logEvent(`Assigning repository ${repositoryId} to region ${regionId || 'none'}`);

    setMemberships((prev) =>
      prev.map((m) =>
        m.repositoryId === repositoryId
          ? {
              ...m,
              metadata: regionId ? { ...m.metadata, regionId } : { ...m.metadata, regionId: undefined },
            }
          : m
      )
    );

    eventEmitter.emit('industry-theme.user-collections:collection:repository-assigned', { collectionId, repositoryId, regionId });
    logEvent(`Repository assigned: ${repositoryId} -> ${regionId || 'auto'}`);
  }, [logEvent, eventEmitter]);

  const onRepositoryPositionUpdated = useCallback(async (collectionId: string, repositoryId: string, layout: any) => {
    logEvent(`Updating position for ${repositoryId}: (${layout.gridX}, ${layout.gridY})`);

    setMemberships((prev) =>
      prev.map((m) =>
        m.repositoryId === repositoryId
          ? {
              ...m,
              metadata: { ...m.metadata, layout },
            }
          : m
      )
    );

    eventEmitter.emit('industry-theme.user-collections:collection:repository-position-updated', { collectionId, repositoryId, layout });
    logEvent(`Position saved: ${repositoryId} at (${layout.gridX}, ${layout.gridY})`);
  }, [logEvent, eventEmitter]);

  const onBatchLayoutInitialized = useCallback(async (
    collectionId: string,
    updates: {
      regions?: CustomRegion[];
      assignments?: Array<{ repositoryId: string; regionId: string }>;
      positions?: Array<{ repositoryId: string; layout: any }>;
    }
  ) => {
    logEvent(`Batch layout initialized: ${updates.regions?.length || 0} regions, ${updates.assignments?.length || 0} assignments, ${updates.positions?.length || 0} positions`);

    // Update collection with regions (if provided)
    if (updates.regions && updates.regions.length > 0) {
      setCollection((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          customRegions: [...(prev.metadata?.customRegions || []), ...updates.regions!],
        },
      }));
    }

    // Update memberships with assignments and positions in ONE setState
    setMemberships((prev) =>
      prev.map((m) => {
        const assignment = updates.assignments?.find((a) => a.repositoryId === m.repositoryId);
        const position = updates.positions?.find((p) => p.repositoryId === m.repositoryId);

        if (!assignment && !position) return m; // No changes for this membership

        return {
          ...m,
          metadata: {
            ...m.metadata,
            ...(assignment && { regionId: assignment.regionId }),
            ...(position && { layout: position.layout }),
          },
        };
      })
    );

    eventEmitter.emit('industry-theme.user-collections:collection:batch-layout-initialized', { collectionId, updates });
    logEvent(`Batch layout complete`);
  }, [logEvent, eventEmitter]);

  const onInitializeDefaultRegions = useCallback(async (collectionId: string, regions: CustomRegion[]) => {
    logEvent(`Initializing ${regions.length} default regions`);

    setCollection((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        customRegions: regions,
      },
    }));

    eventEmitter.emit('industry-theme.user-collections:collection:updated', { collectionId, regions });
    logEvent(`Default regions initialized`);
  }, [logEvent, eventEmitter]);

  // Mock context, actions, and events
  const mockProps: PanelComponentProps<CollectionMapPanelActions> = useMemo(
    () => ({
      context: {
        getSlice: (sliceName: string) => {
          if (sliceName === 'userCollections') {
            return {
              data: {
                collections: [collection],
                memberships,
                selectedCollectionId: collection.id,
              },
              loading: false,
              error: null,
            };
          }
          if (sliceName === 'alexandriaRepositories') {
            return {
              data: {
                repositories: mockRepositories,
              },
              loading: false,
              error: null,
            };
          }
          return { data: null, loading: false, error: null };
        },
        selectedCollection: collection,
        scope: {
          type: 'workspace',
          workspaceId: 'test-workspace',
        },
        refresh: async () => {
          logEvent('Context refresh requested');
        },
      } as any,
      actions: {
        onRegionCreated,
        onRegionUpdated,
        onRegionDeleted,
        onRepositoryAssigned,
        onRepositoryPositionUpdated,
        onInitializeDefaultRegions,
        onBatchLayoutInitialized,
        openRepository: async (entry: any) => {
          logEvent(`Opening repository: ${entry.name}`);
        },
        addRepositoryToCollection: async (collectionId: string, repositoryPath: string) => {
          logEvent(`Adding repository to collection: ${repositoryPath}`);
        },
      } as any,
      events: eventEmitter as any,
    }),
    [
      collection,
      memberships,
      logEvent,
      onRegionCreated,
      onRegionUpdated,
      onRegionDeleted,
      onRepositoryAssigned,
      onRepositoryPositionUpdated,
      onInitializeDefaultRegions,
      onBatchLayoutInitialized,
      eventEmitter,
    ]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CollectionMapPanel {...mockProps} />
      </div>
      <div
        style={{
          height: '200px',
          borderTop: '1px solid #ccc',
          padding: '10px',
          overflow: 'auto',
          backgroundColor: '#f5f5f5',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}
      >
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Event Log:</div>
        {eventLog.map((log, i) => (
          <div key={i} style={{ marginBottom: '2px' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};

// Story: Active Projects (age-based regions with pre-assigned repos)
// Repos are already assigned to regions - you can drag them around
export const ActiveProjects: Story = {
  render: () => {
    // Create default age-based regions
    const ageRegions: CustomRegion[] = [
      { id: 'region-last-month', name: 'Last Month', order: 0, createdAt: Date.now() },
      { id: 'region-last-3-months', name: 'Last 3 Months', order: 1, createdAt: Date.now() },
      { id: 'region-last-year', name: 'Last Year', order: 2, createdAt: Date.now() },
      { id: 'region-older', name: 'Older', order: 3, createdAt: Date.now() },
    ];

    // Assign repositories to regions based on lastEditedAt
    const getRegionIdByAge = (daysAgo: number): string => {
      if (daysAgo <= 30) return 'region-last-month';
      if (daysAgo <= 90) return 'region-last-3-months';
      if (daysAgo <= 365) return 'region-last-year';
      return 'region-older';
    };

    return (
      <IntegrationHarness
        initialCollection={{
          id: 'col-active',
          name: 'Active Projects',
          description: 'Currently active development projects',
          theme: 'industry',
          icon: 'Zap',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          metadata: {
            customRegions: ageRegions,
          },
        }}
        initialMemberships={mockRepositories.slice(0, 10).map((repo, idx) => {
          // Extract days ago from repo (it was created with daysAgo parameter)
          const daysAgo = (Date.now() - new Date(repo.lastEditedAt).getTime()) / (1000 * 60 * 60 * 24);
          return {
            id: `mem-${idx}`,
            repositoryId: repo.name,
            collectionId: 'col-active',
            addedAt: Date.now(),
            metadata: {
              regionId: getRegionIdByAge(daysAgo),
            },
          };
        })}
      />
    );
  },
};

// Story: Auto Assignment Test (tests automatic region creation and assignment)
// NO customRegions defined, NO regionId in memberships
// The CollectionMapPanel should automatically:
// 1. Create age-based regions on first render
// 2. Assign all repos to regions based on lastEditedAt
// 3. Persist regions and assignments via callbacks
export const AutoAssignmentTest: Story = {
  render: () => (
    <IntegrationHarness
      initialCollection={{
        id: 'col-auto',
        name: 'Auto Assignment Test',
        description: 'Tests automatic region creation and assignment',
        theme: 'industry',
        icon: 'Sparkles',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          // NO customRegions - should auto-create age-based regions
        },
      }}
      initialMemberships={mockRepositories.slice(0, 10).map((repo, idx) => ({
        id: `mem-${idx}`,
        repositoryId: repo.name,
        collectionId: 'col-auto',
        addedAt: Date.now(),
        metadata: {
          // NO regionId - should auto-assign based on age
        },
      }))}
    />
  ),
};

// Story: Collection with Custom Regions (user-defined organizational structure)
export const CustomRegionsOrganized: Story = {
  render: () => (
    <IntegrationHarness
      initialCollection={{
        id: 'col-manual',
        name: 'Organized Projects',
        description: 'Projects organized into custom regions',
        theme: 'industry',
        icon: 'FolderTree',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          customRegions: [
            {
              id: 'region-frontend',
              name: 'Frontend',
              description: 'Frontend applications and design systems',
              color: '#3b82f6',
              order: 0,
              createdAt: Date.now(),
            },
            {
              id: 'region-backend',
              name: 'Backend Services',
              description: 'API services and backend infrastructure',
              color: '#10b981',
              order: 1,
              createdAt: Date.now(),
            },
            {
              id: 'region-mobile',
              name: 'Mobile',
              description: 'Mobile applications',
              color: '#f59e0b',
              order: 2,
              createdAt: Date.now(),
            },
            {
              id: 'region-infrastructure',
              name: 'Infrastructure',
              description: 'DevOps and infrastructure code',
              color: '#8b5cf6',
              order: 3,
              createdAt: Date.now(),
            },
          ],
        },
      }}
      initialMemberships={[
        // Frontend
        {  repositoryId: 'active-frontend', collectionId: 'col-manual', addedAt: Date.now(), metadata: { regionId: 'region-frontend' } },
        {  repositoryId: 'old-frontend', collectionId: 'col-manual', addedAt: Date.now(), metadata: { regionId: 'region-frontend' } },
        {  repositoryId: 'design-system', collectionId: 'col-manual', addedAt: Date.now(), metadata: { regionId: 'region-frontend' } },
        // Backend
        {  repositoryId: 'api-service', collectionId: 'col-manual', addedAt: Date.now(), metadata: { regionId: 'region-backend' } },
        {  repositoryId: 'auth-service', collectionId: 'col-manual', addedAt: Date.now(), metadata: { regionId: 'region-backend' } },
        {  repositoryId: 'notification-service', collectionId: 'col-manual', addedAt: Date.now(), metadata: { regionId: 'region-backend' } },
        // Mobile
        {  repositoryId: 'mobile-app', collectionId: 'col-manual', addedAt: Date.now(), metadata: { regionId: 'region-mobile' } },
        // Infrastructure
        {  repositoryId: 'data-pipeline', collectionId: 'col-manual', addedAt: Date.now(), metadata: { regionId: 'region-infrastructure' } },
        {  repositoryId: 'deployment-scripts', collectionId: 'col-manual', addedAt: Date.now(), metadata: { regionId: 'region-infrastructure' } },
      ]}
    />
  ),
};

// Story: Empty Collection (will create default region when first repo is added)
export const EmptyCollection: Story = {
  render: () => (
    <IntegrationHarness
      initialCollection={{
        id: 'col-empty',
        name: 'New Collection',
        description: 'Empty collection - drag repos here to start',
        theme: 'industry',
        icon: 'Plus',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          customRegions: [], // Will auto-initialize with one region
        },
      }}
      initialMemberships={[]}
    />
  ),
};

// Story: Large Collection (demonstrates age-based region creation with many repos)
export const LargeCollection: Story = {
  render: () => (
    <IntegrationHarness
      initialCollection={{
        id: 'col-large',
        name: 'All Repositories',
        description: 'Complete repository collection',
        theme: 'industry',
        icon: 'Database',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
        },
      }}
      initialMemberships={mockRepositories.map((repo, idx) => ({
        id: `mem-${idx}`,
        repositoryId: repo.name,
        collectionId: 'col-large',
        addedAt: Date.now(),
        metadata: {},
      }))}
    />
  ),
};

// Story: Single Region - Test Region Adding
export const SingleRegionAddingTest: Story = {
  render: () => (
    <IntegrationHarness
      initialCollection={{
        id: 'col-single',
        name: 'Single Region Test',
        description: 'Start with one region, click Edit Regions to add more',
        theme: 'industry',
        icon: 'Grid',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          customRegions: [
            {
              id: 'region-main',
              name: 'Main',
              order: 0,
              createdAt: Date.now(),
            },
          ],
        },
      }}
      initialMemberships={mockRepositories.slice(0, 5).map((repo, idx) => ({
        id: `mem-${idx}`,
        repositoryId: repo.name,
        collectionId: 'col-single',
        addedAt: Date.now(),
        metadata: { regionId: 'region-main' },
      }))}
    />
  ),
};

// Story: Saved Positions - Test Loading from Saved State
export const SavedPositionsTest: Story = {
  render: () => (
    <IntegrationHarness
      initialCollection={{
        id: 'col-saved',
        name: 'Saved Positions Test',
        description: 'Repositories with pre-saved positions - drag to update positions',
        theme: 'industry',
        icon: 'Save',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          customRegions: [
            {
              id: 'region-frontend',
              name: 'Frontend',
              order: 0,
              createdAt: Date.now(),
            },
            {
              id: 'region-backend',
              name: 'Backend',
              order: 1,
              createdAt: Date.now(),
            },
          ],
        },
      }}
      initialMemberships={[
        // Frontend repositories with saved positions
        {
          repositoryId: mockRepositories[0].name, // web-ade
          collectionId: 'col-saved',
          addedAt: Date.now(),
          metadata: {
            regionId: 'region-frontend',
            layout: {
              gridX: 5,
              gridY: 5,
            },
          },
        },
        {
          repositoryId: mockRepositories[1].name, // shared-ui
          collectionId: 'col-saved',
          addedAt: Date.now(),
          metadata: {
            regionId: 'region-frontend',
            layout: {
              gridX: 10,
              gridY: 8,
            },
          },
        },
        {
          repositoryId: mockRepositories[2].name, // api-client
          collectionId: 'col-saved',
          addedAt: Date.now(),
          metadata: {
            regionId: 'region-frontend',
            layout: {
              gridX: 15,
              gridY: 5,
            },
          },
        },
        // Backend repositories with saved positions
        {
          repositoryId: mockRepositories[4].name, // backend-api
          collectionId: 'col-saved',
          addedAt: Date.now(),
          metadata: {
            regionId: 'region-backend',
            layout: {
              gridX: 8,
              gridY: 6,
            },
          },
        },
        {
          repositoryId: mockRepositories[5].name, // database
          collectionId: 'col-saved',
          addedAt: Date.now(),
          metadata: {
            regionId: 'region-backend',
            layout: {
              gridX: 12,
              gridY: 10,
            },
          },
        },
        // One auto-positioned repository (no saved position)
        {
          repositoryId: mockRepositories[9].name, // auth-service
          collectionId: 'col-saved',
          addedAt: Date.now(),
          metadata: {
            regionId: 'region-backend',
            // No layout - will use circle packing
          },
        },
      ]}
    />
  ),
};
