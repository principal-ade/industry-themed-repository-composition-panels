/**
 * FileCityCard Stories - Demonstrates using File City visualizations in cards
 *
 * File City generates treemap-style visualizations of repository structures,
 * showing files as colored blocks organized by directory.
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '@principal-ade/industry-theme';
import { RepoCardStatic } from './components/RepoCardStatic';
import type { AlexandriaEntryWithMetrics } from '../CollectionMapPanel';

// CSS keyframes for foil animations
const foilStyles = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes shine {
  0% { transform: translateX(-150%); }
  100% { transform: translateX(400%); }
}

@keyframes holo {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}
`;

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
    customImage: '/openclaw-city-transparent.png',
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
          customImage="/openclaw-city-transparent.png"
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
            customImage="/openclaw-city-transparent.png"
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
          customImage="/openclaw-city-transparent.png"
          cardTheme="dark"
          width={220}
          height={320}
        />
      ))}
    </div>
  ),
};

/**
 * Description length scaling - shows how description text shrinks to fit
 */
export const DescriptionLengths: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => {
    const descriptions = [
      {
        label: 'Short (40 chars)',
        text: 'A simple visualization library for code',
      },
      {
        label: 'Medium (100 chars)',
        text: 'A powerful visualization library for displaying repository structures as interactive treemap diagrams',
      },
      {
        label: 'Long (180 chars)',
        text: 'A comprehensive visualization library for displaying repository file structures as interactive treemap diagrams with support for multiple languages, themes, and customizable color schemes based on file types',
      },
      {
        label: 'Very Long (280 chars)',
        text: 'A comprehensive and feature-rich visualization library designed for displaying repository file structures as beautiful interactive treemap diagrams. Supports multiple programming languages, dark and light themes, customizable color schemes based on file types, zoom controls, and detailed tooltips showing file metadata and statistics.',
      },
    ];

    return (
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {descriptions.map(({ label, text }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <RepoCardStatic
              repository={createMockRepo({
                github: {
                  id: 'example/repo',
                  owner: 'example',
                  name: 'file-city',
                  description: text,
                  stars: 1500,
                  license: 'MIT',
                  primaryLanguage: 'TypeScript',
                  lastUpdated: new Date().toISOString(),
                },
              })}
              customImage="/openclaw-city-transparent.png"
              cardTheme="dark"
              width={280}
              height={400}
            />
            <p style={{ color: '#888', marginTop: 8, fontSize: 12 }}>{label}</p>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * Foil effects for high star count cards
 */
export const FoilEffects: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => {
    const starTiers = [
      { label: 'Normal', stars: 1000 },
      { label: 'Bronze (5k+)', stars: 5000 },
      { label: 'Silver (10k+)', stars: 15000 },
      { label: 'Gold (100k+)', stars: 150000 },
    ];

    return (
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {starTiers.map(({ label, stars }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <RepoCardStatic
              repository={createMockRepo({
                github: {
                  id: 'example/popular-repo',
                  owner: 'facebook',
                  name: 'react',
                  description:
                    'A declarative, efficient, and flexible JavaScript library for building user interfaces',
                  stars,
                  license: 'MIT',
                  primaryLanguage: 'TypeScript',
                  lastUpdated: new Date().toISOString(),
                },
              })}
              customImage="/openclaw-city-transparent.png"
              cardTheme="dark"
              width={280}
              height={400}
            />
            <p style={{ color: '#888', marginTop: 8, fontSize: 12 }}>{label}</p>
            <p style={{ color: '#666', marginTop: 2, fontSize: 11 }}>
              {stars.toLocaleString()} stars
            </p>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * Sweeping shine effect
 */
export const SweepingShine: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => (
    <>
      <style>{foilStyles}</style>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <RepoCardStatic
          repository={createMockRepo({
            github: {
              id: 'example/popular-repo',
              owner: 'vercel',
              name: 'next.js',
              description: 'The React Framework for the Web',
              stars: 120000,
              license: 'MIT',
              primaryLanguage: 'TypeScript',
              lastUpdated: new Date().toISOString(),
            },
          })}
          customImage="/openclaw-city-transparent.png"
          cardTheme="dark"
          width={320}
          height={450}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '30%',
              height: '100%',
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: 'shine 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </>
  ),
};

/**
 * Animated gradient border
 */
export const GradientBorder: Story = {
  args: {
    repository: createMockRepo(),
  },
  render: () => (
    <>
      <style>{foilStyles}</style>
      <div
        style={{
          padding: 4,
          background:
            'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0000)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s linear infinite',
        }}
      >
        <RepoCardStatic
          repository={createMockRepo({
            github: {
              id: 'example/popular-repo',
              owner: 'microsoft',
              name: 'vscode',
              description: 'Visual Studio Code - Open Source IDE',
              stars: 160000,
              license: 'MIT',
              primaryLanguage: 'TypeScript',
              lastUpdated: new Date().toISOString(),
            },
          })}
          customImage="/openclaw-city-transparent.png"
          cardTheme="dark"
          width={320}
          height={450}
        />
      </div>
    </>
  ),
};
