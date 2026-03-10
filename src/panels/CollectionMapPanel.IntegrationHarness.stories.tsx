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
import {
  ConfigurablePanelLayout,
  type PanelDefinitionWithContent,
} from '@principal-ade/panels';
import type { Theme } from '@principal-ade/industry-theme';

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
  collaborators: number = 0,
  license: string = 'MIT'
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
    id: name,
    primaryLanguage: language,
    stars,
    contributors: collaborators,
    license,
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
    180,
    'MIT'
  ), // MIT - flower arch + open grass
  createMockRepository(
    'api-service',
    'python',
    120,
    15000,
    5,
    12500,
    85,
    'Apache-2.0'
  ), // Apache - posts + cobblestone
  createMockRepository('mobile-app', 'kotlin', 380, 32000, 7, 7200, 42, 'MIT'), // MIT
  createMockRepository(
    'data-pipeline',
    'rust',
    95,
    12000,
    10,
    2500,
    28,
    'GPL-3.0'
  ), // GPL - iron arch + picket fence
  createMockRepository(
    'analytics-dashboard',
    'typescript',
    220,
    18000,
    15,
    850,
    15,
    'MIT'
  ), // MIT
  createMockRepository(
    'auth-service',
    'go',
    85,
    8500,
    20,
    320,
    8,
    'Apache-2.0'
  ), // Apache
  createMockRepository(
    'notification-service',
    'javascript',
    110,
    9200,
    25,
    75,
    5,
    'BSD'
  ), // BSD (uses MIT style)
  createMockRepository(
    'legacy-monolith',
    'java',
    1200,
    95000,
    45,
    150000,
    320,
    'GPL-3.0'
  ), // GPL
  createMockRepository(
    'old-frontend',
    'javascript',
    340,
    28000,
    60,
    3200,
    18,
    'MIT'
  ), // MIT
  createMockRepository(
    'prototype-ml',
    'python',
    75,
    6500,
    90,
    42,
    3,
    'Apache-2.0'
  ), // Apache
  createMockRepository(
    'archived-experiment',
    'ruby',
    45,
    3200,
    180,
    0,
    1,
    'MIT'
  ), // MIT
  createMockRepository(
    'design-system',
    'typescript',
    180,
    14000,
    8,
    600000,
    450,
    'MIT'
  ), // MIT
  createMockRepository(
    'testing-framework',
    'typescript',
    95,
    7800,
    30,
    1200,
    22,
    'GPL-3.0'
  ), // GPL
  createMockRepository(
    'deployment-scripts',
    'shell',
    25,
    1500,
    12,
    250,
    6,
    'Apache-2.0'
  ), // Apache
  createMockRepository(
    'documentation',
    'markdown',
    60,
    4500,
    20,
    18000,
    95,
    'MIT'
  ), // MIT
];

// Create mock monorepo with packages
const createMockMonorepo = (
  name: string,
  language: string,
  daysAgo: number,
  packages: Array<{ name: string; fileCount: number; language?: string }>,
  stars: number = 0,
  collaborators: number = 0,
  license: string = 'MIT'
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
      id: name,
      primaryLanguage: language,
      stars,
      contributors: collaborators,
      license,
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
    120,
    'MIT'
  ), // MIT - flower arch + open grass
  createMockMonorepo(
    'backend-services',
    'python',
    10,
    [
      { name: 'auth', fileCount: 220, language: 'rust' },
      { name: 'users', fileCount: 280, language: 'python' },
    ],
    4200,
    35,
    'Apache-2.0'
  ), // Apache - posts + cobblestone
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
    280,
    'GPL-3.0'
  ), // GPL - iron arch + picket fence
  createMockMonorepo(
    'enterprise-platform',
    'typescript',
    3,
    [
      // UI packages
      { name: 'ui-components', fileCount: 850, language: 'typescript' },
      { name: 'ui-icons', fileCount: 120, language: 'typescript' },
      { name: 'ui-themes', fileCount: 95, language: 'typescript' },
      { name: 'ui-hooks', fileCount: 180, language: 'typescript' },
      // Core packages
      { name: 'core-auth', fileCount: 320, language: 'typescript' },
      { name: 'core-api', fileCount: 450, language: 'typescript' },
      { name: 'core-state', fileCount: 280, language: 'typescript' },
      { name: 'core-utils', fileCount: 150, language: 'typescript' },
      // Feature packages
      { name: 'feature-dashboard', fileCount: 520, language: 'typescript' },
      { name: 'feature-analytics', fileCount: 380, language: 'typescript' },
      { name: 'feature-settings', fileCount: 240, language: 'typescript' },
      { name: 'feature-users', fileCount: 290, language: 'typescript' },
      // Backend packages
      { name: 'server-gateway', fileCount: 420, language: 'go' },
      { name: 'server-workers', fileCount: 350, language: 'rust' },
      { name: 'server-scheduler', fileCount: 180, language: 'python' },
      // Infrastructure packages
      { name: 'infra-database', fileCount: 220, language: 'typescript' },
      { name: 'infra-cache', fileCount: 140, language: 'rust' },
      { name: 'infra-logging', fileCount: 160, language: 'go' },
      // Testing packages
      { name: 'test-utils', fileCount: 280, language: 'typescript' },
      { name: 'test-fixtures', fileCount: 190, language: 'typescript' },
    ],
    85000,
    450,
    'MIT'
  ), // MIT - Large enterprise monorepo
];

