import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from '@principal-ade/industry-theme';
import type { FileTelemetryCoverage } from '@principal-ade/dynamic-file-tree';
import type { FileTree, DirectoryInfo, FileInfo } from '@principal-ai/repository-abstraction';
import {
  TelemetryCoveragePanelContent,
  TelemetryCoveragePanelPreview,
  PackageTelemetryCoverage,
} from './TelemetryCoveragePanel';
import type { PackageLayer } from '../types/composition';

/**
 * TelemetryCoveragePanelContent displays OpenTelemetry test coverage
 * per package with file tree drill-down.
 */
const meta = {
  title: 'Panels/TelemetryCoveragePanel',
  component: TelemetryCoveragePanelContent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A panel that displays OpenTelemetry test coverage across packages with per-file drill-down.',
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
} satisfies Meta<typeof TelemetryCoveragePanelContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create mock FileInfo
const createFile = (path: string, name: string): FileInfo => ({
  path,
  name,
  extension: name.split('.').pop() || '',
  size: 1024,
  lastModified: new Date(),
  isDirectory: false,
  relativePath: path,
});

// Helper to create mock DirectoryInfo
const createDirectory = (
  path: string,
  name: string,
  children: (DirectoryInfo | FileInfo)[],
  depth: number
): DirectoryInfo => ({
  path,
  name,
  children,
  fileCount: children.filter((c) => 'size' in c).length,
  totalSize: children.reduce((sum, c) => sum + ('size' in c ? c.size : c.totalSize), 0),
  depth,
  relativePath: path,
});

// Helper to create mock package layers
const createMockPackage = (config: {
  name: string;
  path: string;
  version?: string;
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
    path: config.path,
    manifestPath: config.path ? `${config.path}/package.json` : 'package.json',
    packageManager: 'npm',
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    isMonorepoRoot: config.path === '',
    isWorkspace: config.path !== '',
    version: config.version || '1.0.0',
  },
});

// Mock FileTree
const mockFileTree: FileTree = {
  sha: 'mock-sha',
  root: createDirectory('', 'root', [
    createDirectory('src', 'src', [
      createDirectory('src/components', 'components', [
        createFile('src/components/Button.tsx', 'Button.tsx'),
        createFile('src/components/Button.test.tsx', 'Button.test.tsx'),
        createFile('src/components/Modal.tsx', 'Modal.tsx'),
        createFile('src/components/Modal.test.tsx', 'Modal.test.tsx'),
        createFile('src/components/Form.tsx', 'Form.tsx'),
        createFile('src/components/Form.test.tsx', 'Form.test.tsx'),
      ], 2),
      createDirectory('src/hooks', 'hooks', [
        createFile('src/hooks/useAuth.ts', 'useAuth.ts'),
        createFile('src/hooks/useAuth.test.ts', 'useAuth.test.ts'),
        createFile('src/hooks/useApi.ts', 'useApi.ts'),
        createFile('src/hooks/useApi.test.ts', 'useApi.test.ts'),
      ], 2),
    ], 1),
    createFile('package.json', 'package.json'),
  ], 0),
  allFiles: [],
  allDirectories: [],
  stats: {
    totalFiles: 12,
    totalDirectories: 4,
    totalSize: 12288,
    maxDepth: 2,
  },
  metadata: {
    id: 'mock-tree',
    timestamp: new Date(),
    sourceType: 'mock',
    sourceInfo: {},
  },
};

