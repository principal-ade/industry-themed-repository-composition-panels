import React, { useState, useCallback, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  CollectionMapPanel,
  CollectionMapPanelActions,
  CollectionMapPanelContext,
} from './CollectionMapPanel';
import type { AlexandriaEntryWithMetrics } from './CollectionMapPanel';
import type {
  PanelComponentProps,
  RepositoryMetadata,
} from '@principal-ade/panel-framework-core';
import type {
  Collection,
  CollectionMembership,
  CustomRegion,
  RepositoryLayoutData,
} from '@principal-ai/alexandria-collections';
import type { AlexandriaEntry } from '@principal-ai/alexandria-core-library/types';
import type { PackageLayer } from '../types/composition';

// Browser-compatible EventEmitter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventListener = (...args: any[]) => void;

class SimpleEventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();

  on(event: string, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: EventListener) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
const createMockRepository = (
  name: string,
  language: string,
  fileCount: number,
  lineCount: number,
  daysAgo: number,
  stars: number = 0,
  collaborators: number = 0
) => ({
  name,
  path: `/Users/mock/${name}`,
  registeredAt: new Date(
    Date.now() - daysAgo * 24 * 60 * 60 * 1000
  ).toISOString(),
  lastEditedAt: new Date(
    Date.now() - daysAgo * 24 * 60 * 60 * 1000
  ).toISOString(),
  provider: {
    type: 'github' as const,
    url: `https://github.com/mock/${name}`,
  },
  github: {
    id: `mock/${name}`,
    primaryLanguage: language,
    stars,
    contributors: collaborators,
  },
  theme: language,
  metrics: {
    fileCount,
    lineCount,
    contributors: collaborators,
  },
});

const mockRepositories = [
  createMockRepository(
    'active-frontend',
    'typescript',
    450,
    25000,
    2,
    45000,
    180
  ), // Epic statue + Major Project gazebo
  createMockRepository('api-service', 'python', 120, 15000, 5, 12500, 85), // Famous statue + Community gazebo
  createMockRepository('mobile-app', 'kotlin', 380, 32000, 7, 7200, 42), // Renowned trophy + Large Team pavilion
  createMockRepository('data-pipeline', 'rust', 95, 12000, 10, 2500, 28), // Notable trophy + Large Team pavilion
  createMockRepository(
    'analytics-dashboard',
    'typescript',
    220,
    18000,
    15,
    850,
    15
  ), // Popular flag + Active Team pavilion
  createMockRepository('auth-service', 'go', 85, 8500, 20, 320, 8), // Growing flag + Small Team bench
  createMockRepository(
    'notification-service',
    'javascript',
    110,
    9200,
    25,
    75,
    5
  ), // New flag + Small Team bench
  createMockRepository('legacy-monolith', 'java', 1200, 95000, 45, 150000, 320), // Mythic statue + Open Source Hub bandstand
  createMockRepository('old-frontend', 'javascript', 340, 28000, 60, 3200, 18), // Notable trophy + Active Team pavilion
  createMockRepository('prototype-ml', 'python', 75, 6500, 90, 42, 3), // New flag + Solo bench
  createMockRepository('archived-experiment', 'ruby', 45, 3200, 180, 0, 1), // No star decoration + Solo bench
  createMockRepository(
    'design-system',
    'typescript',
    180,
    14000,
    8,
    600000,
    450
  ), // Celestial statue + Open Source Hub bandstand
  createMockRepository(
    'testing-framework',
    'typescript',
    95,
    7800,
    30,
    1200,
    22
  ), // Notable trophy + Active Team pavilion
  createMockRepository('deployment-scripts', 'shell', 25, 1500, 12, 250, 6), // Growing flag + Small Team bench
  createMockRepository('documentation', 'markdown', 60, 4500, 20, 18000, 95), // Famous statue + Community gazebo
];