// Integration Harness Component
const IntegrationHarness: React.FC<{
  initialCollection: Collection;
  initialMemberships: CollectionMembership[];
  initialRepositories?: AlexandriaEntryWithMetrics[];
  /** Simulate async save delay (in ms) to test race conditions */
  asyncSaveDelay?: number;
  /** If true, state updates AFTER delay (buggy). If false, state updates BEFORE delay (fixed). */
  delayBeforeStateUpdate?: boolean;
}> = ({
  initialCollection,
  initialMemberships,
  initialRepositories,
  asyncSaveDelay = 0,
  delayBeforeStateUpdate = false,
}) => {
  // Merge initial memberships into collection.members
  const [collection, setCollection] = useState<Collection>(() => ({
    ...initialCollection,
    members: initialMemberships,
  }));
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

      // Remove region assignments from members
      setCollection((prev) => ({
        ...prev,
        members: prev.members.map((m) => {
          if (m.metadata?.regionId === regionId) {
            const { regionId: _, ...restMetadata } = m.metadata;
            return { ...m, metadata: restMetadata };
          }
          return m;
        }),
      }));

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

      setCollection((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.repositoryId === repositoryId
            ? {
                ...m,
                metadata: regionId
                  ? { ...m.metadata, regionId }
                  : { ...m.metadata, regionId: undefined },
              }
            : m
        ),
      }));

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

      const updateState = () => {
        setCollection((prev) => ({
          ...prev,
          members: prev.members.map((m) =>
            m.repositoryId === repositoryId
              ? {
                  ...m,
                  metadata: { ...m.metadata, layout },
                }
              : m
          ),
        }));
      };

      const simulateSave = async () => {
        if (asyncSaveDelay > 0) {
          logEvent(`Simulating async save (${asyncSaveDelay}ms)...`);
          await new Promise((resolve) => setTimeout(resolve, asyncSaveDelay));
          logEvent(`Async save complete`);
        }
      };

      if (delayBeforeStateUpdate && asyncSaveDelay > 0) {
        // BUGGY: State updates AFTER async save - causes snap-back
        logEvent(`⚠️ BUG MODE: Delaying state update until after save`);
        await simulateSave();
        updateState();
      } else {
        // FIXED: State updates immediately (optimistic), save in background
        updateState();
        await simulateSave();
      }

      eventEmitter.emit(
        'industry-theme.user-collections:collection:repository-position-updated',
        { collectionId, repositoryId, layout }
      );
      logEvent(
        `Position saved: ${repositoryId} at (${layout.gridX}, ${layout.gridY})`
      );
    },
    [logEvent, eventEmitter, asyncSaveDelay, delayBeforeStateUpdate]
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

      // Update collection with regions AND member updates in ONE setState
      setCollection((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          ...(updates.regions &&
            updates.regions.length > 0 && {
              customRegions: [
                ...(prev.metadata?.customRegions || []),
                ...updates.regions,
              ],
            }),
        },
        members: prev.members.map((m) => {
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
        }),
      }));

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
          members: [],
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
        members: [],
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
        members: [],
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
        members: [],
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
        members: [],
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
        members: [],
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
        members: [],
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
        members: [
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
        ],
        metadata: {
          customRegions: [
            { id: 'region-0-0', name: 'Main', order: 0, createdAt: 0 },
          ],
        },
      });

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
          setCollection((prev) => ({
            ...prev,
            members: prev.members.map((m) =>
              m.repositoryId === repositoryId
                ? { ...m, metadata: { ...m.metadata, regionId } }
                : m
            ),
          }));
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
          setCollection((prev) => ({
            ...prev,
            members: prev.members.map((m) =>
              m.repositoryId === repositoryId
                ? { ...m, metadata: { ...m.metadata, layout } }
                : m
            ),
          }));
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
          setCollection((prev) => ({
            ...prev,
            ...(updates.regions && {
              metadata: { ...prev.metadata, customRegions: updates.regions },
            }),
            members: prev.members.map((m) => {
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
            }),
          }));
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
            metadata: {
              regionId: (metadata?.regionId as string) || undefined,
              layout: (metadata?.layout as RepositoryLayoutData) || undefined,
            },
          };
          setCollection((prev) => ({
            ...prev,
            members: [...prev.members, newMembership],
          }));
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
        members: [],
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