// Mock coverage data for a single package
const mockSingleCoverage: FileTelemetryCoverage[] = [
  {
    filePath: 'src/components/Button.test.tsx',
    status: 'covered',
    tracedTestCount: 5,
    totalTestCount: 5,
    tracedTests: ['renders button', 'handles click', 'applies styles', 'shows loading', 'is disabled'],
  },
  {
    filePath: 'src/components/Modal.test.tsx',
    status: 'partial',
    tracedTestCount: 2,
    totalTestCount: 4,
    tracedTests: ['opens modal', 'closes modal'],
  },
  {
    filePath: 'src/components/Form.test.tsx',
    status: 'none',
    tracedTestCount: 0,
    totalTestCount: 6,
  },
  {
    filePath: 'src/hooks/useAuth.test.ts',
    status: 'covered',
    tracedTestCount: 3,
    totalTestCount: 3,
    tracedTests: ['login', 'logout', 'refresh'],
  },
  {
    filePath: 'src/hooks/useApi.test.ts',
    status: 'none',
    tracedTestCount: 0,
    totalTestCount: 4,
  },
];

// Sample packages for monorepo
const samplePackages: PackageLayer[] = [
  createMockPackage({ name: 'my-app', path: '', version: '1.0.0' }),
  createMockPackage({ name: '@my-app/ui', path: 'packages/ui', version: '0.1.0' }),
  createMockPackage({ name: '@my-app/utils', path: 'packages/utils', version: '0.1.0' }),
  createMockPackage({ name: '@my-app/api', path: 'packages/api', version: '0.2.0' }),
];

// Sample coverage data for monorepo
const sampleCoverageData: PackageTelemetryCoverage[] = [
  {
    packageId: 'package-my-app',
    packageName: 'my-app',
    packagePath: '',
    traceFilePath: '__traces__/test-run.canvas.json',
    files: [
      { filePath: 'src/App.test.tsx', status: 'covered', tracedTestCount: 8, totalTestCount: 8 },
      { filePath: 'src/index.test.ts', status: 'partial', tracedTestCount: 2, totalTestCount: 5 },
    ],
  },
  {
    packageId: 'package-@my-app/ui',
    packageName: '@my-app/ui',
    packagePath: 'packages/ui',
    traceFilePath: 'packages/ui/__traces__/test-run.canvas.json',
    files: [
      { filePath: 'packages/ui/src/Button.test.tsx', status: 'covered', tracedTestCount: 12, totalTestCount: 12 },
      { filePath: 'packages/ui/src/Modal.test.tsx', status: 'covered', tracedTestCount: 6, totalTestCount: 6 },
      { filePath: 'packages/ui/src/Form.test.tsx', status: 'partial', tracedTestCount: 4, totalTestCount: 10 },
    ],
  },
  {
    packageId: 'package-@my-app/utils',
    packageName: '@my-app/utils',
    packagePath: 'packages/utils',
    files: [
      { filePath: 'packages/utils/src/helpers.test.ts', status: 'none', tracedTestCount: 0, totalTestCount: 15 },
      { filePath: 'packages/utils/src/format.test.ts', status: 'none', tracedTestCount: 0, totalTestCount: 8 },
    ],
  },
  {
    packageId: 'package-@my-app/api',
    packageName: '@my-app/api',
    packagePath: 'packages/api',
    traceFilePath: 'packages/api/__traces__/integration.canvas.json',
    files: [
      { filePath: 'packages/api/src/routes.test.ts', status: 'covered', tracedTestCount: 20, totalTestCount: 20 },
      { filePath: 'packages/api/src/middleware.test.ts', status: 'partial', tracedTestCount: 5, totalTestCount: 12 },
    ],
  },
];

/**
 * Monorepo with multiple packages showing per-package coverage
 */
export const Default: Story = {
  args: {
    packages: samplePackages,
    coverageData: sampleCoverageData,
    fileTree: mockFileTree,
    onFileSelect: (filePath, packagePath) => {
      console.log('File selected:', filePath, 'in package:', packagePath || 'root');
    },
    onPackageSelect: (pkg) => {
      console.log('Package selected:', pkg?.packageData.name || 'none');
    },
    onViewTrace: (traceFilePath, packagePath) => {
      console.log('View trace:', traceFilePath, 'in package:', packagePath || 'root');
    },
  },
};

/**
 * Single package project (not a monorepo)
 */
