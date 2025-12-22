import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from '@principal-ade/industry-theme';
import { DependencyGraphPanelContent, DependencyGraphPanelPreview } from './DependencyGraphPanel';
import type { PackageLayer } from '../../types/composition';

/**
 * DependencyGraphPanel visualizes monorepo package dependencies
 * as an interactive graph using the Principal View GraphRenderer.
 */
const meta = {
  title: 'Panels/DependencyGraphPanel',
  component: DependencyGraphPanelContent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A panel that visualizes monorepo package dependencies as an interactive graph.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div style={{ height: '100vh', background: '#1a1a1a' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof DependencyGraphPanelContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create mock package layers
const createMockPackage = (config: {
  name: string;
  path?: string;
  isMonorepoRoot?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}): PackageLayer => ({
  id: `package-${config.name}`,
  name: config.name,
  type: 'node',
  enabled: true,
  derivedFrom: {
    fileSets: [],
    derivationType: 'presence',
    description: 'Detected from package.json',
  },
  packageData: {
    name: config.name,
    path: config.path ?? `packages/${config.name}`,
    manifestPath: 'package.json',
    packageManager: 'npm',
    dependencies: config.dependencies ?? {},
    devDependencies: config.devDependencies ?? {},
    peerDependencies: {},
    isMonorepoRoot: config.isMonorepoRoot ?? false,
    isWorkspace: !config.isMonorepoRoot,
    version: '1.0.0',
    availableCommands: [],
  },
  configFiles: {},
});

// Sample monorepo packages with internal dependencies
const monorepoPackages: PackageLayer[] = [
  createMockPackage({
    name: '@acme/monorepo',
    path: '',
    isMonorepoRoot: true,
    devDependencies: {
      '@acme/cli': 'workspace:*',
      '@acme/ui': 'workspace:*',
    },
  }),
  createMockPackage({
    name: '@acme/core',
    dependencies: {},
  }),
  createMockPackage({
    name: '@acme/utils',
    dependencies: {
      '@acme/core': 'workspace:*',
    },
  }),
  createMockPackage({
    name: '@acme/ui',
    dependencies: {
      '@acme/core': 'workspace:*',
      '@acme/utils': 'workspace:*',
    },
  }),
  createMockPackage({
    name: '@acme/cli',
    dependencies: {
      '@acme/core': 'workspace:*',
      '@acme/utils': 'workspace:*',
    },
  }),
  createMockPackage({
    name: '@acme/app',
    dependencies: {
      '@acme/ui': 'workspace:*',
      '@acme/cli': 'workspace:*',
    },
  }),
];

// Larger monorepo for testing layout
const largeMonorepoPackages: PackageLayer[] = [
  createMockPackage({
    name: '@big/root',
    path: '',
    isMonorepoRoot: true,
  }),
  createMockPackage({ name: '@big/types' }),
  createMockPackage({
    name: '@big/config',
    dependencies: { '@big/types': 'workspace:*' },
  }),
  createMockPackage({
    name: '@big/logger',
    dependencies: { '@big/types': 'workspace:*', '@big/config': 'workspace:*' },
  }),
  createMockPackage({
    name: '@big/database',
    dependencies: { '@big/types': 'workspace:*', '@big/config': 'workspace:*', '@big/logger': 'workspace:*' },
  }),
  createMockPackage({
    name: '@big/cache',
    dependencies: { '@big/types': 'workspace:*', '@big/config': 'workspace:*', '@big/logger': 'workspace:*' },
  }),
  createMockPackage({
    name: '@big/auth',
    dependencies: { '@big/types': 'workspace:*', '@big/database': 'workspace:*', '@big/cache': 'workspace:*' },
  }),
  createMockPackage({
    name: '@big/api',
    dependencies: { '@big/types': 'workspace:*', '@big/auth': 'workspace:*', '@big/database': 'workspace:*' },
  }),
  createMockPackage({
    name: '@big/web',
    dependencies: { '@big/types': 'workspace:*', '@big/api': 'workspace:*', '@big/auth': 'workspace:*' },
  }),
  createMockPackage({
    name: '@big/mobile',
    dependencies: { '@big/types': 'workspace:*', '@big/api': 'workspace:*', '@big/auth': 'workspace:*' },
  }),
];

/**
 * Default monorepo view with typical package dependencies.
 */
export const Default: Story = {
  args: {
    packages: monorepoPackages,
    isLoading: false,
  },
};

/**
 * Large monorepo with many packages to test layout algorithm.
 */
export const LargeMonorepo: Story = {
  args: {
    packages: largeMonorepoPackages,
    isLoading: false,
  },
};

/**
 * Loading state while packages are being fetched.
 */
export const Loading: Story = {
  args: {
    packages: [],
    isLoading: true,
  },
};

/**
 * Empty state when no packages are detected.
 */
export const Empty: Story = {
  args: {
    packages: [],
    isLoading: false,
  },
};

/**
 * Single package repository (no graph needed).
 */
export const SinglePackage: Story = {
  args: {
    packages: [
      createMockPackage({
        name: 'my-single-app',
        path: '',
        isMonorepoRoot: false,
      }),
    ],
    isLoading: false,
  },
};

/**
 * Packages with no internal dependencies.
 */
export const NoInternalDeps: Story = {
  args: {
    packages: [
      createMockPackage({ name: '@isolated/pkg-a' }),
      createMockPackage({ name: '@isolated/pkg-b' }),
      createMockPackage({ name: '@isolated/pkg-c' }),
    ],
    isLoading: false,
  },
};

/**
 * Preview component shown in panel selector.
 */
export const Preview: Story = {
  render: () => (
    <div style={{ width: 200, background: '#2a2a2a', borderRadius: 4 }}>
      <DependencyGraphPanelPreview />
    </div>
  ),
  args: {
    packages: [],
  },
};
