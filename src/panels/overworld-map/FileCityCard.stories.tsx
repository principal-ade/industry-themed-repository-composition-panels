/**
 * FileCityCard Stories - Demonstrates using File City visualizations in cards
 *
 * File City generates treemap-style visualizations of repository structures,
 * showing files as colored blocks organized by directory.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '@principal-ade/industry-theme';
import { RepoCardStatic } from './components/RepoCardStatic';
import type { AlexandriaEntryWithMetrics } from '../CollectionMapPanel';

const meta = {
  title: 'Panels/Overworld Map/FileCityCard',
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
} satisfies Meta<typeof RepoCardStatic>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create mock repository
const createMockRepo = (
  overrides: Partial<AlexandriaEntryWithMetrics> = {}
): AlexandriaEntryWithMetrics => ({
  name: 'file-city',
  path: '/principal-ai/file-city' as AlexandriaEntryWithMetrics['path'],
  registeredAt: new Date().toISOString(),
  hasViews: true,
  viewCount: 42,
  views: [],
  github: {
    id: 'principal-ai/file-city',
    owner: 'principal-ai',
    name: 'file-city',
    description: 'Treemap visualization of repository structure',
    stars: 1500,
    license: 'MIT',
    primaryLanguage: 'TypeScript',
    lastUpdated: new Date().toISOString(),
  },
  metrics: {
    fileCount: 113,
    lineCount: 15000,
    contributors: 5,
    lastEditedAt: new Date().toISOString(),
  },
  ...overrides,
});

/**
 * File City visualization in a card using customImage prop
 */
export const Default: Story = {
  args: {
    repository: createMockRepo(),
    customImage: '/file-city-sample.png',
    cardTheme: 'dark',
    width: 320,
    height: 450,
  },
};

/**
 * Comparison: Sprite vs File City
 */
export const SpriteVsFileCity: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <RepoCardStatic
          repository={createMockRepo({ name: 'procedural-sprite' })}
          cardTheme="dark"
          width={280}
          height={400}
        />
        <p style={{ color: '#888', marginTop: 8 }}>Procedural Building</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <RepoCardStatic
          repository={createMockRepo({ name: 'file-city-view' })}
          customImage="/file-city-sample.png"
          cardTheme="dark"
          width={280}
          height={400}
        />
        <p style={{ color: '#888', marginTop: 8 }}>File City Treemap</p>
      </div>
    </div>
  ),
};

/**
 * Different card sizes with File City
 */
export const CardSizes: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
      {[
        { width: 200, height: 280 },
        { width: 280, height: 400 },
        { width: 360, height: 500 },
      ].map(({ width, height }) => (
        <div key={`${width}x${height}`} style={{ textAlign: 'center' }}>
          <RepoCardStatic
            repository={createMockRepo()}
            customImage="/file-city-sample.png"
            cardTheme="dark"
            width={width}
            height={height}
          />
          <p style={{ color: '#888', marginTop: 8, fontSize: 12 }}>
            {width}x{height}
          </p>
        </div>
      ))}
    </div>
  ),
};

/**
 * File City with different color themes
 */
export const ColorThemes: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {[
        { lang: 'TypeScript', name: 'typescript-app' },
        { lang: 'JavaScript', name: 'javascript-app' },
        { lang: 'Python', name: 'python-app' },
        { lang: 'Rust', name: 'rust-app' },
        { lang: 'Go', name: 'go-app' },
        { lang: 'Java', name: 'java-app' },
      ].map(({ lang, name }) => (
        <RepoCardStatic
          key={name}
          repository={createMockRepo({
            name,
            github: {
              id: `example/${name}`,
              owner: 'example',
              name,
              stars: 1000,
              license: 'MIT',
              primaryLanguage: lang,
              lastUpdated: new Date().toISOString(),
            },
          })}
          customImage="/file-city-sample.png"
          cardTheme="dark"
          width={220}
          height={320}
        />
      ))}
    </div>
  ),
};