export const SinglePackage: Story = {
  args: {
    packages: [createMockPackage({ name: 'my-simple-app', path: '' })],
    coverageData: [
      {
        packageId: 'package-my-simple-app',
        packageName: 'my-simple-app',
        packagePath: '',
        traceFilePath: '__traces__/test-run.canvas.json',
        files: mockSingleCoverage,
      },
    ],
    fileTree: mockFileTree,
    onFileSelect: (filePath) => {
      console.log('File selected:', filePath);
    },
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    packages: [],
    coverageData: [],
    isLoading: true,
  },
};

/**
 * Error state
 */
export const Error: Story = {
  args: {
    packages: [],
    coverageData: [],
    error: 'Failed to load telemetry coverage data. Please ensure tests have been run with OpenTelemetry instrumentation.',
  },
};

/**
 * No packages detected
 */
export const NoPackages: Story = {
  args: {
    packages: [],
    coverageData: [],
  },
};

/**
 * High coverage (80%+)
 */
export const HighCoverage: Story = {
  args: {
    packages: samplePackages.slice(0, 2),
    coverageData: [
      {
        packageId: 'package-my-app',
        packageName: 'my-app',
        packagePath: '',
        traceFilePath: '__traces__/test-run.canvas.json',
        files: [
          { filePath: 'src/App.test.tsx', status: 'covered', tracedTestCount: 10, totalTestCount: 10 },
          { filePath: 'src/index.test.ts', status: 'covered', tracedTestCount: 5, totalTestCount: 5 },
          { filePath: 'src/utils.test.ts', status: 'covered', tracedTestCount: 8, totalTestCount: 8 },
        ],
      },
      {
        packageId: 'package-@my-app/ui',
        packageName: '@my-app/ui',
        packagePath: 'packages/ui',
        traceFilePath: 'packages/ui/__traces__/test-run.canvas.json',
        files: [
          { filePath: 'packages/ui/src/Button.test.tsx', status: 'covered', tracedTestCount: 12, totalTestCount: 12 },
          { filePath: 'packages/ui/src/Modal.test.tsx', status: 'covered', tracedTestCount: 8, totalTestCount: 8 },
        ],
      },
    ],
    fileTree: mockFileTree,
  },
};

/**
 * Low coverage (< 50%)
 */
export const LowCoverage: Story = {
  args: {
    packages: samplePackages.slice(0, 2),
    coverageData: [
      {
        packageId: 'package-my-app',
        packageName: 'my-app',
        packagePath: '',
        files: [
          { filePath: 'src/App.test.tsx', status: 'none', tracedTestCount: 0, totalTestCount: 10 },
          { filePath: 'src/index.test.ts', status: 'none', tracedTestCount: 0, totalTestCount: 5 },
        ],
      },
      {
        packageId: 'package-@my-app/ui',
        packageName: '@my-app/ui',
        packagePath: 'packages/ui',
        files: [
          { filePath: 'packages/ui/src/Button.test.tsx', status: 'partial', tracedTestCount: 2, totalTestCount: 12 },
          { filePath: 'packages/ui/src/Modal.test.tsx', status: 'none', tracedTestCount: 0, totalTestCount: 8 },
        ],
      },
    ],
    fileTree: mockFileTree,
  },
};

/**
 * No coverage data (no tests traced)
 */
export const NoCoverage: Story = {
  args: {
    packages: samplePackages,
    coverageData: samplePackages.map((pkg) => ({
      packageId: pkg.id,
      packageName: pkg.packageData.name,
      packagePath: pkg.packageData.path,
      files: [],
    })),
    fileTree: mockFileTree,
  },
};

/**
 * Mixed coverage across packages
 */
export const MixedCoverage: Story = {
  args: {
    packages: samplePackages,
    coverageData: sampleCoverageData,
    fileTree: mockFileTree,
  },
};

/**
 * Many packages (large monorepo)
 */
