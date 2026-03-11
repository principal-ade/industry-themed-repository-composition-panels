/**
 * RepoSprite Stories - Demonstrates the standalone repository sprite component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '@principal-ade/industry-theme';
import { RepoSprite } from './components/RepoSprite';

const meta = {
  title: 'Panels/Overworld Map/RepoSprite',
  component: RepoSprite,
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
    size: {
      control: { type: 'range', min: 1.0, max: 4.0, step: 0.5 },
      description: 'Size multiplier (1.0 - 4.0)',
    },
    color: {
      control: 'color',
      description: 'Building color',
    },
    stars: {
      control: { type: 'number', min: 0, max: 10000 },
      description: 'GitHub star count',
    },
    collaborators: {
      control: { type: 'number', min: 0, max: 500 },
      description: 'Collaborator count',
    },
    files: {
      control: { type: 'number', min: 0, max: 100000 },
      description: 'Number of files',
    },
    width: {
      control: { type: 'number', min: 100, max: 400 },
    },
    height: {
      control: { type: 'number', min: 100, max: 400 },
    },
    backgroundColor: {
      control: 'color',
      description: 'Background color (transparent if not set)',
    },
    showBoundary: {
      control: 'boolean',
      description: 'Show isometric diamond boundary',
    },
    boundaryColor: {
      control: 'color',
      description: 'Boundary color',
    },
    license: {
      control: 'select',
      options: [
        'MIT',
        'Apache-2.0',
        'GPL-3.0',
        'BSD-3-Clause',
        'ISC',
        'UNLICENSED',
      ],
      description: 'SPDX license identifier',
    },
    label: {
      control: 'text',
      description: 'Repository name (shown on license sign)',
    },
    variant: {
      control: 'select',
      options: ['default', 'card'],
      description: 'Display variant',
    },
  },
} satisfies Meta<typeof RepoSprite>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default building sprite
 */
export const Default: Story = {
  args: {
    size: 2.0,
    color: '#d2691e',
    width: 200,
    height: 200,
  },
};

/**
 * Small repository (100 files)
 */
export const Small: Story = {
  args: {
    size: 1.0,
    color: '#3b82f6',
    width: 150,
    height: 150,
  },
};

/**
 * Medium repository (1,000 files)
 */
export const Medium: Story = {
  args: {
    size: 2.0,
    color: '#22c55e',
    width: 200,
    height: 200,
  },
};

/**
 * Large repository (10,000 files)
 */
export const Large: Story = {
  args: {
    size: 3.0,
    color: '#8b5cf6',
    width: 250,
    height: 250,
  },
};

/**
 * Huge repository (100,000 files)
 */
export const Huge: Story = {
  args: {
    size: 4.0,
    color: '#ef4444',
    width: 300,
    height: 300,
  },
};

/**
 * With star decoration (flag tier: 1-99 stars)
 */
export const WithFlagDecoration: Story = {
  args: {
    size: 2.0,
    color: '#d2691e',
    stars: 50,
    width: 200,
    height: 200,
  },
};

/**
 * With trophy decoration (100-999 stars)
 */
export const WithTrophyDecoration: Story = {
  args: {
    size: 2.5,
    color: '#fbbf24',
    stars: 500,
    width: 220,
    height: 220,
  },
};

/**
 * With statue decoration (1000+ stars)
 */
export const WithStatueDecoration: Story = {
  args: {
    size: 3.0,
    color: '#ec4899',
    stars: 5000,
    width: 250,
    height: 250,
  },
};

/**
 * With collaborator decoration (bench tier: 1-10 collaborators)
 */
export const WithBenchDecoration: Story = {
  args: {
    size: 2.0,
    color: '#06b6d4',
    collaborators: 5,
    width: 200,
    height: 200,
  },
};

/**
 * With both decorations
 */
export const WithBothDecorations: Story = {
  args: {
    size: 2.5,
    color: '#8b5cf6',
    stars: 250,
    collaborators: 30,
    width: 250,
    height: 250,
  },
};