// Create mock monorepo with packages
const createMockMonorepo = (
  name: string,
  language: string,
  daysAgo: number,
  packages: Array<{ name: string; fileCount: number; language?: string }>,
  stars: number = 0,
  collaborators: number = 0
) => {
  const mockPackages: PackageLayer[] = packages.map((pkg) => {
    const pkgLanguage = pkg.language || language;
    // Map language to package type
    const languageToType: Record<
      string,
      'node' | 'python' | 'cargo' | 'go' | 'package'
    > = {
      typescript: 'node',
      javascript: 'node',
      python: 'python',
      rust: 'cargo',
      go: 'go',
    };
    const pkgType = languageToType[pkgLanguage] || 'package';

    return {
      id: `${name}-${pkg.name}`,
      name: pkg.name,
      type: pkgType,
      enabled: true,
      derivedFrom: {
        fileSets: [
          {
            id: `${pkg.name}-files`,
            name: 'Source Files',
            patterns: [],
            fileCount: pkg.fileCount,
          },
        ],
        derivationType: 'presence' as const,
        description: 'Package files',
      },
      packageData: {
        name: pkg.name,
        path: `/Users/mock/${name}/packages/${pkg.name}`,
        manifestPath: `/Users/mock/${name}/packages/${pkg.name}/package.json`,
        packageManager: 'npm' as const,
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        isMonorepoRoot: false,
        isWorkspace: true,
      },
    };
  });

  const totalFileCount = packages.reduce((sum, pkg) => sum + pkg.fileCount, 0);

  return {
    name,
    path: `/Users/mock/${name}`,
    registeredAt: new Date(
      Date.now() - daysAgo * 24 * 60 * 60 * 1000
    ).toISOString(),
    lastEditedAt: new Date(
      Date.now() - daysAgo * 24 * 60 * 60 * 1000
    ).toISOString(),
    provider: {
      type: 'github' as const,
      url: `https://github.com/mock/${name}`,
    },
    github: {
      id: `mock/${name}`,
      primaryLanguage: language,
      stars,
      contributors: collaborators,
    },
    theme: language,
    metrics: {
      fileCount: totalFileCount,
      lineCount: totalFileCount * 50,
      contributors: collaborators,
    },
    packages: mockPackages,
  };
};

const mockMonorepos = [
  createMockMonorepo(
    'fullstack-app',
    'typescript',
    5,
    [
      { name: 'web', fileCount: 450, language: 'typescript' },
      { name: 'api', fileCount: 320, language: 'python' },
      { name: 'shared', fileCount: 180, language: 'typescript' },
    ],
    28000,
    120
  ), // Legendary statue + Major Project gazebo
  createMockMonorepo(
    'backend-services',
    'python',
    10,
    [
      { name: 'auth', fileCount: 220, language: 'rust' },
      { name: 'users', fileCount: 280, language: 'python' },
    ],
    4200,
    35
  ), // Notable trophy + Large Team pavilion
  createMockMonorepo(
    'mobile-suite',
    'typescript',
    15,
    [
      { name: 'ios', fileCount: 520, language: 'typescript' },
      { name: 'android', fileCount: 480, language: 'typescript' },
      { name: 'shared-components', fileCount: 150, language: 'rust' },
      { name: 'shared-utils', fileCount: 90, language: 'go' },
    ],
    125000,
    280
  ), // Mythic statue + Open Source Hub bandstand
];

