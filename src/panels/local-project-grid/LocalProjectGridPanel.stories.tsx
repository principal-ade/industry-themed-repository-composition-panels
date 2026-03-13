/**
 * LocalProjectGridPanel Stories - Grid display of local Alexandria projects
 *
 * Demonstrates the grid panel and individual card components for
 * displaying local projects using the CardLayout styling.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '@principal-ade/industry-theme';
import type { AlexandriaEntry } from '@principal-ai/alexandria-core-library';
import type { DataSlice } from '@principal-ade/panel-framework-core';
import { LocalProjectGridPanelContent } from './LocalProjectGridPanel';
import { LocalProjectCard } from './LocalProjectCard';
import type { LocalProjectGridPanelProps } from './types';

// ============================================================================
// Mock Data Helpers
// ============================================================================

type ValidatedPath = string & { __brand: 'ValidatedRepositoryPath' };

/** Create a mock DataSlice for stories */
const createMockSlice = <T,>(data: T, loading = false): DataSlice<T> => ({
  data,
  loading,
  scope: 'repository',
  name: 'localProjects',
  error: null,
  refresh: async () => {},
});

const createMockProject = (
  overrides: Partial<AlexandriaEntry> = {}
): AlexandriaEntry => ({
  name: 'example-project',
  path: '/Users/dev/projects/example-project' as ValidatedPath,
  registeredAt: new Date().toISOString(),
  lastOpenedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  hasViews: true,
  viewCount: 2,
  views: [],
  github: {
    id: 'owner/example-project',
    owner: 'owner',
    name: 'example-project',
    stars: 1500,
    license: 'MIT',
    primaryLanguage: 'TypeScript',
    lastUpdated: new Date().toISOString(),
  },
  ...overrides,
});

const mockProjects: AlexandriaEntry[] = [
  createMockProject({
    name: 'web-app',
    path: '/Users/dev/projects/web-app' as ValidatedPath,
    lastOpenedAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    github: {
      id: 'myorg/web-app',
      owner: 'myorg',
      name: 'web-app',
      stars: 245,
      license: 'MIT',
      primaryLanguage: 'TypeScript',
      description: 'Modern web application with React and TypeScript',
      lastUpdated: new Date().toISOString(),
    },
  }),
  createMockProject({
    name: 'api-server',
    path: '/Users/dev/projects/api-server' as ValidatedPath,
    lastOpenedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    github: {
      id: 'myorg/api-server',
      owner: 'myorg',
      name: 'api-server',
      stars: 89,
      license: 'Apache-2.0',
      primaryLanguage: 'Go',
      description: 'High-performance REST API server',
      lastUpdated: new Date().toISOString(),
    },
  }),
  createMockProject({
    name: 'ml-pipeline',
    path: '/Users/dev/projects/ml-pipeline' as ValidatedPath,
    lastOpenedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    github: {
      id: 'datateam/ml-pipeline',
      owner: 'datateam',
      name: 'ml-pipeline',
      stars: 1200,
      license: 'MIT',
      primaryLanguage: 'Python',
      description: 'Machine learning data pipeline framework',
      lastUpdated: new Date().toISOString(),
    },
  }),
  createMockProject({
    name: 'rust-cli',
    path: '/Users/dev/projects/rust-cli' as ValidatedPath,
    lastOpenedAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
    github: {
      id: 'tools/rust-cli',
      owner: 'tools',
      name: 'rust-cli',
      stars: 456,
      license: 'MIT',
      primaryLanguage: 'Rust',
      description: 'Fast command-line utility written in Rust',
      lastUpdated: new Date().toISOString(),
    },
  }),
  createMockProject({
    name: 'mobile-app',
    path: '/Users/dev/projects/mobile-app' as ValidatedPath,
    lastOpenedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    github: {
      id: 'mobile/mobile-app',
      owner: 'mobile',
      name: 'mobile-app',
      stars: 78,
      license: 'MIT',
      primaryLanguage: 'Swift',
      description: 'iOS application with SwiftUI',
      lastUpdated: new Date().toISOString(),
    },
  }),
  createMockProject({
    name: 'design-system',
    path: '/Users/dev/projects/design-system' as ValidatedPath,
    lastOpenedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    github: {
      id: 'frontend/design-system',
      owner: 'frontend',
      name: 'design-system',
      stars: 2100,
      license: 'MIT',
      primaryLanguage: 'TypeScript',
      description: 'Shared component library and design tokens',
      lastUpdated: new Date().toISOString(),
    },
  }),
];

// ============================================================================
// LocalProjectCard Stories
// ============================================================================

