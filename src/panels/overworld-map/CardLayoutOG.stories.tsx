/**
 * CardLayoutOG Stories - Satori-compatible card layout for OG images
 *
 * This component is designed for server-side image generation using Satori.
 * It has no hooks or animations, making it compatible with Satori's JSX-to-SVG conversion.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CardLayoutOG, DEFAULT_OG_THEME } from './components/CardLayoutOG';
import { languageColors } from './components/cardThemes';

const meta = {
  title: 'Panels/Overworld Map/CardLayoutOG',
  component: CardLayoutOG,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## Satori-Compatible Card Layout

CardLayoutOG is a pure render component designed for OG (Open Graph) image generation using Satori.

### Key Features
- **No hooks** - Pure render function, works with Satori
- **No animations** - Static output only
- **Inline styles** - All CSS is Satori-compatible
- **Theme as props** - No context dependency

### Usage with Satori

\`\`\`tsx
import satori from 'satori';
import { CardLayoutOG } from '@industry-theme/repository-composition-panels';

const svg = await satori(
  <CardLayoutOG
    color={0x3178c6}
    owner="vercel"
    stars={95000}
    label="next.js"
    description="The React Framework"
  >
    <img src="..." />
  </CardLayoutOG>,
  { width: 1200, height: 628, fonts: [...] }
);
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'color',
      description: 'Base color for the card theme',
    },
    stars: {
      control: { type: 'number', min: 0, max: 500000 },
    },
    files: {
      control: { type: 'number', min: 0, max: 100000 },
    },
  },
} satisfies Meta<typeof CardLayoutOG>;

export default meta;
type Story = StoryObj<typeof meta>;

/** File City image for stories */
const FileCityImage = () => (
  <img
    src="/openclaw-city-transparent.png"
    alt="File City"
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    }}
  />
);

/**
 * Default card layout
 */
export const Default: Story = {
  args: {
    color: 0x3178c6,
    owner: 'facebook',
    stars: 220000,
    label: 'react',
    description: 'The library for web and native user interfaces.',
    files: 2847,
    license: 'MIT',
    language: 'TypeScript',
    createdAt: '2013-05-24T00:00:00Z',
    theme: DEFAULT_OG_THEME,
    children: <FileCityImage />,
  },
  render: (args) => (
    <div style={{ width: 320, height: 450 }}>
      <CardLayoutOG {...args} />
    </div>
  ),
};

/**
 * Twitter card dimensions (1200x628)
 * Shows how the card looks at actual OG image size
 */
export const TwitterCardSize: Story = {
  args: {
    color: 0x3178c6,
    owner: 'vercel',
    stars: 95000,
    label: 'next.js',
    description:
      "The React Framework for the Web. Used by some of the world's largest companies, Next.js enables you to create full-stack Web applications.",
    files: 4521,
    license: 'MIT',
    language: 'TypeScript',
    createdAt: '2016-10-25T00:00:00Z',
    children: <FileCityImage />,
  },
  render: (args) => (
    <div
      style={{
        width: 1200,
        height: 628,
        backgroundColor: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ width: 353, height: 588 }}>
        <CardLayoutOG {...args} />
      </div>
    </div>
  ),
};

/**
 * High star count - shows gold styling
 */
export const GoldTier: Story = {
  args: {
    color: languageColors.TypeScript,
    owner: 'microsoft',
    stars: 150000,
    label: 'vscode',
    description: 'Visual Studio Code - Code editing. Redefined.',
    files: 12500,
    license: 'MIT',
    createdAt: '2015-11-18T00:00:00Z',
    children: <FileCityImage />,
  },
  render: (args) => (
    <div style={{ width: 320, height: 450 }}>
      <CardLayoutOG {...args} />
    </div>
  ),
};

/**
 * Silver tier (10k+ stars)
 */
export const SilverTier: Story = {
  args: {
    color: languageColors.Rust,
    owner: 'rust-lang',
    stars: 45000,
    label: 'rust',
    description:
      'Empowering everyone to build reliable and efficient software.',
    files: 8200,
    license: 'Apache-2.0',
    createdAt: '2010-06-16T00:00:00Z',
    children: <FileCityImage />,
  },
  render: (args) => (
    <div style={{ width: 320, height: 450 }}>
      <CardLayoutOG {...args} />
    </div>
  ),
};