/**
 * Demonstrates the snap-back BUG when state updates are delayed.
 *
 * This simulates the old behavior where state updates happened AFTER
 * the async GitHub save completed, causing the sprite to snap back
 * to its original position before jumping to the correct position.
 *
 * Try dragging a sprite - you'll see it snap back briefly.
 */
export const AsyncDelayBugDemo: StoryObj<typeof meta> = {
  render: () => (
    <IntegrationHarness
      initialCollection={{
        id: 'col-bug-demo',
        name: 'Bug Demo Collection',
        description: 'Demonstrates the snap-back bug',
        theme: 'industry',
        icon: 'Bug',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        members: [],
        metadata: {
          customRegions: [
            {
              id: 'region-0-0',
              name: 'Test Region',
              order: 0,
              createdAt: Date.now(),
            },
          ],
        },
      }}
      initialMemberships={mockRepositories.slice(0, 3).map((repo, i) => ({
        collectionId: 'col-bug-demo',
        repositoryId: repo.path,
        addedAt: Date.now(),
        metadata: {
          regionId: 'region-0-0',
          layout: { gridX: 2 + i * 3, gridY: 2 },
        },
      }))}
      initialRepositories={
        mockRepositories.slice(0, 3) as unknown as AlexandriaEntryWithMetrics[]
      }
      asyncSaveDelay={1500}
      delayBeforeStateUpdate={true}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          '⚠️ **BUG DEMO**: Shows the snap-back issue when state updates are delayed. Drag a sprite and watch it snap back before moving to correct position.',
      },
    },
  },
};

/**
 * Demonstrates the FIX with optimistic state updates.
 *
 * This simulates the fixed behavior where state updates happen
 * IMMEDIATELY (optimistic update) and the async save happens
 * in the background. The sprite stays in place smoothly.
 *
 * Try dragging a sprite - it should stay in place.
 */
export const AsyncDelayFixDemo: StoryObj<typeof meta> = {
  render: () => (
    <IntegrationHarness
      initialCollection={{
        id: 'col-fix-demo',
        name: 'Fix Demo Collection',
        description: 'Demonstrates the optimistic update fix',
        theme: 'industry',
        icon: 'Check',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        members: [],
        metadata: {
          customRegions: [
            {
              id: 'region-0-0',
              name: 'Test Region',
              order: 0,
              createdAt: Date.now(),
            },
          ],
        },
      }}
      initialMemberships={mockRepositories.slice(0, 3).map((repo, i) => ({
        collectionId: 'col-fix-demo',
        repositoryId: repo.path,
        addedAt: Date.now(),
        metadata: {
          regionId: 'region-0-0',
          layout: { gridX: 2 + i * 3, gridY: 2 },
        },
      }))}
      initialRepositories={
        mockRepositories.slice(0, 3) as unknown as AlexandriaEntryWithMetrics[]
      }
      asyncSaveDelay={1500}
      delayBeforeStateUpdate={false}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          '✅ **FIX DEMO**: Shows the optimistic update fix. Drag a sprite and it stays in place smoothly while the async save happens in the background.',
      },
    },
  },
};

// Mock theme for three-panel layout (dark theme)
const mockTheme: Theme = {
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    monospace:
      '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 96],
  fontWeights: {
    body: 400,
    heading: 700,
    bold: 700,
    light: 300,
    medium: 500,
    semibold: 600,
  },
  lineHeights: {
    body: 1.5,
    heading: 1.25,
    tight: 1.25,
    relaxed: 1.75,
  },
  breakpoints: ['40em', '52em', '64em'],
  sizes: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  radii: [0, 2, 4, 8, 16],
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.12)',
    '0 4px 6px rgba(0,0,0,0.1)',
    '0 10px 20px rgba(0,0,0,0.15)',
  ],
  zIndices: [0, 10, 20, 30, 40, 50],
  colors: {
    text: '#e4e4e7',
    background: '#1a1a2e',
    primary: '#e94560',
    secondary: '#0f3460',
    accent: '#00d9ff',
    highlight: '#fbd38d',
    muted: '#374151',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#4299e1',
    border: '#0f3460',
    backgroundSecondary: '#16213e',
    backgroundTertiary: '#1f2b4a',
    backgroundLight: '#16213e',
    backgroundHover: '#1f2b4a',
    surface: '#16213e',
    textSecondary: '#a1a1aa',
    textTertiary: '#71717a',
    textMuted: '#52525b',
    highlightBg: '#1f2937',
    highlightBorder: '#374151',
    textOnPrimary: '#ffffff',
  },
  buttons: {
    primary: {
      color: '#ffffff',
      backgroundColor: '#e94560',
      padding: '8px 16px',
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      '&:hover': { backgroundColor: '#ff6b6b' },
    },
    secondary: {
      color: '#e4e4e7',
      backgroundColor: '#0f3460',
      padding: '8px 16px',
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      '&:hover': { backgroundColor: '#1a4a7a' },
    },
    ghost: {
      color: '#00d9ff',
      backgroundColor: 'transparent',
      padding: '8px 16px',
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      '&:hover': { backgroundColor: '#1f2b4a' },
    },
  },
  text: {
    heading: {
      fontSize: 24,
      fontWeight: 700,
      lineHeight: 1.25,
      color: '#e4e4e7',
    },
    body: { fontSize: 16, fontWeight: 400, lineHeight: 1.5, color: '#e4e4e7' },
    caption: {
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#a1a1aa',
    },
  },
  cards: {
    primary: {
      padding: 16,
      backgroundColor: '#16213e',
      borderRadius: 8,
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    },
    secondary: {
      padding: 16,
      backgroundColor: '#1f2b4a',
      borderRadius: 8,
      border: '1px solid #0f3460',
    },
  },
};