/**
 * Popular repository with all decorations
 */
export const PopularRepository: Story = {
  args: {
    size: 3.5,
    color: '#f97316',
    stars: 2500,
    collaborators: 150,
    width: 300,
    height: 300,
  },
};

/**
 * With dark background
 */
export const WithDarkBackground: Story = {
  args: {
    size: 2.5,
    color: '#22c55e',
    stars: 100,
    width: 220,
    height: 220,
    backgroundColor: 0x1a1a1a,
  },
};

/**
 * Without boundary
 */
export const WithoutBoundary: Story = {
  args: {
    size: 2.0,
    color: '#3b82f6',
    width: 200,
    height: 200,
    showBoundary: false,
  },
};

/**
 * Custom boundary color
 */
export const CustomBoundaryColor: Story = {
  args: {
    size: 2.5,
    color: '#8b5cf6',
    width: 220,
    height: 220,
    boundaryColor: 0x00ffff,
  },
};

/**
 * With MIT License
 */
export const WithMITLicense: Story = {
  args: {
    size: 2.5,
    color: '#22c55e',
    license: 'MIT',
    label: 'my-package',
    width: 250,
    height: 250,
  },
};

/**
 * With Apache License
 */
export const WithApacheLicense: Story = {
  args: {
    size: 2.5,
    color: '#3b82f6',
    license: 'Apache-2.0',
    label: 'apache-project',
    width: 250,
    height: 250,
  },
};

/**
 * With GPL License
 */
export const WithGPLLicense: Story = {
  args: {
    size: 2.5,
    color: '#ef4444',
    license: 'GPL-3.0',
    label: 'gpl-project',
    width: 250,
    height: 250,
  },
};

/**
 * Full featured - all decorations
 */
export const FullFeatured: Story = {
  args: {
    size: 3.0,
    color: '#8b5cf6',
    stars: 1500,
    collaborators: 75,
    license: 'MIT',
    label: 'popular-repo',
    width: 300,
    height: 300,
  },
};

/**
 * Card variant - styled card with metadata
 */
export const CardVariant: Story = {
  args: {
    size: 2.0,
    color: '#8b5cf6',
    files: 1250,
    stars: 1234,
    collaborators: 56,
    license: 'MIT',
    label: 'awesome-repo',
    variant: 'card',
    width: 180,
    height: 180,
  },
};

/**
 * Card variant - minimal
 */
export const CardMinimal: Story = {
  args: {
    size: 1.5,
    color: '#22c55e',
    label: 'my-package',
    variant: 'card',
    width: 150,
    height: 150,
  },
};

/**
 * Card variant - popular repository
 */
export const CardPopular: Story = {
  args: {
    size: 2.5,
    color: '#f97316',
    files: 8500,
    stars: 45200,
    collaborators: 312,
    license: 'Apache-2.0',
    label: 'super-framework',
    variant: 'card',
    width: 200,
    height: 200,
  },
};

/**
 * Monorepo with 2 packages
 */
export const Monorepo2Packages: Story = {
  args: {
    size: 2.5,
    packages: [
      { name: '@scope/core', color: '#3b82f6' },
      { name: '@scope/utils', color: '#22c55e' },
    ],
    label: 'my-monorepo',
    variant: 'card',
    width: 200,
    height: 200,
  },
};

/**
 * Monorepo with 3 packages
 */
export const Monorepo3Packages: Story = {
  args: {
    size: 2.5,
    packages: [
      { name: '@scope/core', color: '#3b82f6' },
      { name: '@scope/utils', color: '#22c55e' },
      { name: '@scope/cli', color: '#f97316' },
    ],
    stars: 1200,
    collaborators: 45,
    license: 'MIT',
    label: 'workspace',
    variant: 'card',
    width: 220,
    height: 220,
  },
};

/**
 * Monorepo with 4 packages
 */
