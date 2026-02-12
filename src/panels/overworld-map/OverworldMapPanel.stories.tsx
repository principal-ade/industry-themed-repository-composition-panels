import type { Meta, StoryObj } from '@storybook/react-vite';
import { OverworldMapPanelContent } from './OverworldMapPanel';
import type { PackageLayer } from '../../types/composition';

/**
 * OverworldMapPanel visualizes package dependencies as an 8-bit
 * Mario-style overworld map with isometric graphics.
 */
const meta = {
  title: 'Panels/OverworldMapPanel',
  component: OverworldMapPanelContent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A retro 8-bit overworld map panel that visualizes package dependencies with pixel art and isometric graphics.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    includeDevDependencies: {
      control: 'boolean',
      description: 'Include development dependencies in the map',
    },
    includePeerDependencies: {
      control: 'boolean',
      description: 'Include peer dependencies in the map',
    },
    width: {
      control: { type: 'number', min: 400, max: 1600, step: 100 },
      description: 'Panel width in pixels',
    },
    height: {
      control: { type: 'number', min: 300, max: 1200, step: 100 },
      description: 'Panel height in pixels',
    },
  },
} satisfies Meta<typeof OverworldMapPanelContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create mock package layers
const createMockPackage = (config: {
  name: string;
  path?: string;
  isMonorepoRoot?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  type?: PackageLayer['type'];
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'pip' | 'poetry' | 'pipenv' | 'cargo' | 'unknown';
}): PackageLayer => ({
  id: `package-${config.name}`,
  name: config.name,
  type: config.type ?? 'node',
  enabled: true,
  derivedFrom: {
    fileSets: [],
    derivationType: 'presence',
    description: 'Detected from package.json',
  },
  packageData: {
    name: config.name,
    path: config.path ?? `packages/${config.name}`,
    manifestPath: config.type === 'python' ? 'pyproject.toml' : config.type === 'cargo' ? 'Cargo.toml' : config.type === 'go' ? 'go.mod' : 'package.json',
    packageManager: config.packageManager ?? (config.type === 'python' ? 'poetry' : config.type === 'cargo' ? 'cargo' : 'npm'),
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

// Polyglot monorepo with different package types
const polyglotPackages: PackageLayer[] = [
  createMockPackage({
    name: '@polyglot/root',
    path: '',
    isMonorepoRoot: true,
    type: 'node',
  }),
  createMockPackage({
    name: '@polyglot/shared-types',
    type: 'node',
  }),
  createMockPackage({
    name: '@polyglot/api-server',
    type: 'python',
    dependencies: {},
  }),
  createMockPackage({
    name: '@polyglot/data-processor',
    type: 'cargo',
    dependencies: {},
  }),
  createMockPackage({
    name: '@polyglot/microservice',
    type: 'go',
    dependencies: {},
  }),
  createMockPackage({
    name: '@polyglot/web-ui',
    type: 'node',
    dependencies: {
      '@polyglot/shared-types': 'workspace:*',
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
 * Default 8-bit overworld map with typical package dependencies.
 * Shows packages as isometric buildings connected by paths.
 */
export const Default: Story = {
  args: {
    packages: monorepoPackages,
    includeDevDependencies: true,
    includePeerDependencies: false,
    width: 800,
    height: 600,
  },
};

/**
 * Polyglot monorepo showing different package types as different themed areas.
 * Node packages are in the grass world, Python in desert, Rust in volcano, Go in ice.
 */
export const PolyglotMonorepo: Story = {
  args: {
    packages: polyglotPackages,
    includeDevDependencies: true,
    includePeerDependencies: false,
    width: 800,
    height: 600,
  },
};

/**
 * Large monorepo with many packages to test the layout algorithm.
 */
export const LargeMonorepo: Story = {
  args: {
    packages: largeMonorepoPackages,
    includeDevDependencies: true,
    includePeerDependencies: false,
    width: 1000,
    height: 700,
  },
};

/**
 * Map without development dependencies.
 * Only production dependencies are shown as paths.
 */
export const ProductionDepsOnly: Story = {
  args: {
    packages: monorepoPackages,
    includeDevDependencies: false,
    includePeerDependencies: false,
    width: 800,
    height: 600,
  },
};

/**
 * Empty state when no packages are detected.
 */
export const Empty: Story = {
  args: {
    packages: [],
    includeDevDependencies: true,
    includePeerDependencies: false,
    width: 800,
    height: 600,
  },
};

/**
 * Single package - shows a lone building with no connections.
 */
export const SinglePackage: Story = {
  args: {
    packages: [
      createMockPackage({
        name: '@single/app',
        path: '',
        isMonorepoRoot: true,
      }),
    ],
    includeDevDependencies: true,
    includePeerDependencies: false,
    width: 800,
    height: 600,
  },
};

/**
 * Multiple Maps - Very large monorepo that gets split into multiple worlds.
 * Navigate between worlds using the arrow buttons.
 * Each map is limited to 12 packages max for optimal viewing.
 */
export const MultipleMaps: Story = {
  args: {
    packages: [
      createMockPackage({
        name: '@mega/root',
        path: '',
        isMonorepoRoot: true,
        dependencies: {
          '@mega/core': 'workspace:*',
          '@mega/utils': 'workspace:*',
        },
      }),
      // World 1 - Core packages
      createMockPackage({ name: '@mega/core' }),
      createMockPackage({ name: '@mega/utils', dependencies: { '@mega/core': 'workspace:*' } }),
      createMockPackage({ name: '@mega/types' }),
      createMockPackage({ name: '@mega/config', dependencies: { '@mega/types': 'workspace:*' } }),
      createMockPackage({ name: '@mega/logger', dependencies: { '@mega/config': 'workspace:*' } }),
      createMockPackage({ name: '@mega/auth', dependencies: { '@mega/core': 'workspace:*' } }),
      createMockPackage({ name: '@mega/database', dependencies: { '@mega/core': 'workspace:*', '@mega/auth': 'workspace:*' } }),
      createMockPackage({ name: '@mega/cache', dependencies: { '@mega/core': 'workspace:*' } }),
      createMockPackage({ name: '@mega/api', dependencies: { '@mega/core': 'workspace:*', '@mega/database': 'workspace:*' } }),
      createMockPackage({ name: '@mega/events', dependencies: { '@mega/core': 'workspace:*' } }),
      // World 2 - Frontend packages
      createMockPackage({ name: '@mega/ui-components', dependencies: { '@mega/types': 'workspace:*' } }),
      createMockPackage({ name: '@mega/web-app', dependencies: { '@mega/ui-components': 'workspace:*', '@mega/api': 'workspace:*' } }),
      createMockPackage({ name: '@mega/admin-app', dependencies: { '@mega/ui-components': 'workspace:*', '@mega/api': 'workspace:*' } }),
      createMockPackage({ name: '@mega/mobile-app', dependencies: { '@mega/api': 'workspace:*' } }),
      createMockPackage({ name: '@mega/design-system', dependencies: { '@mega/ui-components': 'workspace:*' } }),
      createMockPackage({ name: '@mega/icons' }),
      createMockPackage({ name: '@mega/themes' }),
      // World 3 - Tools & CLI
      createMockPackage({ name: '@mega/cli', dependencies: { '@mega/core': 'workspace:*' } }),
      createMockPackage({ name: '@mega/scripts', dependencies: { '@mega/cli': 'workspace:*' } }),
      createMockPackage({ name: '@mega/generators', dependencies: { '@mega/cli': 'workspace:*' } }),
      createMockPackage({ name: '@mega/migrations', dependencies: { '@mega/database': 'workspace:*' } }),
      createMockPackage({ name: '@mega/testing-utils' }),
      createMockPackage({ name: '@mega/dev-server' }),
    ],
    includeDevDependencies: true,
    includePeerDependencies: false,
    width: 800,
    height: 600,
  },
};