// Placeholder panel components for three-panel layout
const LeftPanelContent: React.FC = () => (
  <div
    style={{
      padding: 16,
      color: '#e4e4e7',
      height: '100%',
      backgroundColor: '#16213e',
    }}
  >
    <h3 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 600 }}>
      Navigation
    </h3>
    <p style={{ color: '#a1a1aa', fontSize: 12 }}>
      This simulates the web-ade navigation panel.
    </p>
    <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0' }}>
      <li
        style={{
          padding: '8px 0',
          borderBottom: '1px solid #0f3460',
          fontSize: 13,
        }}
      >
        Collections
      </li>
      <li
        style={{
          padding: '8px 0',
          borderBottom: '1px solid #0f3460',
          fontSize: 13,
        }}
      >
        Repositories
      </li>
      <li
        style={{
          padding: '8px 0',
          borderBottom: '1px solid #0f3460',
          fontSize: 13,
        }}
      >
        Settings
      </li>
    </ul>
  </div>
);

const RightPanelContent: React.FC = () => (
  <div
    style={{
      padding: 16,
      color: '#e4e4e7',
      height: '100%',
      backgroundColor: '#16213e',
    }}
  >
    <h3 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 600 }}>
      Details
    </h3>
    <p style={{ color: '#a1a1aa', fontSize: 12 }}>
      This simulates the web-ade details panel.
    </p>
    <div
      style={{
        marginTop: 16,
        padding: 12,
        backgroundColor: '#1a1a2e',
        borderRadius: 8,
      }}
    >
      <div style={{ marginBottom: 8, fontSize: 12 }}>
        <span style={{ color: '#a1a1aa' }}>Selected: </span>
        <span>None</span>
      </div>
    </div>
  </div>
);

/**
 * Three-Panel Layout Test
 *
 * Tests the CollectionMapPanel in a three-panel layout (like web-ade).
 * This verifies that usePanelBounds correctly calculates the panel offset
 * so the viewport-sized canvas renders at the correct position.
 *
 * The map should fill the middle panel correctly without overflow issues.
 */
// Pre-defined collections for the collection switcher
const switchableCollections: Record<
  string,
  {
    collection: Omit<Collection, 'members'>;
    memberships: CollectionMembership[];
    repositories?: AlexandriaEntryWithMetrics[];
  }