// Integration Harness Component
const IntegrationHarness: React.FC<{
  initialCollection: Collection;
  initialMemberships: CollectionMembership[];
  initialRepositories?: AlexandriaEntryWithMetrics[];
}> = ({ initialCollection, initialMemberships, initialRepositories }) => {
  const [collection, setCollection] = useState(initialCollection);
  const [memberships, setMemberships] = useState(initialMemberships);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const logEvent = useCallback((message: string) => {
    setEventLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  }, []);

  // Create event emitter
  const eventEmitter = useMemo(() => new SimpleEventEmitter(), []);

  // Region management callbacks
  const onRegionCreated = useCallback(
    async (collectionId: string, region: Omit<CustomRegion, 'id'>) => {
      logEvent(`Creating region: ${region.name}`);

      // Generate deterministic ID from order (row-major: row * 10 + col)
      const row = Math.floor(region.order / 10);
      const col = region.order % 10;

      const newRegion: CustomRegion = {
        ...region,
        id: `region-${row}-${col}`,
      };

      setCollection((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          customRegions: [...(prev.metadata?.customRegions || []), newRegion],
        },
      }));

      eventEmitter.emit('industry-theme.user-collections:collection:updated', {
        collectionId,
        region: newRegion,
      });
      logEvent(`Region created: ${newRegion.id}`);

      return newRegion;
    },
    [logEvent, eventEmitter]
  );

  const onRegionUpdated = useCallback(
    async (
      collectionId: string,
      regionId: string,
      updates: Partial<CustomRegion>
    ) => {
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

      eventEmitter.emit('industry-theme.user-collections:collection:updated', {
        collectionId,
        regionId,
        updates,
      });
      logEvent(`Region updated: ${regionId}`);
    },
    [logEvent, eventEmitter]
  );

  const onRegionDeleted = useCallback(
    async (collectionId: string, regionId: string) => {
      logEvent(`Deleting region: ${regionId}`);

      setCollection((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          customRegions: prev.metadata?.customRegions?.filter(
            (r) => r.id !== regionId
          ),
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

      eventEmitter.emit('industry-theme.user-collections:collection:updated', {
        collectionId,
        regionId,
        deleted: true,
      });
      logEvent(`Region deleted: ${regionId}`);
    },
    [logEvent, eventEmitter]
  );

  const onRepositoryAssigned = useCallback(
    async (
      collectionId: string,
      repositoryId: string,
      regionId: string | null
    ) => {
      logEvent(
        `Assigning repository ${repositoryId} to region ${regionId || 'none'}`
      );

      setMemberships((prev) =>
        prev.map((m) =>
          m.repositoryId === repositoryId
            ? {
                ...m,
                metadata: regionId
                  ? { ...m.metadata, regionId }
                  : { ...m.metadata, regionId: undefined },
              }
            : m
        )
      );

      eventEmitter.emit(
        'industry-theme.user-collections:collection:repository-assigned',
        { collectionId, repositoryId, regionId }
      );
      logEvent(`Repository assigned: ${repositoryId} -> ${regionId || 'auto'}`);
    },
    [logEvent, eventEmitter]
  );

  const onRepositoryPositionUpdated = useCallback(
    async (
      collectionId: string,
      repositoryId: string,
      layout: RepositoryLayoutData
    ) => {
      logEvent(
        `Updating position for ${repositoryId}: (${layout.gridX}, ${layout.gridY})`
      );

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

      eventEmitter.emit(
        'industry-theme.user-collections:collection:repository-position-updated',
        { collectionId, repositoryId, layout }
      );
      logEvent(
        `Position saved: ${repositoryId} at (${layout.gridX}, ${layout.gridY})`
      );
    },
    [logEvent, eventEmitter]
  );

  const onBatchLayoutInitialized = useCallback(
    async (
      collectionId: string,
      updates: {
        regions?: CustomRegion[];
        assignments?: Array<{ repositoryId: string; regionId: string }>;
        positions?: Array<{
          repositoryId: string;
          layout: RepositoryLayoutData;
        }>;
      }
    ) => {
      logEvent(
        `Batch layout initialized: ${updates.regions?.length || 0} regions, ${updates.assignments?.length || 0} assignments, ${updates.positions?.length || 0} positions`
      );

      // Update collection with regions (if provided)
      if (updates.regions && updates.regions.length > 0) {
        setCollection((prev) => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            customRegions: [
              ...(prev.metadata?.customRegions || []),
              ...updates.regions!,
            ],
          },
        }));
      }

      // Update memberships with assignments and positions in ONE setState
      setMemberships((prev) =>
        prev.map((m) => {
          const assignment = updates.assignments?.find(
            (a) => a.repositoryId === m.repositoryId
          );
          const position = updates.positions?.find(
            (p) => p.repositoryId === m.repositoryId
          );

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

      eventEmitter.emit(
        'industry-theme.user-collections:collection:batch-layout-initialized',
        { collectionId, updates }
      );
      logEvent(`Batch layout complete`);
    },
    [logEvent, eventEmitter]
  );

  const onInitializeDefaultRegions = useCallback(
    async (collectionId: string, regions: CustomRegion[]) => {
      logEvent(`Initializing ${regions.length} default regions`);

      setCollection((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          customRegions: regions,
        },
      }));

      eventEmitter.emit('industry-theme.user-collections:collection:updated', {
        collectionId,
        regions,
      });
      logEvent(`Default regions initialized`);
    },
    [logEvent, eventEmitter]
  );

  // Mock context, actions, and events
  const mockProps: PanelComponentProps<
    CollectionMapPanelActions,
    CollectionMapPanelContext
  > = useMemo(
    () => ({
      context: {
        selectedCollection: collection,
        selectedCollectionView: {
          data: {
            collection,
            memberships,
            repositories: initialRepositories || mockRepositories,
            dependencies: {},
          },
          loading: false,
          error: null,
        },
        scope: {
          type: 'workspace',
          workspaceId: 'test-workspace',
        },
        refresh: async () => {
          logEvent('Context refresh requested');
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      actions: {
        onRegionCreated,
        onRegionUpdated,
        onRegionDeleted,
        onRepositoryAssigned,
        onRepositoryPositionUpdated,
        onInitializeDefaultRegions,
        onBatchLayoutInitialized,
        openRepository: async (entry: AlexandriaEntry) => {
          logEvent(`Opening repository: ${entry.name}`);
        },
        addRepositoryToCollection: async (
          collectionId: string,
          repositoryPath: string
        ) => {
          logEvent(`Adding repository to collection: ${repositoryPath}`);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events: eventEmitter as any,
    }),
    [
      collection,
      memberships,
      initialRepositories,
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
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
          Event Log:
        </div>
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
      { id: 'region-0-0', name: 'Last Month', order: 0, createdAt: 0 },
      { id: 'region-0-1', name: 'Last 3 Months', order: 1, createdAt: 0 },
      { id: 'region-0-2', name: 'Last Year', order: 2, createdAt: 0 },
      { id: 'region-0-3', name: 'Older', order: 3, createdAt: 0 },
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
          const daysAgo =
            (Date.now() - new Date(repo.lastEditedAt).getTime()) /
            (1000 * 60 * 60 * 24);
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
              id: 'region-0-0',
              name: 'Frontend',
              description: 'Frontend applications and design systems',
              color: '#3b82f6',
              order: 0,
              createdAt: 0,
            },
            {
              id: 'region-0-1',
              name: 'Backend Services',
              description: 'API services and backend infrastructure',
              color: '#10b981',
              order: 1,
              createdAt: 0,
            },
            {
              id: 'region-0-2',
              name: 'Mobile',
              description: 'Mobile applications',
              color: '#f59e0b',
              order: 2,
              createdAt: 0,
            },
            {
              id: 'region-0-3',
              name: 'Infrastructure',
              description: 'DevOps and infrastructure code',
              color: '#8b5cf6',
              order: 3,
              createdAt: 0,
            },
          ],
        },
      }}
      initialMemberships={[
        // Frontend
        {
          repositoryId: 'active-frontend',
          collectionId: 'col-manual',
          addedAt: Date.now(),
          metadata: { regionId: 'region-frontend' },
        },
        {
          repositoryId: 'old-frontend',
          collectionId: 'col-manual',
          addedAt: Date.now(),
          metadata: { regionId: 'region-frontend' },
        },
        {
          repositoryId: 'design-system',
          collectionId: 'col-manual',
          addedAt: Date.now(),
          metadata: { regionId: 'region-frontend' },
        },
        // Backend
        {
          repositoryId: 'api-service',
          collectionId: 'col-manual',
          addedAt: Date.now(),
          metadata: { regionId: 'region-backend' },
        },
        {
          repositoryId: 'auth-service',
          collectionId: 'col-manual',
          addedAt: Date.now(),
          metadata: { regionId: 'region-backend' },
        },
        {
          repositoryId: 'notification-service',
          collectionId: 'col-manual',
          addedAt: Date.now(),
          metadata: { regionId: 'region-backend' },
        },
        // Mobile
        {
          repositoryId: 'mobile-app',
          collectionId: 'col-manual',
          addedAt: Date.now(),
          metadata: { regionId: 'region-0-2' },
        },
        // Infrastructure
        {
          repositoryId: 'data-pipeline',
          collectionId: 'col-manual',
          addedAt: Date.now(),
          metadata: { regionId: 'region-0-3' },
        },
        {
          repositoryId: 'deployment-scripts',
          collectionId: 'col-manual',
          addedAt: Date.now(),
          metadata: { regionId: 'region-0-3' },
        },
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
        metadata: {},
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
              id: 'region-0-0',
              name: 'Main',
              order: 0,
              createdAt: 0,
            },
          ],
        },
      }}
      initialMemberships={mockRepositories.slice(0, 5).map((repo, idx) => ({
        id: `mem-${idx}`,
        repositoryId: repo.name,
        collectionId: 'col-single',
        addedAt: Date.now(),
        metadata: { regionId: 'region-0-0' },
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
        description:
          'Repositories with pre-saved positions - drag to update positions',
        theme: 'industry',
        icon: 'Save',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          customRegions: [
            {
              id: 'region-0-0',
              name: 'Frontend',
              order: 0,
              createdAt: 0,
            },
            {
              id: 'region-0-1',
              name: 'Backend',
              order: 1,
              createdAt: 0,
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
            regionId: 'region-0-0',
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
            regionId: 'region-0-0',
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
            regionId: 'region-0-0',
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
            regionId: 'region-0-1',
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
            regionId: 'region-0-1',
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
            regionId: 'region-0-1',
            // No layout - will use circle packing
          },
        },
      ]}
    />
  ),
};

