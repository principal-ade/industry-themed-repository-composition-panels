/**
 * RepoCard Stories - Demonstrates the RepoCard wrapper component
 * that accepts AlexandriaEntryWithMetrics and renders a RepoSprite
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '@principal-ade/industry-theme';
import { RepoCard } from './components/RepoCard';
import type { AlexandriaEntryWithMetrics } from '../CollectionMapPanel';

const meta = {
  title: 'Panels/Overworld Map/RepoCard',
  component: RepoCard,
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
    variant: {
      control: 'select',
      options: ['default', 'card'],
      description: 'Display variant',
    },
    cardTheme: {
      control: 'select',
      options: ['blue', 'red', 'green', 'purple', 'gold', 'dark'],
      description: 'Card color theme (only applies to card variant)',
    },
    width: {
      control: { type: 'number', min: 100, max: 400 },
    },
    height: {
      control: { type: 'number', min: 100, max: 500 },
    },
    showBoundary: {
      control: 'boolean',
      description: 'Show isometric diamond boundary',
    },
  },
} satisfies Meta<typeof RepoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create mock AlexandriaEntryWithMetrics
const createMockRepo = (
  overrides: Partial<AlexandriaEntryWithMetrics> = {}
): AlexandriaEntryWithMetrics => ({
  name: 'example-repo',
  path: '/path/to/repo' as AlexandriaEntryWithMetrics['path'],
  registeredAt: new Date().toISOString(),
  hasViews: true,
  viewCount: 2,
  views: [],
  github: {
    id: 'owner/example-repo',
    owner: 'owner',
    name: 'example-repo',
    stars: 1500,
    license: 'MIT',
    primaryLanguage: 'TypeScript',
    lastUpdated: new Date().toISOString(),
  },
  metrics: {
    fileCount: 1200,
    lineCount: 45000,
    contributors: 25,
    lastEditedAt: new Date().toISOString(),
  },
  ...overrides,
});

/**
 * Basic TypeScript repository
 */
export const TypeScriptRepo: Story = {
  args: {
    repository: createMockRepo({
      name: 'typescript-project',
      github: {
        id: 'owner/typescript-project',
        owner: 'owner',
        name: 'typescript-project',
        stars: 2500,
        license: 'MIT',
        primaryLanguage: 'TypeScript',
        lastUpdated: new Date().toISOString(),
      },
    }),
    variant: 'card',
    width: 200,
    height: 280,
  },
};

/**
 * Python repository
 */
export const PythonRepo: Story = {
  args: {
    repository: createMockRepo({
      name: 'python-ml-toolkit',
      github: {
        id: 'org/python-ml-toolkit',
        owner: 'org',
        name: 'python-ml-toolkit',
        stars: 8900,
        license: 'Apache-2.0',
        primaryLanguage: 'Python',
        lastUpdated: new Date().toISOString(),
      },
      metrics: {
        fileCount: 3500,
        contributors: 120,
      },
    }),
    variant: 'card',
    width: 200,
    height: 280,
  },
};

/**
 * Rust repository
 */
export const RustRepo: Story = {
  args: {
    repository: createMockRepo({
      name: 'rust-async-runtime',
      github: {
        id: 'rust-lang/rust-async-runtime',
        owner: 'rust-lang',
        name: 'rust-async-runtime',
        stars: 15000,
        license: 'MIT',
        primaryLanguage: 'Rust',
        lastUpdated: new Date().toISOString(),
      },
      metrics: {
        fileCount: 5200,
        contributors: 200,
      },
    }),
    variant: 'card',
    width: 200,
    height: 280,
  },
};

/**
 * Small repository
 */
export const SmallRepo: Story = {
  args: {
    repository: createMockRepo({
      name: 'tiny-util',
      github: {
        id: 'dev/tiny-util',
        owner: 'dev',
        name: 'tiny-util',
        stars: 45,
        license: 'ISC',
        primaryLanguage: 'JavaScript',
        lastUpdated: new Date().toISOString(),
      },
      metrics: {
        fileCount: 50,
        contributors: 2,
      },
    }),
    variant: 'card',
    width: 180,
    height: 250,
  },
};

/**
 * Large repository
 */
export const LargeRepo: Story = {
  args: {
    repository: createMockRepo({
      name: 'enterprise-framework',
      github: {
        id: 'enterprise/enterprise-framework',
        owner: 'enterprise',
        name: 'enterprise-framework',
        stars: 45000,
        license: 'Apache-2.0',
        primaryLanguage: 'Java',
        lastUpdated: new Date().toISOString(),
      },
      metrics: {
        fileCount: 85000,
        contributors: 500,
      },
    }),
    variant: 'card',
    width: 220,
    height: 300,
  },
};

/**
 * Repository with custom book color
 */
export const CustomColorRepo: Story = {
  args: {
    repository: createMockRepo({
      name: 'branded-project',
      bookColor: '#ff6b6b',
      github: {
        id: 'brand/branded-project',
        owner: 'brand',
        name: 'branded-project',
        stars: 3200,
        license: 'MIT',
        primaryLanguage: 'TypeScript',
        lastUpdated: new Date().toISOString(),
      },
    }),
    variant: 'card',
    width: 200,
    height: 280,
  },
};