> = {
  'active-projects': {
    collection: {
      id: 'col-active',
      name: 'Active Projects',
      description: 'Currently active development projects',
      theme: 'industry',
      icon: 'Zap',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        customRegions: [
          { id: 'region-0-0', name: 'Last Month', order: 0, createdAt: 0 },
          { id: 'region-0-1', name: 'Last 3 Months', order: 1, createdAt: 0 },
          { id: 'region-0-2', name: 'Last Year', order: 2, createdAt: 0 },
          { id: 'region-0-3', name: 'Older', order: 3, createdAt: 0 },
        ],
      },
    },
    memberships: mockRepositories.slice(0, 10).map((repo, idx) => ({
      repositoryId: repo.name,
      collectionId: 'col-active',
      addedAt: Date.now(),
      metadata: {
        regionId: `region-0-${Math.min(Math.floor(idx / 3), 3)}`,
      },
    })),
  },
  monorepos: {
    collection: {
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
          { id: 'region-0-1', name: 'Single Repos', order: 1, createdAt: 0 },
        ],
      },
    },
    memberships: [
      ...mockMonorepos.map((repo, idx) => ({
        repositoryId: repo.github?.id || repo.name,
        collectionId: 'col-monorepos',
        addedAt: Date.now(),
        metadata: { regionId: 'region-0-0' },
      })),
      ...mockRepositories.slice(0, 3).map((repo, idx) => ({
        repositoryId: repo.github?.id || repo.name,
        collectionId: 'col-monorepos',
        addedAt: Date.now(),
        metadata: { regionId: 'region-0-1' },
      })),
    ],
    repositories: [
      ...mockMonorepos,
      ...mockRepositories,
    ] as unknown as AlexandriaEntryWithMetrics[],
  },
  'custom-regions': {
    collection: {
      id: 'col-custom',
      name: 'Organized by Team',
      description: 'Projects organized by team ownership',
      theme: 'industry',
      icon: 'Users',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        customRegions: [
          {
            id: 'region-0-0',
            name: 'Frontend Team',
            color: '#3b82f6',
            order: 0,
            createdAt: 0,
          },
          {
            id: 'region-0-1',
            name: 'Backend Team',
            color: '#10b981',
            order: 1,
            createdAt: 0,
          },
          {
            id: 'region-0-2',
            name: 'Platform Team',
            color: '#f59e0b',
            order: 2,
            createdAt: 0,
          },
          {
            id: 'region-0-3',
            name: 'Data Team',
            color: '#8b5cf6',
            order: 3,
            createdAt: 0,
          },
        ],
      },
    },
    memberships: [
      // Frontend
      {
        repositoryId: 'active-frontend',
        collectionId: 'col-custom',
        addedAt: Date.now(),
        metadata: { regionId: 'region-0-0' },
      },
      {
        repositoryId: 'design-system',
        collectionId: 'col-custom',
        addedAt: Date.now(),
        metadata: { regionId: 'region-0-0' },
      },
      {
        repositoryId: 'old-frontend',
        collectionId: 'col-custom',
        addedAt: Date.now(),
        metadata: { regionId: 'region-0-0' },
      },
      // Backend
      {
        repositoryId: 'api-service',
        collectionId: 'col-custom',
        addedAt: Date.now(),
        metadata: { regionId: 'region-0-1' },
      },
      {
        repositoryId: 'auth-service',
        collectionId: 'col-custom',
        addedAt: Date.now(),
        metadata: { regionId: 'region-0-1' },
      },
      {
        repositoryId: 'notification-service',
        collectionId: 'col-custom',
        addedAt: Date.now(),
        metadata: { regionId: 'region-0-1' },
      },
      // Platform
      {
        repositoryId: 'deployment-scripts',
        collectionId: 'col-custom',
        addedAt: Date.now(),
        metadata: { regionId: 'region-0-2' },
      },
      {
        repositoryId: 'testing-framework',
        collectionId: 'col-custom',
        addedAt: Date.now(),
        metadata: { regionId: 'region-0-2' },
      },
      // Data
      {
        repositoryId: 'data-pipeline',
        collectionId: 'col-custom',
        addedAt: Date.now(),
        metadata: { regionId: 'region-0-3' },
      },
      {
        repositoryId: 'analytics-dashboard',
        collectionId: 'col-custom',
        addedAt: Date.now(),
        metadata: { regionId: 'region-0-3' },
      },
    ],
  },
  empty: {
    collection: {
      id: 'col-empty',
      name: 'Empty Collection',
      description: 'A collection with no repositories',
      theme: 'industry',
      icon: 'FolderOpen',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        customRegions: [],
      },
    },
    memberships: [],
  },
  'single-region': {
    collection: {
      id: 'col-single',
      name: 'Single Region',
      description: 'All repos in one region',
      theme: 'industry',
      icon: 'Box',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        customRegions: [
          { id: 'region-0-0', name: 'All Projects', order: 0, createdAt: 0 },
        ],
      },
    },
    memberships: mockRepositories.slice(0, 8).map((repo) => ({
      repositoryId: repo.name,
      collectionId: 'col-single',
      addedAt: Date.now(),
      metadata: { regionId: 'region-0-0' },
    })),
  },
};

/**
 * Collection Switcher
 *
 * A story that allows switching between different collections using Storybook controls.
 * Use this to test how the map behaves when the collection changes.
 */
export const CollectionSwitcher: StoryObj<{ collection: string }> = {
  render: (args) => {
    const selectedKey = args.collection as keyof typeof switchableCollections;
    const config =
      switchableCollections[selectedKey] ||
      switchableCollections['active-projects'];

    return (
      <IntegrationHarness
        key={selectedKey} // Force re-mount when collection changes
        initialCollection={{
          ...config.collection,
          members: [],
        }}
        initialMemberships={config.memberships}
        initialRepositories={config.repositories}
      />
    );
  },
  args: {
    collection: 'active-projects',
  },
  argTypes: {
    collection: {
      control: 'select',
      options: Object.keys(switchableCollections),
      description: 'Select a collection to display',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'active-projects' },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use the controls panel to switch between different collections. This tests how the map handles collection changes.',
      },
    },
  },
};

