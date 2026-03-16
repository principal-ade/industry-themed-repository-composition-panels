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

// Card dimensions (standard 353×588 at 0.6 aspect ratio)
const CARD_WIDTH = 353;
const CARD_HEIGHT = 588;
const CARD_ASPECT_RATIO = 0.6;

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
          </div>,
          {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
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
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: '#888',
          fontSize: 14,
        }}
      >
        Rendering...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          padding: 16,
          backgroundColor: '#2a1a1a',
          color: '#ff6b6b',
          fontFamily: 'monospace',
          fontSize: 10,
          overflow: 'auto',
        }}
      >
        <h2 style={{ color: '#ff4444', marginBottom: 8 }}>Satori Error</h2>
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

/**
 * Component that renders CardLayoutOG at a specific size
 */
interface SatoriSizedPreviewProps extends SatoriPreviewProps {
  cardWidth: number;
}

const SatoriSizedPreview = ({
  cardWidth,
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
}: SatoriSizedPreviewProps) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const cardHeight = Math.round(cardWidth / CARD_ASPECT_RATIO);

  useEffect(() => {
    const renderSatori = async () => {
      setLoading(true);
      setError(null);

      try {
        const fonts = await loadFonts();
        const result = await satori(
          <div
            style={{
              width: cardWidth,
              height: cardHeight,
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
          </div>,
          {
            width: cardWidth,
            height: cardHeight,
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
    cardWidth,
    cardHeight,
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
          width: cardWidth,
          height: cardHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: '#888',
          fontSize: 14,
        }}
      >
        Rendering...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: cardWidth,
          height: cardHeight,
          padding: 16,
          backgroundColor: '#2a1a1a',
          color: '#ff6b6b',
          fontFamily: 'monospace',
          fontSize: 10,
          overflow: 'auto',
        }}
      >
        <h2 style={{ color: '#ff4444', marginBottom: 8 }}>Satori Error</h2>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 8,
          color: '#888',
          fontFamily: 'monospace',
          fontSize: 12,
        }}
      >
        {cardWidth}×{cardHeight}
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
  title: 'Cards/CardLayoutOG/Satori',
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

/**
 * Long owner name - tests truncation to respect star count
 */
export const LongOwner: Story = {
  args: {
    color: languageColors.TypeScript,
    owner: 'verylongorganizationname',
    ownerDisplayName: 'Very Long Organization Name Inc.',
    stars: 42500,
    label: 'project',
    description:
      'Testing that long owner names truncate properly without overlapping the star count.',
    files: 1234,
    license: 'MIT',
    language: 'TypeScript',
    createdAt: '2020-01-15T00:00:00Z',
  },
};

/**
 * Long repo name - tests name plate font shrinking with fixed height
 */
export const LongRepoName: Story = {
  args: {
    color: languageColors.TypeScript,
    owner: 'facebook',
    ownerDisplayName: 'Meta',
    stars: 45000,
    label: 'react-native-async-storage-community-fork',
    description:
      'Testing that long repo names shrink font but maintain banner height.',
    files: 2500,
    license: 'MIT',
    language: 'TypeScript',
    createdAt: '2019-03-12T00:00:00Z',
  },
};

/**
 * 100 character description - at shrink threshold
 */
export const Description100: Story = {
  args: {
    color: languageColors.Go,
    owner: 'golang',
    stars: 120000,
    label: 'go',
    description:
      'An open source programming language that makes it simple to build secure and scalable systems.',
    files: 11200,
    license: 'BSD-3-Clause',
    language: 'Go',
    createdAt: '2009-11-10T00:00:00Z',
  },
};

/**
 * 150 character description
 */
export const Description150: Story = {
  args: {
    color: languageColors.Swift,
    owner: 'apple',
    stars: 67000,
    label: 'swift',
    description:
      'The Swift Programming Language. Swift is a general-purpose programming language built using a modern approach to safety, performance, and design.',
    files: 8900,
    license: 'Apache-2.0',
    language: 'Swift',
    createdAt: '2014-06-02T00:00:00Z',
  },
};

/**
 * 200 character description
 */
export const Description200: Story = {
  args: {
    color: languageColors.JavaScript,
    owner: 'nodejs',
    stars: 105000,
    label: 'node',
    description:
      'Node.js is a JavaScript runtime built on Chrome V8 engine. It uses an event-driven, non-blocking I/O model that makes it lightweight and efficient for building scalable network applications easily.',
    files: 4500,
    license: 'MIT',
    language: 'JavaScript',
    createdAt: '2009-05-27T00:00:00Z',
  },
};

/**
 * 250 character description
 */
export const Description250: Story = {
  args: {
    color: languageColors.Java,
    owner: 'spring-projects',
    stars: 74000,
    label: 'spring-framework',
    description:
      'Spring Framework provides a comprehensive programming and configuration model for modern Java-based enterprise applications. It offers dependency injection, aspect-oriented programming, and supports reactive programming patterns for cloud deployment.',
    files: 15200,
    license: 'Apache-2.0',
    language: 'Java',
    createdAt: '2004-03-24T00:00:00Z',
  },
};

/**
 * 350 character description - GitHub max
 */
export const Description350: Story = {
  args: {
    color: languageColors.Rust,
    owner: 'rust-lang',
    stars: 95000,
    label: 'rust',
    description:
      'A language empowering everyone to build reliable and efficient software. Rust is blazingly fast and memory-efficient with no runtime or garbage collector. It can power performance-critical services, run on embedded devices, and easily integrate with other languages. Rust rich type system and ownership model guarantee memory-safety and thread-safety at compile time.',
    files: 28500,
    license: 'Apache-2.0',
    language: 'Rust',
    createdAt: '2010-06-16T00:00:00Z',
  },
};

// Shared args for size stories
const sizeStoryArgs = {
  color: languageColors.TypeScript,
  owner: 'verylongorganizationname',
  ownerDisplayName: 'Very Long Organization Name Inc.',
  stars: 220000,
  label: 'react',
  description: 'The library for web and native user interfaces.',
  files: 2847,
  license: 'MIT',
  language: 'TypeScript',
  createdAt: '2013-05-24T00:00:00Z',
};

/**
 * Size XS - 180×300
 */
export const SizeXS: StoryObj<typeof SatoriSizedPreview> = {
  render: (args) => <SatoriSizedPreview {...args} />,
  args: { ...sizeStoryArgs, cardWidth: 180 },
};

/**
 * Size SM - 250×417
 */
export const SizeSM: StoryObj<typeof SatoriSizedPreview> = {
  render: (args) => <SatoriSizedPreview {...args} />,
  args: { ...sizeStoryArgs, cardWidth: 250 },
};

/**
 * Size MD - 353×588 (standard)
 */
export const SizeMD: StoryObj<typeof SatoriSizedPreview> = {
  render: (args) => <SatoriSizedPreview {...args} />,
  args: { ...sizeStoryArgs, cardWidth: 353 },
};

/**
 * Size LG - 450×750
 */
export const SizeLG: StoryObj<typeof SatoriSizedPreview> = {
  render: (args) => <SatoriSizedPreview {...args} />,
  args: { ...sizeStoryArgs, cardWidth: 450 },
};

/**
 * Size XL - 530×883
 */
export const SizeXL: StoryObj<typeof SatoriSizedPreview> = {
  render: (args) => <SatoriSizedPreview {...args} />,
  args: { ...sizeStoryArgs, cardWidth: 530 },
};