/**
 * Monorepo with packages
 */
export const MonorepoWithPackages: Story = {
  args: {
    repository: createMockRepo({
      name: 'design-system',
      github: {
        id: 'company/design-system',
        owner: 'company',
        name: 'design-system',
        stars: 5600,
        license: 'MIT',
        primaryLanguage: 'TypeScript',
        lastUpdated: new Date().toISOString(),
      },
      metrics: {
        fileCount: 4500,
        contributors: 85,
      },
      packages: [
        {
          id: 'components',
          name: '@ds/components',
          type: 'node',
          enabled: true,
          packageData: {
            name: '@ds/components',
            path: 'packages/components',
            manifestPath: 'packages/components/package.json',
            packageManager: 'npm',
            dependencies: {},
            devDependencies: {},
            peerDependencies: {},
            isMonorepoRoot: false,
            isWorkspace: true,
          },
          derivedFrom: {
            fileSets: [],
            derivationType: 'presence',
            description: 'Package detected',
          },
        },
        {
          id: 'hooks',
          name: '@ds/hooks',
          type: 'node',
          enabled: true,
          packageData: {
            name: '@ds/hooks',
            path: 'packages/hooks',
            manifestPath: 'packages/hooks/package.json',
            packageManager: 'npm',
            dependencies: {},
            devDependencies: {},
            peerDependencies: {},
            isMonorepoRoot: false,
            isWorkspace: true,
          },
          derivedFrom: {
            fileSets: [],
            derivationType: 'presence',
            description: 'Package detected',
          },
        },
        {
          id: 'utils',
          name: '@ds/utils',
          type: 'node',
          enabled: true,
          packageData: {
            name: '@ds/utils',
            path: 'packages/utils',
            manifestPath: 'packages/utils/package.json',
            packageManager: 'npm',
            dependencies: {},
            devDependencies: {},
            peerDependencies: {},
            isMonorepoRoot: false,
            isWorkspace: true,
          },
          derivedFrom: {
            fileSets: [],
            derivationType: 'presence',
            description: 'Package detected',
          },
        },
      ],
    }),
    variant: 'card',
    width: 220,
    height: 320,
  },
};

/**
 * GPL licensed repository
 */
export const GPLRepo: Story = {
  args: {
    repository: createMockRepo({
      name: 'open-source-tool',
      github: {
        id: 'oss/open-source-tool',
        owner: 'oss',
        name: 'open-source-tool',
        stars: 12000,
        license: 'GPL-3.0',
        primaryLanguage: 'C',
        lastUpdated: new Date().toISOString(),
      },
      metrics: {
        fileCount: 25000,
        contributors: 350,
      },
    }),
    variant: 'card',
    width: 200,
    height: 280,
  },
};

/**
 * Default variant (sprite only)
 */
export const DefaultVariant: Story = {
  args: {
    repository: createMockRepo(),
    variant: 'default',
    width: 200,
    height: 200,
    showBoundary: true,
  },
};

/**
 * Language color showcase
 */
export const LanguageColorShowcase: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
      {[
        'TypeScript',
        'JavaScript',
        'Python',
        'Rust',
        'Go',
        'Java',
        'Ruby',
        'Swift',
      ].map((lang) => (
        <div key={lang} style={{ width: '180px', height: '250px' }}>
          <RepoCard
            repository={createMockRepo({
              name: lang.toLowerCase(),
              github: {
                id: `org/${lang.toLowerCase()}`,
                owner: 'org',
                name: lang.toLowerCase(),
                stars: 1500,
                license: 'MIT',
                primaryLanguage: lang,
                lastUpdated: new Date().toISOString(),
              },
            })}
            variant="card"
            width={150}
            height={150}
          />
        </div>
      ))}
    </div>
  ),
};

/**
 * Card theme variations
 */
export const CardThemeVariations: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
      {(['blue', 'red', 'green', 'purple', 'gold', 'dark'] as const).map(
        (theme) => (
          <div key={theme} style={{ width: '200px', height: '280px' }}>
            <RepoCard
              repository={createMockRepo({
                name: `${theme}-themed`,
              })}
              variant="card"
              cardTheme={theme}
              width={160}
              height={160}
            />
          </div>
        )
      )}
    </div>
  ),
};

/**
 * Size comparison based on file count
 */
export const SizeComparison: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
      {[50, 500, 2000, 10000, 50000].map((fileCount) => (
        <div key={fileCount} style={{ textAlign: 'center' }}>
          <div style={{ width: '180px', height: '250px' }}>
            <RepoCard
              repository={createMockRepo({
                name: `${fileCount}-files`,
                metrics: { fileCount },
              })}
              variant="card"
              width={140}
              height={140}
            />
          </div>
          <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
            {fileCount.toLocaleString()} files
          </div>
        </div>
      ))}
    </div>
  ),
};
