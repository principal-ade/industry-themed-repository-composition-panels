/**
 * RepoCardStatic Stories - Demonstrates the static image card component
 *
 * RepoCardStatic renders sprites as PNG images instead of live WebGL canvases,
 * making it suitable for carousels and grids with many cards.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '@principal-ade/industry-theme';
import { RepoCardStatic } from './components/RepoCardStatic';
import type { AlexandriaEntryWithMetrics } from '../CollectionMapPanel';

const meta = {
  title: 'Panels/Overworld Map/RepoCardStatic',
  component: RepoCardStatic,
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
    cardTheme: {
      control: 'select',
      options: ['blue', 'red', 'green', 'purple', 'gold', 'dark'],
      description: 'Card color theme',
    },
    width: {
      control: { type: 'number', min: 150, max: 400 },
    },
    height: {
      control: { type: 'number', min: 200, max: 500 },
    },
    spriteSize: {
      control: { type: 'number', min: 100, max: 300 },
    },
  },
} satisfies Meta<typeof RepoCardStatic>;

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
 * Default static card
 */
export const Default: Story = {
  args: {
    repository: createMockRepo(),
    cardTheme: 'dark',
    width: 200,
    height: 280,
  },
};

/**
 * TypeScript repository
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
    cardTheme: 'blue',
  },
};

/**
 * Python repository with many stars
 */
export const PopularPythonRepo: Story = {
  args: {
    repository: createMockRepo({
      name: 'ml-framework',
      github: {
        id: 'org/ml-framework',
        owner: 'org',
        name: 'ml-framework',
        stars: 45000,
        license: 'Apache-2.0',
        primaryLanguage: 'Python',
        lastUpdated: new Date().toISOString(),
      },
      metrics: {
        fileCount: 8500,
        contributors: 350,
      },
    }),
    cardTheme: 'gold',
  },
};

/**
 * Rust repository
 */
export const RustRepo: Story = {
  args: {
    repository: createMockRepo({
      name: 'rust-runtime',
      github: {
        id: 'rust-lang/rust-runtime',
        owner: 'rust-lang',
        name: 'rust-runtime',
        stars: 12000,
        license: 'MIT',
        primaryLanguage: 'Rust',
        lastUpdated: new Date().toISOString(),
      },
      metrics: {
        fileCount: 5200,
        contributors: 180,
      },
    }),
    cardTheme: 'red',
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
    cardTheme: 'green',
    width: 180,
    height: 250,
  },
};

/**
 * Card theme showcase
 */
export const CardThemes: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
      {(['blue', 'red', 'green', 'purple', 'gold', 'dark'] as const).map(
        (themeOption) => (
          <RepoCardStatic
            key={themeOption}
            repository={createMockRepo({
              name: `${themeOption}-theme`,
            })}
            cardTheme={themeOption}
            width={180}
            height={260}
          />
        )
      )}
    </div>
  ),
};

/**
 * Language showcase - demonstrates color derivation from languages
 */
export const LanguageShowcase: Story = {
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
        <RepoCardStatic
          key={lang}
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
          cardTheme="dark"
          width={160}
          height={240}
        />
      ))}
    </div>
  ),
};

/**
 * Carousel simulation - many cards side by side
 */
export const CarouselSimulation: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => {
    const repos = [
      { name: 'react', stars: 220000, lang: 'JavaScript' },
      { name: 'vue', stars: 206000, lang: 'TypeScript' },
      { name: 'angular', stars: 95000, lang: 'TypeScript' },
      { name: 'svelte', stars: 77000, lang: 'JavaScript' },
      { name: 'next.js', stars: 120000, lang: 'JavaScript' },
      { name: 'nuxt', stars: 52000, lang: 'TypeScript' },
      { name: 'remix', stars: 27000, lang: 'TypeScript' },
      { name: 'astro', stars: 42000, lang: 'TypeScript' },
    ];

    return (
      <div
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          padding: '16px',
          maxWidth: '100vw',
        }}
      >
        {repos.map((repo) => (
          <RepoCardStatic
            key={repo.name}
            repository={createMockRepo({
              name: repo.name,
              github: {
                id: `org/${repo.name}`,
                owner: 'org',
                name: repo.name,
                stars: repo.stars,
                license: 'MIT',
                primaryLanguage: repo.lang,
                lastUpdated: new Date().toISOString(),
              },
              metrics: {
                fileCount: Math.floor(repo.stars / 50),
                contributors: Math.floor(repo.stars / 500),
              },
            })}
            cardTheme="dark"
            width={180}
            height={260}
          />
        ))}
      </div>
    );
  },
};

/**
 * Size comparison - shows different repository sizes
 */
export const SizeComparison: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => {
    const sizes = [50, 500, 2000, 10000, 50000];

    return (
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
        {sizes.map((fileCount) => (
          <div key={fileCount} style={{ textAlign: 'center' }}>
            <RepoCardStatic
              repository={createMockRepo({
                name: `${fileCount}-files`,
                metrics: { fileCount },
              })}
              cardTheme="dark"
              width={160}
              height={240}
            />
            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#888',
              }}
            >
              {fileCount.toLocaleString()} files
            </div>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * Grid layout - typical grid usage
 */
export const GridLayout: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => {
    const repos = Array.from({ length: 12 }, (_, i) => ({
      name: `repo-${i + 1}`,
      stars: Math.floor(Math.random() * 50000),
      lang: ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go'][
        Math.floor(Math.random() * 5)
      ],
    }));

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          padding: '16px',
        }}
      >
        {repos.map((repo) => (
          <RepoCardStatic
            key={repo.name}
            repository={createMockRepo({
              name: repo.name,
              github: {
                id: `org/${repo.name}`,
                owner: 'org',
                name: repo.name,
                stars: repo.stars,
                license: 'MIT',
                primaryLanguage: repo.lang,
                lastUpdated: new Date().toISOString(),
              },
              metrics: {
                fileCount: Math.floor(repo.stars / 10),
                contributors: Math.floor(repo.stars / 500) + 1,
              },
            })}
            cardTheme="dark"
            width={180}
            height={260}
          />
        ))}
      </div>
    );
  },
};
