/**
 * CardLayoutOG Satori Test Stories
 *
 * These stories actually render through Satori to catch compatibility issues.
 * Use these to verify the component works correctly with OG image generation.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import satori, { Font } from 'satori';
import { CardLayoutOG, DEFAULT_OG_THEME } from './components/CardLayoutOG';
import { languageColors } from './components/cardThemes';

// Twitter card dimensions
const WIDTH = 1200;
const HEIGHT = 628;
const CARD_HEIGHT = HEIGHT - 40;
const CARD_WIDTH = Math.round(CARD_HEIGHT * 0.6);

// Cache for loaded fonts
let fontCache: Font[] | null = null;

async function loadFonts(): Promise<Font[]> {
  if (fontCache) return fontCache;

  // Load Roboto font from local public folder (served by Storybook)
  const fontUrl = '/roboto-regular.ttf';

  const fontResponse = await fetch(fontUrl);

  if (!fontResponse.ok) {
    throw new Error(`Failed to load font: ${fontResponse.status}`);
  }

  const fontData = await fontResponse.arrayBuffer();

  fontCache = [
    {
      name: 'Roboto',
      data: fontData,
      weight: 400,
      style: 'normal' as const,
    },
  ];

  return fontCache;
}

/**
 * Component that renders CardLayoutOG through Satori and displays the result
 */
interface SatoriPreviewProps {
  color: number;
  owner?: string;
  avatarUrl?: string;
  ownerDisplayName?: string;
  stars?: number;
  label?: string;
  description?: string;
  files?: number;
  language?: string;
  license?: string;
  createdAt?: string;
  fileCityUrl?: string;
}

const SatoriPreview = ({
  color,
  owner,
  avatarUrl = '/sample-avatar.png',
  ownerDisplayName,
  stars,
  label,
  description,
  files,
  language,
  license,
  createdAt,
  fileCityUrl = '/openclaw-city-transparent.png',
}: SatoriPreviewProps) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const renderSatori = async () => {
      setLoading(true);
      setError(null);

      try {
        const fonts = await loadFonts();
        const result = await satori(
          <div
            style={{
              width: WIDTH,
              height: HEIGHT,
              backgroundColor: '#0a0a0f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                display: 'flex',
              }}
            >
              <CardLayoutOG
                color={color}
                owner={owner}
                avatarUrl={avatarUrl}
                ownerDisplayName={ownerDisplayName}
                stars={stars}
                label={label}
                description={description}
                files={files}
                language={language}
                license={license}
                createdAt={createdAt}
                theme={DEFAULT_OG_THEME}
              >
                <img
                  src={fileCityUrl}
                  alt="File City"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </CardLayoutOG>
            </div>
          </div>,
          {
            width: WIDTH,
            height: HEIGHT,
            fonts,
          }
        );
        setSvg(result);
      } catch (err) {
        console.error('Satori error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    renderSatori();
  }, [
    color,
    owner,
    avatarUrl,
    ownerDisplayName,
    stars,
    label,
    description,
    files,
    language,
    license,
    createdAt,
    fileCityUrl,
  ]);

  if (loading) {
    return (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: '#888',
          fontSize: 24,
        }}
      >
        Rendering with Satori...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          padding: 40,
          backgroundColor: '#2a1a1a',
          color: '#ff6b6b',
          fontFamily: 'monospace',
          fontSize: 14,
          overflow: 'auto',
        }}
      >
        <h2 style={{ color: '#ff4444', marginBottom: 16 }}>Satori Error</h2>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{ marginBottom: 16, color: '#22c55e', fontFamily: 'monospace' }}
      >
        ✓ Satori rendered successfully
      </div>
      <div
        dangerouslySetInnerHTML={{ __html: svg || '' }}
        style={{
          border: '1px solid #333',
          borderRadius: 4,
        }}
      />
    </div>
  );
};

const meta = {
  title: 'Panels/Overworld Map/CardLayoutOG (Satori Test)',
  component: SatoriPreview,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## Satori Compatibility Test

These stories render CardLayoutOG through Satori to catch compatibility issues:
- Missing \`display: flex\` on containers
- Unsupported CSS properties (calc, etc.)
- Invalid style values

If you see a **red error**, the component is not Satori-compatible.
If you see a **green checkmark**, the component renders correctly.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'color' },
    stars: { control: { type: 'number', min: 0, max: 500000 } },
    files: { control: { type: 'number', min: 0, max: 100000 } },
  },
} satisfies Meta<typeof SatoriPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default - Tests basic rendering
 */
export const Default: Story = {
  args: {
    color: languageColors.TypeScript,
    owner: 'facebook',
    ownerDisplayName: 'Meta',
    stars: 220000,
    label: 'react',
    description: 'The library for web and native user interfaces.',
    files: 2847,
    license: 'MIT',
    language: 'TypeScript',
    createdAt: '2013-05-24T00:00:00Z',
  },
};

/**
 * Gold tier stars
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
  },
};

/**
 * No stars - minimal card
 */
export const NoStars: Story = {
  args: {
    color: languageColors.JavaScript,
    owner: 'developer',
    label: 'my-project',
    description: 'A simple project without stars.',
  },
};

/**
 * Long description
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
  },
};

/**
 * No owner - tests conditional rendering
 */
export const NoOwner: Story = {
  args: {
    color: 0x555555,
    stars: 1000,
    label: 'anonymous-repo',
    description: 'A repo without owner info.',
    license: 'MIT',
  },
};