const cardMeta = {
  title: 'Panels/Local Project Grid/LocalProjectCard',
  component: LocalProjectCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  argTypes: {
    width: {
      control: { type: 'number', min: 150, max: 400 },
    },
    height: {
      control: { type: 'number', min: 200, max: 500 },
    },
    isSelected: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof LocalProjectCard>;

export default cardMeta;
type CardStory = StoryObj<typeof cardMeta>;

/**
 * Default project card
 */
export const Default: CardStory = {
  args: {
    entry: createMockProject(),
    width: 220,
    height: 300,
  },
};

/**
 * Selected card state
 */
export const Selected: CardStory = {
  args: {
    entry: createMockProject(),
    isSelected: true,
    width: 220,
    height: 300,
  },
};

/**
 * Card with action buttons
 */
export const WithActions: CardStory = {
  args: {
    entry: createMockProject(),
    onOpen: (entry) => console.log('Open:', entry.name),
    onRemove: (entry) => console.log('Remove:', entry.name),
    onClick: (entry) => console.log('Click:', entry.name),
  },
};

/**
 * Project without GitHub metadata
 */
export const LocalOnly: CardStory = {
  args: {
    entry: createMockProject({
      name: 'local-project',
      github: undefined,
      lastOpenedAt: new Date(Date.now() - 3600000).toISOString(),
    }),
  },
};

/**
 * Recently opened project
 */
export const RecentlyOpened: CardStory = {
  args: {
    entry: createMockProject({
      name: 'active-project',
      lastOpenedAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    }),
  },
};

/**
 * Language showcase - different primary languages
 */
export const LanguageShowcase: CardStory = {
  args: {
    entry: createMockProject(),
  },
  render: () => {
    const languages = [
      'TypeScript',
      'JavaScript',
      'Python',
      'Rust',
      'Go',
      'Swift',
      'Ruby',
      'Java',
    ];

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {languages.map((lang) => (
          <LocalProjectCard
            key={lang}
            entry={createMockProject({
              name: lang.toLowerCase(),
              github: {
                id: `org/${lang.toLowerCase()}`,
                owner: 'org',
                name: lang.toLowerCase(),
                stars: 500,
                license: 'MIT',
                primaryLanguage: lang,
                lastUpdated: new Date().toISOString(),
              },
            })}
            width={180}
            height={260}
          />
        ))}
      </div>
    );
  },
};

// ============================================================================
// LocalProjectGridPanel Stories
// ============================================================================

/** Create mock panel props for stories */
const createMockPanelProps = (
  projects: AlexandriaEntry[] | null,
  loading = false
): LocalProjectGridPanelProps => ({
  context: {
    localProjects: createMockSlice(projects, loading),
    currentScope: { type: 'workspace' },
    refresh: async () => {},
  } as LocalProjectGridPanelProps['context'],
  actions: {
    openProject: async (entry) => console.log('Open:', entry.name),
    removeProject: async (entry) => console.log('Remove:', entry.name),
    selectProject: (entry) => console.log('Select:', entry.name),
  },
  events: {
    emit: () => {},
    on: () => () => {},
    off: () => {},
  },
});

/**
 * Full grid panel with multiple projects
 */
export const GridPanel: CardStory = {
  args: {
    entry: createMockProject(),
  },
  render: () => (
    <div style={{ width: '900px', height: '600px' }}>
      <LocalProjectGridPanelContent {...createMockPanelProps(mockProjects)} />
    </div>
  ),
};

/**
 * Grid panel in loading state
 */
export const GridPanelLoading: CardStory = {
  args: {
    entry: createMockProject(),
  },
  render: () => (
    <div style={{ width: '900px', height: '600px' }}>
      <LocalProjectGridPanelContent {...createMockPanelProps(null, true)} />
    </div>
  ),
};

/**
 * Grid panel with no projects
 */
export const GridPanelEmpty: CardStory = {
  args: {
    entry: createMockProject(),
  },
  render: () => (
    <div style={{ width: '900px', height: '600px' }}>
      <LocalProjectGridPanelContent {...createMockPanelProps([])} />
    </div>
  ),
};

/**
 * Grid panel with many projects
 */
export const GridPanelManyProjects: CardStory = {
  args: {
    entry: createMockProject(),
  },
  render: () => {
    const manyProjects = Array.from({ length: 20 }, (_, i) =>
      createMockProject({
        name: `project-${i + 1}`,
        path: `/Users/dev/projects/project-${i + 1}` as ValidatedPath,
        lastOpenedAt: new Date(
          Date.now() - Math.random() * 604800000
        ).toISOString(),
        github: {
          id: `org/project-${i + 1}`,
          owner: 'org',
          name: `project-${i + 1}`,
          stars: Math.floor(Math.random() * 5000),
          license: ['MIT', 'Apache-2.0', 'GPL-3.0', 'ISC'][
            Math.floor(Math.random() * 4)
          ],
          primaryLanguage: ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go'][
            Math.floor(Math.random() * 5)
          ],
          lastUpdated: new Date().toISOString(),
        },
      })
    );

    return (
      <div style={{ width: '1200px', height: '800px' }}>
        <LocalProjectGridPanelContent {...createMockPanelProps(manyProjects)} />
      </div>
    );
  },
};
