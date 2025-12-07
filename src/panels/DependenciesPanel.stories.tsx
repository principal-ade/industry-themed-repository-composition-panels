import type { Meta, StoryObj } from '@storybook/react-vite';
import { DependenciesPanel } from './DependenciesPanel';
import {
  MockPanelProvider,
  createMockContext,
  createMockActions,
  createMockEvents,
} from '../mocks/panelContext';
import type { DataSlice } from '../types';
import type { PackagesSliceData, PackageLayer } from '../types/dependencies';

/**
 * DependenciesPanel displays package dependencies from the packages slice.
 * It supports filtering by type, searching, and viewing dependency details.
 */
const meta = {
  title: 'Panels/DependenciesPanel',
  component: DependenciesPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A panel for viewing and exploring package dependencies. Supports filtering by type (production, development, peer) and searching by name.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    context: createMockContext(),
    actions: createMockActions(),
    events: createMockEvents(),
  },
} satisfies Meta<typeof DependenciesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create a mock package layer
const createMockPackageLayer = (
  name: string,
  path: string,
  deps: Record<string, string>,
  devDeps: Record<string, string>,
  peerDeps: Record<string, string> = {}
): PackageLayer => ({
  id: `package-${name}`,
  name: `Package: ${name}`,
  type: 'package',
  enabled: true,
  derivedFrom: {
    fileSets: [],
    derivationType: 'presence',
    description: `Package ${name}`,
  },
  packageData: {
    name,
    version: '1.0.0',
    path,
    manifestPath: `${path}/package.json`,
    packageManager: 'npm',
    dependencies: deps,
    devDependencies: devDeps,
    peerDependencies: peerDeps,
    isMonorepoRoot: false,
    isWorkspace: false,
  },
});

// Helper to create packages slice
const createPackagesSlice = (
  packages: PackageLayer[],
  loading = false
): DataSlice<PackagesSliceData> => ({
  scope: 'repository',
  name: 'packages',
  data: {
    packages,
    summary: {
      isMonorepo: packages.length > 1,
      rootPackageName: packages[0]?.packageData.name,
      totalPackages: packages.length,
      workspacePackages: packages.map((p) => ({
        name: p.packageData.name,
        path: p.packageData.path,
      })),
      totalDependencies: packages.reduce(
        (acc, p) => acc + Object.keys(p.packageData.dependencies).length,
        0
      ),
      totalDevDependencies: packages.reduce(
        (acc, p) => acc + Object.keys(p.packageData.devDependencies).length,
        0
      ),
      availableScripts: ['build', 'dev', 'test'],
    },
  },
  loading,
  error: null,
  refresh: async () => {},
});

/**
 * Default state with a single package
 */
export const Default: Story = {
  render: () => {
    const packages = [
      createMockPackageLayer(
        'my-project',
        '',
        {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          lodash: '^4.17.21',
        },
        {
          typescript: '^5.3.0',
          vite: '^6.0.0',
          eslint: '^9.0.0',
          '@types/react': '^19.0.0',
        }
      ),
    ];

    const mockSlices = new Map<string, DataSlice>();
    mockSlices.set('packages', createPackagesSlice(packages));

    return (
      <MockPanelProvider contextOverrides={{ slices: mockSlices }}>
        {(props) => <DependenciesPanel {...props} />}
      </MockPanelProvider>
    );
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  render: () => {
    const mockSlices = new Map<string, DataSlice>();
    mockSlices.set('packages', {
      scope: 'repository',
      name: 'packages',
      data: null,
      loading: true,
      error: null,
      refresh: async () => {},
    });

    return (
      <MockPanelProvider contextOverrides={{ slices: mockSlices }}>
        {(props) => <DependenciesPanel {...props} />}
      </MockPanelProvider>
    );
  },
};

/**
 * No packages available
 */
export const NoPackages: Story = {
  render: () => {
    const mockSlices = new Map<string, DataSlice>();

    return (
      <MockPanelProvider
        contextOverrides={{
          slices: mockSlices,
          hasSlice: () => false,
        }}
      >
        {(props) => <DependenciesPanel {...props} />}
      </MockPanelProvider>
    );
  },
};

/**
 * Package with many dependencies
 */
export const ManyDependencies: Story = {
  render: () => {
    const packages = [
      createMockPackageLayer(
        'large-project',
        '',
        {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          lodash: '^4.17.21',
          axios: '^1.6.0',
          zustand: '^4.4.0',
          'react-query': '^5.0.0',
          'date-fns': '^3.0.0',
          zod: '^3.22.0',
          immer: '^10.0.0',
          clsx: '^2.0.0',
        },
        {
          typescript: '^5.3.0',
          vite: '^5.0.0',
          vitest: '^1.0.0',
          eslint: '^8.55.0',
          prettier: '^3.1.0',
          '@types/react': '^18.2.0',
          '@types/lodash': '^4.14.0',
          '@vitejs/plugin-react': '^4.2.0',
        },
        {
          react: '>=18.0.0',
        }
      ),
    ];

    const mockSlices = new Map<string, DataSlice>();
    mockSlices.set('packages', createPackagesSlice(packages));

    return (
      <MockPanelProvider contextOverrides={{ slices: mockSlices }}>
        {(props) => <DependenciesPanel {...props} />}
      </MockPanelProvider>
    );
  },
};

/**
 * Monorepo with multiple packages
 */
export const Monorepo: Story = {
  render: () => {
    const packages = [
      createMockPackageLayer(
        '@myorg/core',
        'packages/core',
        {
          lodash: '^4.17.21',
          zod: '^3.22.0',
        },
        {
          typescript: '^5.3.0',
          vitest: '^1.0.0',
        }
      ),
      createMockPackageLayer(
        '@myorg/ui',
        'packages/ui',
        {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          '@myorg/core': 'workspace:*',
        },
        {
          typescript: '^5.3.0',
          '@types/react': '^18.2.0',
          storybook: '^8.0.0',
        },
        {
          react: '>=18.0.0',
          'react-dom': '>=18.0.0',
        }
      ),
      createMockPackageLayer(
        '@myorg/app',
        'apps/web',
        {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          '@myorg/core': 'workspace:*',
          '@myorg/ui': 'workspace:*',
          'next': '^14.0.0',
        },
        {
          typescript: '^5.3.0',
          '@types/react': '^18.2.0',
        }
      ),
    ];

    const mockSlices = new Map<string, DataSlice>();
    mockSlices.set('packages', createPackagesSlice(packages));

    return (
      <MockPanelProvider contextOverrides={{ slices: mockSlices }}>
        {(props) => <DependenciesPanel {...props} />}
      </MockPanelProvider>
    );
  },
};

/**
 * Package with only dev dependencies
 */
export const OnlyDevDependencies: Story = {
  render: () => {
    const packages = [
      createMockPackageLayer(
        'dev-tools',
        '',
        {},
        {
          typescript: '^5.3.0',
          eslint: '^8.55.0',
          prettier: '^3.1.0',
          husky: '^8.0.0',
          'lint-staged': '^15.0.0',
        }
      ),
    ];

    const mockSlices = new Map<string, DataSlice>();
    mockSlices.set('packages', createPackagesSlice(packages));

    return (
      <MockPanelProvider contextOverrides={{ slices: mockSlices }}>
        {(props) => <DependenciesPanel {...props} />}
      </MockPanelProvider>
    );
  },
};