export const ManyPackages: Story = {
  args: {
    packages: [
      createMockPackage({ name: 'monorepo-root', path: '' }),
      createMockPackage({ name: '@scope/core', path: 'packages/core' }),
      createMockPackage({ name: '@scope/ui', path: 'packages/ui' }),
      createMockPackage({ name: '@scope/utils', path: 'packages/utils' }),
      createMockPackage({ name: '@scope/api', path: 'packages/api' }),
      createMockPackage({ name: '@scope/cli', path: 'packages/cli' }),
      createMockPackage({ name: '@scope/types', path: 'packages/types' }),
      createMockPackage({ name: '@scope/config', path: 'packages/config' }),
      createMockPackage({ name: '@scope/testing', path: 'packages/testing' }),
    ],
    coverageData: [
      { packageId: 'package-monorepo-root', packageName: 'monorepo-root', packagePath: '', files: [] },
      {
        packageId: 'package-@scope/core',
        packageName: '@scope/core',
        packagePath: 'packages/core',
        traceFilePath: 'packages/core/__traces__/test.canvas.json',
        files: [
          { filePath: 'packages/core/src/index.test.ts', status: 'covered', tracedTestCount: 20, totalTestCount: 20 },
        ],
      },
      {
        packageId: 'package-@scope/ui',
        packageName: '@scope/ui',
        packagePath: 'packages/ui',
        traceFilePath: 'packages/ui/__traces__/test.canvas.json',
        files: [
          { filePath: 'packages/ui/src/Button.test.tsx', status: 'covered', tracedTestCount: 15, totalTestCount: 15 },
          { filePath: 'packages/ui/src/Modal.test.tsx', status: 'partial', tracedTestCount: 5, totalTestCount: 10 },
        ],
      },
      {
        packageId: 'package-@scope/utils',
        packageName: '@scope/utils',
        packagePath: 'packages/utils',
        files: [
          { filePath: 'packages/utils/src/helpers.test.ts', status: 'none', tracedTestCount: 0, totalTestCount: 25 },
        ],
      },
      {
        packageId: 'package-@scope/api',
        packageName: '@scope/api',
        packagePath: 'packages/api',
        traceFilePath: 'packages/api/__traces__/integration.canvas.json',
        files: [
          { filePath: 'packages/api/src/routes.test.ts', status: 'covered', tracedTestCount: 30, totalTestCount: 30 },
        ],
      },
      {
        packageId: 'package-@scope/cli',
        packageName: '@scope/cli',
        packagePath: 'packages/cli',
        files: [
          { filePath: 'packages/cli/src/commands.test.ts', status: 'partial', tracedTestCount: 8, totalTestCount: 20 },
        ],
      },
      {
        packageId: 'package-@scope/types',
        packageName: '@scope/types',
        packagePath: 'packages/types',
        files: [],
      },
      {
        packageId: 'package-@scope/config',
        packageName: '@scope/config',
        packagePath: 'packages/config',
        traceFilePath: 'packages/config/__traces__/test.canvas.json',
        files: [
          { filePath: 'packages/config/src/loader.test.ts', status: 'covered', tracedTestCount: 12, totalTestCount: 12 },
        ],
      },
      {
        packageId: 'package-@scope/testing',
        packageName: '@scope/testing',
        packagePath: 'packages/testing',
        files: [
          { filePath: 'packages/testing/src/mocks.test.ts', status: 'partial', tracedTestCount: 3, totalTestCount: 10 },
        ],
      },
    ],
    fileTree: mockFileTree,
  },
};

/**
 * Preview component - shown in panel switcher
 */
export const Preview: StoryObj<typeof TelemetryCoveragePanelPreview> = {
  render: () => (
    <ThemeProvider>
      <div style={{ width: '200px', background: '#1a1a1a', borderRadius: '8px' }}>
        <TelemetryCoveragePanelPreview />
      </div>
    </ThemeProvider>
  ),
};