/**
 * Two-Phase Loading Test
 *
 * Tests the scenario where:
 * 1. Repositories load initially WITHOUT file metrics (fileCount=0, lineCount=0)
 * 2. After a delay, file tree scan completes and metrics are updated
 *
 * This tests whether the UI properly updates when file metrics arrive.
 * Watch the telemetry for:
 * - collection-map.initial-load-no-metrics (phase 1)
 * - collection-map.file-metrics-arrived (phase 2)
 * - collection-map.nodes-memo-recalc with trigger.metrics.changed=true
 */
export const TwoPhaseLoadingTest: Story = {
  render: () => {
    const TwoPhaseHarness = () => {
      // Mix of regular repos and monorepos, all starting with NO file metrics
      const initialRepos = [
        ...mockRepositories.slice(0, 3),
        ...mockMonorepos.slice(0, 3),
      ];

      // Start with repos that have NO file metrics
      const [repositories, setRepositories] = useState<
        AlexandriaEntryWithMetrics[]
      >(
        () =>
          initialRepos.map((repo) => ({
            ...repo,
            metrics: {
              fileCount: 0,
              lineCount: 0,
              contributors: repo.metrics?.contributors || 0,
              lastEditedAt: repo.lastEditedAt,
            },
            // Strip packages temporarily - they'll come with metrics
            packages: undefined,
          })) as unknown as AlexandriaEntryWithMetrics[]
      );

      const [phase, setPhase] = useState<'initial' | 'loading' | 'complete'>(
        'initial'
      );
      const [eventLog, setEventLog] = useState<string[]>([]);

      const logEvent = useCallback((message: string) => {
        setEventLog((prev) => [
          ...prev.slice(-19),
          `${new Date().toLocaleTimeString()}: ${message}`,
        ]);
      }, []);

      // Simulate file tree scan completing after delay
      const simulateFileTreeScan = useCallback(() => {
        setPhase('loading');
        logEvent('Starting file tree scan simulation...');

        setTimeout(() => {
          logEvent('File tree scan complete - updating metrics');

          // Update repositories with real file metrics AND restore packages for monorepos
          setRepositories((prev) =>
            prev.map((repo, idx) => {
              // Find original repo from either mockRepositories or mockMonorepos
              const originalRepo =
                idx < 3 ? mockRepositories[idx] : mockMonorepos[idx - 3];

              // Check if this is a monorepo (has packages)
              const isMonorepo =
                'packages' in originalRepo && originalRepo.packages;

              return {
                ...repo,
                metrics: {
                  fileCount: originalRepo.metrics?.fileCount || 100 + idx * 50,
                  lineCount:
                    originalRepo.metrics?.lineCount || 5000 + idx * 2000,
                  contributors: originalRepo.metrics?.contributors || 5,
                  lastEditedAt: originalRepo.lastEditedAt,
                },
                // Restore packages for monorepos
                ...(isMonorepo ? { packages: originalRepo.packages } : {}),
              } as AlexandriaEntryWithMetrics;
            })
          );

          setPhase('complete');
          logEvent('Metrics updated - UI should reflect new sizes');
        }, 2000);
      }, [logEvent]);

      const [collection, setCollection] = useState<Collection>({
        id: 'col-two-phase',
        name: 'Two-Phase Loading Test',
        description: 'Tests file metrics arriving after initial load',
        theme: 'industry',
        icon: 'RefreshCw',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        members: [
          // Regular repos
          ...mockRepositories.slice(0, 3).map((repo) => ({
            repositoryId: repo.github?.id || repo.name,
            collectionId: 'col-two-phase',
            addedAt: Date.now(),
            metadata: { regionId: 'region-0-0' },
          })),
          // Monorepos
          ...mockMonorepos.slice(0, 3).map((repo) => ({
            repositoryId: repo.github?.id || repo.name,
            collectionId: 'col-two-phase',
            addedAt: Date.now(),
            metadata: { regionId: 'region-0-0' },
          })),
        ],
        metadata: {
          customRegions: [
            { id: 'region-0-0', name: 'Test Region', order: 0, createdAt: 0 },
          ],
        },
      });

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
                repositories, // This will update when metrics arrive
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
            onRegionCreated: async (
              _collectionId: string,
              region: Omit<CustomRegion, 'id'>
            ) => {
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
            onRegionUpdated: async () => {},
            onRegionDeleted: async () => {},
            onRepositoryAssigned: async (
              _collectionId: string,
              repositoryId: string,
              regionId: string
            ) => {
              logEvent(`Assigned ${repositoryId} -> ${regionId}`);
              setCollection((prev) => ({
                ...prev,
                members: prev.members.map((m) =>
                  m.repositoryId === repositoryId
                    ? { ...m, metadata: { ...m.metadata, regionId } }
                    : m
                ),
              }));
            },
            onRepositoryPositionUpdated: async (
              _collectionId: string,
              repositoryId: string,
              layout: RepositoryLayoutData
            ) => {
              logEvent(
                `Position ${repositoryId}: (${layout.gridX}, ${layout.gridY})`
              );
              setCollection((prev) => ({
                ...prev,
                members: prev.members.map((m) =>
                  m.repositoryId === repositoryId
                    ? { ...m, metadata: { ...m.metadata, layout } }
                    : m
                ),
              }));
            },
            onBatchLayoutInitialized: async (
              _collectionId: string,
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
                `Batch init: ${updates.positions?.length || 0} positions`
              );
              setCollection((prev) => ({
                ...prev,
                metadata: {
                  ...prev.metadata,
                  ...(updates.regions && { customRegions: updates.regions }),
                },
                members: prev.members.map((m) => {
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
                }),
              }));
            },
            addRepositoryToCollection: async () => {},
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          events: eventEmitter as any,
        }),
        [collection, repositories, eventEmitter, logEvent]
      );

      // Calculate current metrics totals for display
      const totalFiles = repositories.reduce(
        (sum, r) => sum + (r.metrics?.fileCount || 0),
        0
      );
      const totalLines = repositories.reduce(
        (sum, r) => sum + (r.metrics?.lineCount || 0),
        0
      );

      return (
        <div
          style={{
            display: 'flex',
            height: '100vh',
            backgroundColor: '#0a0a0f',
          }}
        >
          {/* Control Panel */}
          <div
            style={{
              width: '300px',
              flexShrink: 0,
              borderRight: '1px solid #333',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#1a1a2e',
              padding: '16px',
            }}
          >
            <h3
              style={{ color: '#fff', margin: '0 0 16px 0', fontSize: '14px' }}
            >
              Two-Phase Loading Test
            </h3>

            {/* Status */}
            <div
              style={{
                padding: '12px',
                backgroundColor: phase === 'complete' ? '#052e16' : '#1e1e3f',
                borderRadius: '8px',
                marginBottom: '16px',
                border: `1px solid ${phase === 'complete' ? '#166534' : '#333'}`,
              }}
            >
              <div
                style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}
              >
                Current Phase
              </div>
              <div
                style={{
                  color: phase === 'complete' ? '#4ade80' : '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {phase === 'initial' && 'Initial Load (no metrics)'}
                {phase === 'loading' && 'Scanning file tree...'}
                {phase === 'complete' && 'Metrics loaded'}
              </div>
            </div>

            {/* Metrics Display */}
            <div
              style={{
                padding: '12px',
                backgroundColor: '#16213e',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{ color: '#888', fontSize: '11px', marginBottom: '8px' }}
              >
                Current Metrics
              </div>
              <div style={{ color: '#fff', fontSize: '13px' }}>
                <div>
                  Total Files:{' '}
                  <span
                    style={{ color: totalFiles > 0 ? '#4ade80' : '#f87171' }}
                  >
                    {totalFiles}
                  </span>
                </div>
                <div>
                  Total Lines:{' '}
                  <span
                    style={{ color: totalLines > 0 ? '#4ade80' : '#f87171' }}
                  >
                    {totalLines}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={simulateFileTreeScan}
              disabled={phase !== 'initial'}
              style={{
                padding: '12px 16px',
                backgroundColor: phase === 'initial' ? '#3b82f6' : '#374151',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: phase === 'initial' ? 'pointer' : 'not-allowed',
                marginBottom: '16px',
              }}
            >
              {phase === 'initial' && 'Simulate File Tree Scan'}
              {phase === 'loading' && 'Scanning...'}
              {phase === 'complete' && 'Scan Complete'}
            </button>

            {/* Instructions */}
            <div style={{ color: '#888', fontSize: '11px', lineHeight: 1.5 }}>
              <p>
                <strong>Test Steps:</strong>
              </p>
              <ol style={{ margin: '8px 0', paddingLeft: '16px' }}>
                <li>Observe initial load (3 repos + 3 monorepos, all small)</li>
                <li>Click "Simulate File Tree Scan"</li>
                <li>After 2s, metrics arrive</li>
                <li>Buildings should resize based on new file counts</li>
                <li>Monorepos should show package subdivisions</li>
              </ol>
              <p style={{ marginTop: '12px' }}>
                <strong>If buildings don&apos;t resize:</strong> The bug is that
                repositories array reference didn&apos;t change, so useMemo
                didn&apos;t recalculate.
              </p>
            </div>

            {/* Event Log */}
            <div style={{ flex: 1, marginTop: '16px', overflow: 'auto' }}>
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
              <div
                style={{
                  fontSize: '10px',
                  color: '#888',
                  fontFamily: 'monospace',
                }}
              >
                {eventLog.length === 0 ? (
                  <div style={{ color: '#555', fontStyle: 'italic' }}>
                    No events yet
                  </div>
                ) : (
                  eventLog.map((log, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Map Panel */}
          <div style={{ flex: 1 }}>
            <CollectionMapPanel {...panelProps} />
          </div>
        </div>
      );
    };

    return <TwoPhaseHarness />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests two-phase loading: repos load without file metrics, then metrics arrive later. Verifies UI updates when metrics change.',
      },
    },
  },
};