/**
 * Drag & Drop Demo
 *
 * Demonstrates:
 * 1. Dragging repositories from external sidebar onto the map (seamless placement)
 * 2. Unplaced repositories drawer at bottom (repos without regionId)
 * 3. Dragging from drawer onto map to place them
 */
export const DragDropDemo: Story = {
  render: () => {
    const TestHarnessWithDragSource = () => {
      const [collection, setCollection] = useState<Collection>({
        id: 'col-dragdrop',
        name: 'Drag & Drop Test',
        description: 'Test collection for drag and drop',
        theme: 'industry',
        icon: 'Package',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          customRegions: [
            { id: 'region-0-0', name: 'Main', order: 0, createdAt: 0 },
          ],
        },
      });

      const [memberships, setMemberships] = useState<CollectionMembership[]>([
        // One placed repo
        {
          repositoryId: mockRepositories[0].name,
          collectionId: 'col-dragdrop',
          addedAt: Date.now(),
          metadata: {
            regionId: 'region-0-0',
            layout: { gridX: 10, gridY: 10 },
          },
        },
        // Two repos in staging (no regionId/layout)
        {
          repositoryId: mockRepositories[1].name,
          collectionId: 'col-dragdrop',
          addedAt: Date.now(),
          metadata: {},
        },
        {
          repositoryId: mockRepositories[2].name,
          collectionId: 'col-dragdrop',
          addedAt: Date.now(),
          metadata: {},
        },
      ]);

      const [eventLog, setEventLog] = useState<string[]>([]);

      const logEvent = useCallback((message: string) => {
        setEventLog((prev) => [
          ...prev.slice(-9),
          `${new Date().toLocaleTimeString()}: ${message}`,
        ]);
      }, []);

      // Only include repos not already in the collection
      const draggableProjects = [mockRepositories[3], mockRepositories[4]];

      const onRegionCreated = useCallback(
        async (collectionId: string, region: Omit<CustomRegion, 'id'>) => {
          logEvent(`Creating region: ${region.name}`);
          const row = Math.floor(region.order / 10);
          const col = region.order % 10;
          const newRegion: CustomRegion = {
            ...region,
            id: `region-${row}-${col}`,
          };
          setCollection((prev) => ({
            ...prev,
            metadata: {
              ...prev.metadata,
              customRegions: [
                ...(prev.metadata?.customRegions || []),
                newRegion,
              ],
            },
          }));
          return newRegion;
        },
        [logEvent]
      );

      const onRegionUpdated = useCallback(
        async (
          collectionId: string,
          regionId: string,
          updates: Partial<CustomRegion>
        ) => {
          logEvent(`Updating region: ${regionId}`);
          setCollection((prev) => ({
            ...prev,
            metadata: {
              ...prev.metadata,
              customRegions: prev.metadata?.customRegions?.map((r) =>
                r.id === regionId ? { ...r, ...updates } : r
              ),
            },
          }));
        },
        [logEvent]
      );

      const onRegionDeleted = useCallback(
        async (collectionId: string, regionId: string) => {
          logEvent(`Deleting region: ${regionId}`);
          setCollection((prev) => ({
            ...prev,
            metadata: {
              ...prev.metadata,
              customRegions: prev.metadata?.customRegions?.filter(
                (r) => r.id !== regionId
              ),
            },
          }));
        },
        [logEvent]
      );

      const onRepositoryAssigned = useCallback(
        async (
          collectionId: string,
          repositoryId: string,
          regionId: string
        ) => {
          logEvent(`Assigned ${repositoryId} → ${regionId}`);
          setMemberships((prev) =>
            prev.map((m) =>
              m.repositoryId === repositoryId
                ? { ...m, metadata: { ...m.metadata, regionId } }
                : m
            )
          );
        },
        [logEvent]
      );

      const onRepositoryPositionUpdated = useCallback(
        async (
          collectionId: string,
          repositoryId: string,
          layout: RepositoryLayoutData
        ) => {
          logEvent(
            `Position updated: ${repositoryId} → (${layout.gridX}, ${layout.gridY})`
          );
          setMemberships((prev) =>
            prev.map((m) =>
              m.repositoryId === repositoryId
                ? { ...m, metadata: { ...m.metadata, layout } }
                : m
            )
          );
        },
        [logEvent]
      );

      const onBatchLayoutInitialized = useCallback(
        async (
          collectionId: string,
          updates: {
            regions?: CustomRegion[];
            assignments?: Array<{ repositoryId: string; regionId: string }>;
            positions?: Array<{
              repositoryId: string;
              layout: RepositoryLayoutData;
            }>;
          }
        ) => {
          logEvent(
            `Batch init: ${updates.regions?.length || 0} regions, ${updates.positions?.length || 0} positions`
          );
          if (updates.regions) {
            setCollection((prev) => ({
              ...prev,
              metadata: { ...prev.metadata, customRegions: updates.regions },
            }));
          }
          if (updates.positions || updates.assignments) {
            setMemberships((prev) => {
              const updated = prev.map((m) => {
                const assignment = updates.assignments?.find(
                  (a) => a.repositoryId === m.repositoryId
                );
                const position = updates.positions?.find(
                  (p) => p.repositoryId === m.repositoryId
                );

                if (!assignment && !position) return m;

                return {
                  ...m,
                  metadata: {
                    ...m.metadata,
                    ...(assignment && { regionId: assignment.regionId }),
                    ...(position && { layout: position.layout }),
                  },
                };
              });
              return updated;
            });
          }
        },
        [logEvent]
      );

      const addRepositoryToCollection = useCallback(
        async (
          collectionId: string,
          repositoryPath: string,
          metadata: RepositoryMetadata
        ) => {
          logEvent(`Added repo: ${metadata?.name || repositoryPath}`);
          const newMembership: CollectionMembership = {
            repositoryId: metadata?.name || repositoryPath,
            collectionId: 'col-dragdrop',
            addedAt: Date.now(),
          };
          setMemberships((prev) => {
            const updated = [...prev, newMembership];
            return updated;
          });
        },
        [logEvent]
      );

      const eventEmitter = useMemo(() => new SimpleEventEmitter(), []);

      const panelProps = useMemo<
        PanelComponentProps<
          CollectionMapPanelActions,
          CollectionMapPanelContext
        >
      >(
        () => ({
          context: {
            selectedCollection: collection,
            selectedCollectionView: {
              data: {
                collection,
                memberships,
                repositories: mockRepositories,
                dependencies: {},
              },
              loading: false,
              error: null,
            },
            scope: { type: 'workspace', workspaceId: 'test-workspace' },
            refresh: async () => {},
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          actions: {
            onRegionCreated,
            onRegionUpdated,
            onRegionDeleted,
            onRepositoryAssigned,
            onRepositoryPositionUpdated,
            onBatchLayoutInitialized,
            addRepositoryToCollection,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          events: eventEmitter as any,
        }),
        [
          collection,
          memberships,
          onRegionCreated,
          onRegionUpdated,
          onRegionDeleted,
          onRepositoryAssigned,
          onRepositoryPositionUpdated,
          onBatchLayoutInitialized,
          addRepositoryToCollection,
          eventEmitter,
        ]
      );

      return (
        <div
          style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            backgroundColor: '#0a0a0f',
          }}
        >
          <div
            style={{
              width: '280px',
              flexShrink: 0,
              borderRight: '1px solid #333',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#1a1a2e',
            }}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid #333' }}>
              <h3
                style={{
                  color: '#fff',
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                📦 Draggable Repos
              </h3>
              <p
                style={{ color: '#888', fontSize: '11px', margin: '4px 0 0 0' }}
              >
                Drag onto map to add
              </p>
            </div>
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {draggableProjects.map((repo) => (
                <div
                  key={repo.name}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', repo.name);
                    e.dataTransfer.setData(
                      'application/x-panel-data',
                      JSON.stringify({
                        dataType: 'repository-project',
                        primaryData: repo.name,
                        metadata: {
                          name: repo.name,
                          lastEditedAt: repo.lastEditedAt,
                        },
                        sourcePanel: 'drag-source',
                      })
                    );
                  }}
                  style={{
                    padding: '10px',
                    backgroundColor: '#16213e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    cursor: 'grab',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e2a47';
                    e.currentTarget.style.borderColor = '#444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#16213e';
                    e.currentTarget.style.borderColor = '#333';
                  }}
                >
                  <div
                    style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}
                  >
                    {repo.name}
                  </div>
                  <div
                    style={{
                      color: '#888',
                      fontSize: '11px',
                      marginTop: '2px',
                    }}
                  >
                    {repo.provider?.type || 'local'}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                borderTop: '1px solid #333',
                padding: '12px',
                maxHeight: '200px',
                overflow: 'auto',
              }}
            >
              <div
                style={{
                  color: '#888',
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                EVENT LOG
              </div>
              {eventLog.length === 0 ? (
                <div
                  style={{
                    color: '#555',
                    fontSize: '10px',
                    fontStyle: 'italic',
                  }}
                >
                  No events yet
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '10px',
                    color: '#888',
                    fontFamily: 'monospace',
                  }}
                >
                  {eventLog.map((log, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <CollectionMapPanel {...panelProps} />
          </div>
        </div>
      );
    };

    return <TestHarnessWithDragSource />;
  },
};

// Story: Monorepo Packages (demonstrates package subdivision)
// Shows repositories with multiple packages rendered as clustered buildings
export const MonorepoPackages: Story = {
  render: () => (
    <IntegrationHarness
      initialCollection={{
        id: 'col-monorepos',
        name: 'Monorepo Collection',
        description: 'Repositories with multiple packages',
        theme: 'industry',
        icon: 'Layers',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          customRegions: [
            {
              id: 'region-0-0',
              name: 'Active Monorepos',
              order: 0,
              createdAt: 0,
            },
            {
              id: 'region-0-1',
              name: 'Single Repos',
              order: 1,
              createdAt: 0,
            },
          ],
        },
      }}
      initialMemberships={[
        // Monorepos with packages
        ...mockMonorepos.map((repo, idx) => ({
          id: `mem-mono-${idx}`,
          repositoryId: repo.github?.id || repo.name,
          collectionId: 'col-monorepos',
          addedAt: Date.now(),
          metadata: { regionId: 'region-0-0' },
        })),
        // Single repos for comparison
        ...mockRepositories.slice(0, 3).map((repo, idx) => ({
          id: `mem-single-${idx}`,
          repositoryId: repo.github?.id || repo.name,
          collectionId: 'col-monorepos',
          addedAt: Date.now(),
          metadata: { regionId: 'region-0-1' },
        })),
      ]}
      initialRepositories={
        [
          ...mockMonorepos,
          ...mockRepositories,
        ] as unknown as AlexandriaEntryWithMetrics[]
      }
    />
  ),
};