/**
 * Small/new repository
 */
export const SmallRepo: Story = {
  args: {
    color: languageColors.JavaScript,
    owner: 'developer',
    stars: 125,
    label: 'my-awesome-lib',
    description: 'A small but mighty utility library.',
    files: 42,
    license: 'ISC',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    children: <FileCityImage />,
  },
  render: (args) => (
    <div style={{ width: 320, height: 450 }}>
      <CardLayoutOG {...args} />
    </div>
  ),
};

/**
 * With packages (monorepo)
 */
export const WithPackages: Story = {
  args: {
    color: languageColors.TypeScript,
    owner: 'openclaw',
    stars: 15000,
    label: 'openclaw',
    description: 'Your own personal AI assistant. Any OS. Any Platform.',
    files: 3200,
    license: 'MIT',
    createdAt: '2024-01-15T00:00:00Z',
    packages: [
      { name: '@openclaw/core', color: '#3178c6' },
      { name: '@openclaw/cli', color: '#f7df1e' },
      { name: '@openclaw/server', color: '#68a063' },
      { name: '@openclaw/ui', color: '#61dafb' },
    ],
    children: <FileCityImage />,
  },
  render: (args) => (
    <div style={{ width: 320, height: 450 }}>
      <CardLayoutOG {...args} />
    </div>
  ),
};

/**
 * Language color showcase
 */
export const LanguageShowcase: Story = {
  args: {
    color: 0x3178c6,
    children: <FileCityImage />,
  },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
      {Object.entries(languageColors)
        .slice(0, 8)
        .map(([lang, color]) => (
          <div key={lang} style={{ width: 180, height: 260 }}>
            <CardLayoutOG
              color={color}
              owner="org"
              stars={Math.floor(Math.random() * 50000)}
              label={lang.toLowerCase()}
              description={`A ${lang} project`}
              files={Math.floor(Math.random() * 5000)}
              license="MIT"
              language={lang}
            >
              <FileCityImage />
            </CardLayoutOG>
          </div>
        ))}
    </div>
  ),
};

/**
 * Long description handling
 */
export const LongDescription: Story = {
  args: {
    color: languageColors.Python,
    owner: 'huggingface',
    stars: 85000,
    label: 'transformers',
    description:
      'State-of-the-art Machine Learning for PyTorch, TensorFlow, and JAX. Transformers provides thousands of pretrained models to perform tasks on different modalities such as text, vision, and audio. These models can be applied on text, images, audio, and multimodal inputs.',
    files: 9800,
    license: 'Apache-2.0',
    createdAt: '2018-10-29T00:00:00Z',
    children: <FileCityImage />,
  },
  render: (args) => (
    <div style={{ width: 320, height: 450 }}>
      <CardLayoutOG {...args} />
    </div>
  ),
};

/**
 * Minimal card (no optional props)
 */
export const Minimal: Story = {
  args: {
    color: 0x555555,
    label: 'unnamed-repo',
    children: <FileCityImage />,
  },
  render: (args) => (
    <div style={{ width: 320, height: 450 }}>
      <CardLayoutOG {...args} />
    </div>
  ),
};

/**
 * Side-by-side comparison: different star tiers
 */
export const StarTierComparison: Story = {
  args: {
    color: 0x3178c6,
    children: <FileCityImage />,
  },
  render: () => {
    const tiers = [
      { stars: 500, label: 'starter' },
      { stars: 5000, label: 'bronze' },
      { stars: 15000, label: 'silver' },
      { stars: 150000, label: 'gold' },
    ];

    return (
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
        {tiers.map(({ stars, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ width: 180, height: 260 }}>
              <CardLayoutOG
                color={languageColors.TypeScript}
                owner="org"
                stars={stars}
                label={label}
                description="Example repository"
                files={1000}
                license="MIT"
              >
                <FileCityImage />
              </CardLayoutOG>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
              {stars.toLocaleString()} stars
            </div>
          </div>
        ))}
      </div>
    );
  },
};