export const ThreePanelLayout: Story = {
  render: () => {
    const ThreePanelHarness = () => {
      const [collection, setCollection] = useState<Collection>({
        id: 'col-three-panel',
        name: 'Three Panel Test',
        description: 'Tests viewport bounds in multi-panel layout',
        theme: 'industry',
        icon: 'Layout',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        members: mockRepositories.slice(0, 8).map((repo, idx) => ({
          repositoryId: repo.name,
          collectionId: 'col-three-panel',
          addedAt: Date.now(),
          metadata: { regionId: 'region-0-0' },
        })),
        metadata: {
          customRegions: [
            {
              id: 'region-0-0',
              name: 'Active Projects',
              order: 0,
              createdAt: 0,
            },
            { id: 'region-0-1', name: 'Archive', order: 1, createdAt: 0 },
          ],
        },
      });

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
                repositories: mockRepositories.slice(0, 8),
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
            onRegionCreated: async (
              _collectionId: string,
              region: Omit<CustomRegion, 'id'>
            ) => {
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
            onRegionUpdated: async (
              _collectionId: string,
              regionId: string,
              updates: Partial<CustomRegion>
            ) => {
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
            onRegionDeleted: async (
              _collectionId: string,
              regionId: string
            ) => {
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
            onRepositoryAssigned: async (
              _collectionId: string,
              repositoryId: string,
              regionId: string | null
            ) => {
              setCollection((prev) => ({
                ...prev,
                members: prev.members.map((m) =>
                  m.repositoryId === repositoryId
                    ? {
                        ...m,
                        metadata: {
                          ...m.metadata,
                          regionId: regionId || undefined,
                        },
                      }
                    : m
                ),
              }));
            },
            onRepositoryPositionUpdated: async (
              _collectionId: string,
              repositoryId: string,
              layout: RepositoryLayoutData
            ) => {
              setCollection((prev) => ({
                ...prev,
                members: prev.members.map((m) =>
                  m.repositoryId === repositoryId
                    ? { ...m, metadata: { ...m.metadata, layout } }
                    : m
                ),
              }));
            },
            onBatchLayoutInitialized: async (
              _collectionId: string,
              updates: {
                regions?: CustomRegion[];
                assignments?: Array<{ repositoryId: string; regionId: string }>;
                positions?: Array<{
                  repositoryId: string;
                  layout: RepositoryLayoutData;
                }>;
              }
            ) => {
              setCollection((prev) => ({
                ...prev,
                metadata: {
                  ...prev.metadata,
                  ...(updates.regions && { customRegions: updates.regions }),
                },
                members: prev.members.map((m) => {
                  const assignment = updates.assignments?.find(
                    (a: { repositoryId: string }) =>
                      a.repositoryId === m.repositoryId
                  );
                  const position = updates.positions?.find(
                    (p: { repositoryId: string }) =>
                      p.repositoryId === m.repositoryId
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
                }),
              }));
            },
            openRepository: async () => {},
            addRepositoryToCollection: async () => {},
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          events: eventEmitter as any,
        }),
        [collection, eventEmitter]
      );

      const panels: PanelDefinitionWithContent[] = useMemo(
        () => [
          {
            id: 'nav-panel',
            label: 'Navigation',
            content: <LeftPanelContent />,
          },
          {
            id: 'map-panel',
            label: 'Collection Map',
            content: <CollectionMapPanel {...panelProps} />,
          },
          {
            id: 'details-panel',
            label: 'Details',
            content: <RightPanelContent />,
          },
        ],
        [panelProps]
      );

      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#1a1a2e',
          }}
        >
          <ConfigurablePanelLayout
            panels={panels}
            layout={{
              left: 'nav-panel',
              middle: 'map-panel',
              right: 'details-panel',
            }}
            theme={mockTheme}
            defaultSizes={{ left: 20, middle: 60, right: 20 }}
            collapsiblePanels={{
              left: true,
              middle: false,
              right: true,
            }}
          />
        </div>
      );
    };

    return <ThreePanelHarness />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the CollectionMapPanel in a three-panel layout like web-ade. Verifies that usePanelBounds correctly offsets the viewport-sized canvas.',
      },
    },
  },
};