export const Monorepo4Packages: Story = {
  args: {
    size: 3.0,
    packages: [
      { name: '@ui/components', color: '#8b5cf6' },
      { name: '@ui/hooks', color: '#ec4899' },
      { name: '@ui/utils', color: '#06b6d4' },
      { name: '@ui/themes', color: '#f97316' },
    ],
    stars: 5600,
    collaborators: 120,
    license: 'MIT',
    label: 'design-system',
    variant: 'card',
    width: 250,
    height: 250,
  },
};

/**
 * Monorepo with many packages (grid layout)
 */
export const MonorepoManyPackages: Story = {
  args: {
    size: 3.5,
    packages: [
      { name: '@tools/cli', color: '#ef4444' },
      { name: '@tools/core', color: '#f97316' },
      { name: '@tools/utils', color: '#fbbf24' },
      { name: '@tools/config', color: '#22c55e' },
      { name: '@tools/logger', color: '#06b6d4' },
      { name: '@tools/cache', color: '#3b82f6' },
      { name: '@tools/http', color: '#8b5cf6' },
      { name: '@tools/auth', color: '#ec4899' },
    ],
    stars: 12000,
    collaborators: 250,
    license: 'Apache-2.0',
    label: 'enterprise-toolkit',
    variant: 'card',
    width: 280,
    height: 280,
  },
};

/**
 * Monorepo default variant (no card)
 */
export const MonorepoDefault: Story = {
  args: {
    size: 2.5,
    packages: [
      { name: 'pkg-a', color: '#3b82f6' },
      { name: 'pkg-b', color: '#22c55e' },
      { name: 'pkg-c', color: '#f97316' },
    ],
    width: 250,
    height: 250,
  },
};

/**
 * Card gallery - multiple cards
 */
export const CardGallery: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <RepoSprite
        size={2.0}
        color="#3b82f6"
        stars={1500}
        collaborators={45}
        license="MIT"
        label="react-hooks"
        variant="card"
        width={160}
        height={160}
      />
      <RepoSprite
        size={2.0}
        color="#22c55e"
        stars={890}
        collaborators={23}
        license="Apache-2.0"
        label="go-server"
        variant="card"
        width={160}
        height={160}
      />
      <RepoSprite
        size={2.0}
        color="#ef4444"
        stars={3200}
        collaborators={89}
        license="GPL-3.0"
        label="linux-tools"
        variant="card"
        width={160}
        height={160}
      />
      <RepoSprite
        size={2.0}
        color="#8b5cf6"
        stars={560}
        label="design-system"
        variant="card"
        width={160}
        height={160}
      />
    </div>
  ),
};

/**
 * Size comparison gallery
 */
export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
      <div style={{ textAlign: 'center' }}>
        <RepoSprite size={1.0} color="#3b82f6" width={100} height={100} />
        <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
          1.0x
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <RepoSprite size={1.5} color="#22c55e" width={130} height={130} />
        <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
          1.5x
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <RepoSprite size={2.0} color="#fbbf24" width={160} height={160} />
        <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
          2.0x
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <RepoSprite size={2.5} color="#f97316" width={190} height={190} />
        <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
          2.5x
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <RepoSprite size={3.0} color="#ef4444" width={220} height={220} />
        <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
          3.0x
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <RepoSprite size={4.0} color="#8b5cf6" width={280} height={280} />
        <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
          4.0x
        </div>
      </div>
    </div>
  ),
};

/**
 * Color palette showcase
 */
export const ColorPalette: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
      }}
    >
      {[
        '#ef4444',
        '#f97316',
        '#fbbf24',
        '#22c55e',
        '#06b6d4',
        '#3b82f6',
        '#8b5cf6',
        '#ec4899',
      ].map((color) => (
        <div key={color} style={{ textAlign: 'center' }}>
          <RepoSprite size={2.0} color={color} width={120} height={120} />
          <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
            {color}
          </div>
        </div>
      ))}
    </div>
  ),
};
