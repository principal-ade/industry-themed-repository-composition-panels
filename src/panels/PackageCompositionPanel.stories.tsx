import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from '@principal-ade/industry-theme';
import {
  PackageCompositionPanelContent,
  PackageCompositionPanelPreview,
} from './PackageCompositionPanel';
import type {
  PackageLayer,
  PackageCommand,
  ConfigFile,
} from '../types/composition';

/**
 * PackageCompositionPanelContent displays detected packages with their
 * config files and available commands in an expandable card format.
 */
const meta = {
  title: 'Panels/PackageCompositionPanel',
  component: PackageCompositionPanelContent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A panel that displays package composition including config files and available commands.',
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
} satisfies Meta<typeof PackageCompositionPanelContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create mock package layers
const createMockPackage = (config: {
  packageData: Partial<PackageLayer['packageData']> & { name: string };
  configFiles?: PackageLayer['configFiles'];
  qualityMetrics?: PackageLayer['qualityMetrics'];
  type?: PackageLayer['type'];
}): PackageLayer => ({
  id: `package-${config.packageData.name}`,
  name: config.packageData.name,
  type: config.type ?? 'node',
  enabled: true,
  derivedFrom: {
    fileSets: [],
    derivationType: 'presence',
    description: 'Detected from package.json',
  },
  packageData: {
    name: config.packageData.name,
    path: config.packageData.path ?? '',
    manifestPath: config.packageData.manifestPath ?? 'package.json',
    packageManager: config.packageData.packageManager ?? 'npm',
    dependencies: config.packageData.dependencies ?? {},
    devDependencies: config.packageData.devDependencies ?? {},
    peerDependencies: config.packageData.peerDependencies ?? {},
    isMonorepoRoot: config.packageData.isMonorepoRoot ?? false,
    isWorkspace: config.packageData.isWorkspace ?? false,
    isPrivate: config.packageData.isPrivate ?? false,
    version: config.packageData.version,
    license: config.packageData.license,
    availableCommands: config.packageData.availableCommands,
    monorepoMetadata: config.packageData.monorepoMetadata,
  },
  configFiles: config.configFiles,
  qualityMetrics: config.qualityMetrics,
});

// Sample packages with internal dependencies
const samplePackages: PackageLayer[] = [
  createMockPackage({
    packageData: {
      name: 'my-app',
      version: '1.0.0',
      license: 'MIT',
      path: '',
      manifestPath: 'package.json',
      packageManager: 'npm',
      isMonorepoRoot: true,
      isWorkspace: false,
      isPrivate: true,
      monorepoMetadata: {
        orchestrator: 'turbo',
        orchestratorConfigPath: 'turbo.json',
        workspacePatterns: ['packages/*'],
        definedTasks: [
          { name: 'build', tool: 'turbo' },
          { name: 'test', tool: 'turbo' },
          { name: 'lint', tool: 'turbo' },
        ],
      },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        '@tanstack/react-query': '^5.0.0',
        // Internal dependencies
        '@my-app/ui': 'workspace:*',
        '@my-app/utils': 'workspace:*',
      },
      devDependencies: {
        typescript: '^5.0.0',
        vite: '^6.0.0',
        eslint: '^9.0.0',
        prettier: '^3.0.0',
        vitest: '^2.0.0',
      },
      peerDependencies: {},
      availableCommands: [
        { name: 'dev', command: 'vite', type: 'script' },
        { name: 'build', command: 'vite build', type: 'script' },
        {
          name: 'test',
          command: 'vitest',
          type: 'script',
          isLensCommand: true,
          lensId: 'vitest',
          lensOperation: 'check',
        },
        {
          name: 'lint',
          command: 'eslint .',
          type: 'script',
          isLensCommand: true,
          lensId: 'eslint',
          lensOperation: 'check',
        },
        {
          name: 'typecheck',
          command: 'tsc --noEmit',
          type: 'script',
          isLensCommand: true,
          lensId: 'typescript',
          lensOperation: 'check',
        },
      ],
    },
    configFiles: {
      typescript: { path: 'tsconfig.json', exists: true, type: 'json' },
      eslint: { path: 'eslint.config.js', exists: true, type: 'js' },
      prettier: { path: '.prettierrc', exists: true, type: 'json' },
      vite: { path: 'vite.config.ts', exists: true, type: 'ts' },
    },
  }),
  createMockPackage({
    packageData: {
      name: '@my-app/ui',
      version: '0.1.0',
      license: 'MIT',
      path: 'packages/ui',
      manifestPath: 'packages/ui/package.json',
      packageManager: 'npm',
      isMonorepoRoot: false,
      isWorkspace: true,
      dependencies: {
        react: '^19.0.0',
        clsx: '^2.0.0',
        // Internal dependency
        '@my-app/utils': 'workspace:*',
      },
      devDependencies: {
        typescript: '^5.0.0',
        '@storybook/react': '^8.0.0',
      },
      peerDependencies: {},
      availableCommands: [
        { name: 'build', command: 'tsup', type: 'script' },
        { name: 'storybook', command: 'storybook dev', type: 'script' },
      ],
    },
    configFiles: {
      typescript: {
        path: 'packages/ui/tsconfig.json',
        exists: true,
        type: 'json',
      },
      eslint: {
        path: 'eslint.config.js',
        exists: true,
        type: 'js',
        isInherited: true,
        inheritedFrom: 'root',
      },
      prettier: {
        path: '.prettierrc',
        exists: true,
        type: 'json',
        isInherited: true,
        inheritedFrom: 'root',
      },
    },
    qualityMetrics: {
      hexagon: {
        tests: 80,
        linting: 90,
        formatting: 95,
        types: 85,
        deadCode: 70,
        documentation: 60,
      },
      availableLenses: ['eslint', 'prettier', 'typescript'],
      lensReadiness: {
        eslint: {
          lensId: 'eslint',
          displayName: 'ESLint',
          ready: true,
          partial: false,
          readyViaInheritance: true,
          inheritedChecks: 1,
          checks: [
            {
              requirement: {
                type: 'devDependency',
                name: 'eslint',
                description: 'ESLint package',
              },
              satisfied: true,
              foundValue: '^9.0.0',
            },
            {
              requirement: {
                type: 'config',
                name: 'eslint.config.js',
                description: 'ESLint config',
              },
              satisfied: true,
              isInherited: true,
              inheritedFrom: 'root',
            },
          ],
          missing: [],
          ecosystem: 'node',
          toolAvailability: {
            installed: true,
            configured: true,
            hasRunCommand: false,
            source: 'dependency',
            version: '^9.0.0',
          },
          installInstructions: {
            command: 'npm install -D eslint',
            alternatives: {
              pnpm: 'pnpm add -D eslint',
              yarn: 'yarn add -D eslint',
              bun: 'bun add -D eslint',
            },
          },
          defaultCommand: 'eslint .',
          isToolchainTool: false,
        },
        prettier: {
          lensId: 'prettier',
          displayName: 'Prettier',
          ready: true,
          partial: false,
          readyViaInheritance: true,
          inheritedChecks: 1,
          checks: [
            {
              requirement: {
                type: 'devDependency',
                name: 'prettier',
                description: 'Prettier package',
              },
              satisfied: true,
              foundValue: '^3.0.0',
            },
            {
              requirement: {
                type: 'config',
                name: '.prettierrc',
                description: 'Prettier config',
              },
              satisfied: true,
              isInherited: true,
              inheritedFrom: 'root',
            },
          ],
          missing: [],
          ecosystem: 'node',
          toolAvailability: {
            installed: true,
            configured: true,
            hasRunCommand: false,
            source: 'dependency',
            version: '^3.0.0',
          },
          installInstructions: {
            command: 'npm install -D prettier',
            alternatives: {
              pnpm: 'pnpm add -D prettier',
              yarn: 'yarn add -D prettier',
              bun: 'bun add -D prettier',
            },
          },
          defaultCommand: 'prettier --check .',
          isToolchainTool: false,
        },
        typescript: {
          lensId: 'typescript',
          displayName: 'TypeScript',
          ready: true,
          partial: false,
          checks: [
            {
              requirement: {
                type: 'devDependency',
                name: 'typescript',
                description: 'TypeScript compiler',
              },
              satisfied: true,
              foundValue: '^5.0.0',
            },
            {
              requirement: {
                type: 'config',
                name: 'tsconfig.json',
                description: 'TypeScript config',
              },
              satisfied: true,
              foundValue: 'packages/ui/tsconfig.json',
            },
          ],
          missing: [],
          ecosystem: 'node',
          toolAvailability: {
            installed: true,
            configured: true,
            hasRunCommand: false,
            source: 'dependency',
            version: '^5.0.0',
          },
          installInstructions: {
            command: 'npm install -D typescript',
            alternatives: {
              pnpm: 'pnpm add -D typescript',
              yarn: 'yarn add -D typescript',
              bun: 'bun add -D typescript',
            },
          },
          defaultCommand: 'tsc --noEmit',
          isToolchainTool: false,
        },
      },
    },
  }),
  createMockPackage({
    packageData: {
      name: '@my-app/utils',
      version: '0.1.0',
      license: 'MIT',
      path: 'packages/utils',
      manifestPath: 'packages/utils/package.json',
      packageManager: 'npm',
      isMonorepoRoot: false,
      isWorkspace: true,
      dependencies: {},
      devDependencies: {
        typescript: '^5.0.0',
        vitest: '^2.0.0',
      },
      peerDependencies: {},
      availableCommands: [
        { name: 'build', command: 'tsup', type: 'script' },
        {
          name: 'test',
          command: 'vitest',
          type: 'script',
          isLensCommand: true,
          lensId: 'vitest',
        },
      ],
    },
    configFiles: {
      typescript: {
        path: 'packages/utils/tsconfig.json',
        exists: true,
        type: 'json',
      },
      vitest: {
        path: 'packages/utils/vitest.config.ts',
        exists: true,
        type: 'ts',
      },
      eslint: {
        path: 'eslint.config.js',
        exists: true,
        type: 'js',
        isInherited: true,
        inheritedFrom: 'root',
      },
      prettier: {
        path: '.prettierrc',
        exists: true,
        type: 'json',
        isInherited: true,
        inheritedFrom: 'root',
      },
    },
  }),
  createMockPackage({
    packageData: {
      name: '@my-app/api',
      version: '0.1.0',
      license: 'Apache-2.0',
      path: 'packages/api',
      manifestPath: 'packages/api/package.json',
      packageManager: 'npm',
      isMonorepoRoot: false,
      isWorkspace: true,
      dependencies: {
        express: '^4.18.0',
        // Internal dependency
        '@my-app/utils': 'workspace:*',
      },
      devDependencies: {
        typescript: '^5.0.0',
        '@types/express': '^4.17.0',
      },
      peerDependencies: {},
      availableCommands: [
        { name: 'dev', command: 'tsx watch src/index.ts', type: 'script' },
        { name: 'build', command: 'tsup', type: 'script' },
      ],
    },
    configFiles: {
      typescript: {
        path: 'packages/api/tsconfig.json',
        exists: true,
        type: 'json',
      },
      eslint: {
        path: 'eslint.config.js',
        exists: true,
        type: 'js',
        isInherited: true,
        inheritedFrom: 'root',
      },
      prettier: {
        path: '.prettierrc',
        exists: true,
        type: 'json',
        isInherited: true,
        inheritedFrom: 'root',
      },
    },
  }),
];

/**
 * Default panel with multiple packages (monorepo structure)
 */
export const Default: Story = {
  args: {
    packages: samplePackages,
    onCommandClick: (_command: PackageCommand, _packagePath: string) => {},
    onConfigClick: (_config: ConfigFile) => {},
    onPackageClick: (_packagePath: string) => {},
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    packages: [],
    isLoading: true,
  },
};

/**
 * No packages detected
 */
export const NoPackages: Story = {
  args: {
    packages: [],
  },
};

/**
 * Single package (simple project)
 */
export const SinglePackage: Story = {
  args: {
    packages: [samplePackages[0]],
  },
};

/**
 * Package with many commands
 */
export const ManyCommands: Story = {
  args: {
    packages: [
      createMockPackage({
        packageData: {
          name: 'large-project',
          version: '2.0.0',
          path: '',
          manifestPath: 'package.json',
          packageManager: 'pnpm',
          isMonorepoRoot: false,
          isWorkspace: false,
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            '@tanstack/react-query': '^5.0.0',
            '@tanstack/react-router': '^1.0.0',
            zod: '^3.0.0',
            axios: '^1.0.0',
            'date-fns': '^3.0.0',
            lodash: '^4.0.0',
            immer: '^10.0.0',
            zustand: '^4.0.0',
          },
          devDependencies: {
            typescript: '^5.0.0',
            vite: '^6.0.0',
            vitest: '^2.0.0',
            eslint: '^9.0.0',
            prettier: '^3.0.0',
            '@types/react': '^19.0.0',
            '@types/node': '^22.0.0',
            '@types/lodash': '^4.0.0',
            'happy-dom': '^15.0.0',
            '@testing-library/react': '^16.0.0',
          },
          peerDependencies: {},
          availableCommands: [
            { name: 'dev', command: 'vite', type: 'script' },
            { name: 'build', command: 'vite build', type: 'script' },
            { name: 'preview', command: 'vite preview', type: 'script' },
            {
              name: 'test',
              command: 'vitest',
              type: 'script',
              isLensCommand: true,
              lensId: 'vitest',
            },
            {
              name: 'test:coverage',
              command: 'vitest --coverage',
              type: 'script',
              isLensCommand: true,
              lensId: 'vitest',
              lensOperation: 'coverage',
            },
            {
              name: 'lint',
              command: 'eslint .',
              type: 'script',
              isLensCommand: true,
              lensId: 'eslint',
            },
            {
              name: 'lint:fix',
              command: 'eslint . --fix',
              type: 'script',
              isLensCommand: true,
              lensId: 'eslint',
              lensOperation: 'fix',
            },
            {
              name: 'format',
              command: 'prettier --write .',
              type: 'script',
              isLensCommand: true,
              lensId: 'prettier',
              lensOperation: 'fix',
            },
            {
              name: 'typecheck',
              command: 'tsc --noEmit',
              type: 'script',
              isLensCommand: true,
              lensId: 'typescript',
            },
          ],
        },
        configFiles: {
          typescript: { path: 'tsconfig.json', exists: true, type: 'json' },
          eslint: { path: 'eslint.config.js', exists: true, type: 'js' },
          prettier: { path: '.prettierrc', exists: true, type: 'json' },
          vite: { path: 'vite.config.ts', exists: true, type: 'ts' },
          vitest: { path: 'vitest.config.ts', exists: true, type: 'ts' },
        },
      }),
    ],
  },
};

/**
 * Package with inline configs
 */
export const WithInlineConfigs: Story = {
  args: {
    packages: [
      createMockPackage({
        packageData: {
          name: 'simple-project',
          version: '1.0.0',
          path: '',
          manifestPath: 'package.json',
          packageManager: 'npm',
          isMonorepoRoot: false,
          isWorkspace: false,
          dependencies: {
            react: '^19.0.0',
          },
          devDependencies: {
            eslint: '^9.0.0',
            prettier: '^3.0.0',
          },
          peerDependencies: {},
          availableCommands: [
            { name: 'lint', command: 'eslint .', type: 'script' },
          ],
        },
        configFiles: {
          eslint: {
            path: 'package.json',
            exists: true,
            type: 'json',
            isInline: true,
            inlineField: 'eslintConfig',
          },
          prettier: {
            path: 'package.json',
            exists: true,
            type: 'json',
            isInline: true,
            inlineField: 'prettier',
          },
        },
      }),
    ],
  },
};

/**
 * Python package
 */
export const PythonPackage: Story = {
  args: {
    packages: [
      createMockPackage({
        type: 'python',
        packageData: {
          name: 'my-python-app',
          version: '0.1.0',
          path: '',
          manifestPath: 'pyproject.toml',
          packageManager: 'poetry',
          isMonorepoRoot: false,
          isWorkspace: false,
          dependencies: {
            fastapi: '^0.100.0',
            pydantic: '^2.0.0',
            sqlalchemy: '^2.0.0',
          },
          devDependencies: {
            pytest: '^8.0.0',
            ruff: '^0.5.0',
            mypy: '^1.0.0',
          },
          peerDependencies: {},
          availableCommands: [
            {
              name: 'serve',
              command: 'uvicorn main:app --reload',
              type: 'script',
            },
            {
              name: 'test',
              command: 'pytest',
              type: 'script',
              isLensCommand: true,
              lensId: 'pytest',
            },
            {
              name: 'lint',
              command: 'ruff check .',
              type: 'script',
              isLensCommand: true,
              lensId: 'ruff',
            },
            {
              name: 'typecheck',
              command: 'mypy .',
              type: 'script',
              isLensCommand: true,
              lensId: 'mypy',
            },
          ],
        },
        configFiles: {
          pytest: { path: 'pytest.ini', exists: true, type: 'ini' },
          ruff: { path: 'ruff.toml', exists: true, type: 'toml' },
          mypy: { path: 'mypy.ini', exists: true, type: 'ini' },
        },
      }),
    ],
  },
};

/**
 * Different monorepo orchestrators
 */
export const MonorepoOrchestrators: Story = {
  args: {
    packages: [
      createMockPackage({
        packageData: {
          name: 'turbo-monorepo',
          version: '1.0.0',
          path: '',
          manifestPath: 'package.json',
          packageManager: 'npm',
          isMonorepoRoot: true,
          isWorkspace: false,
          monorepoMetadata: {
            orchestrator: 'turbo',
            orchestratorConfigPath: 'turbo.json',
            workspacePatterns: ['packages/*'],
          },
          dependencies: {},
          devDependencies: { turbo: '^2.0.0' },
          peerDependencies: {},
          availableCommands: [],
        },
        configFiles: {},
      }),
      createMockPackage({
        packageData: {
          name: 'nx-monorepo',
          version: '1.0.0',
          path: 'examples/nx',
          manifestPath: 'examples/nx/package.json',
          packageManager: 'npm',
          isMonorepoRoot: true,
          isWorkspace: false,
          monorepoMetadata: {
            orchestrator: 'nx',
            orchestratorConfigPath: 'nx.json',
            workspacePatterns: ['packages/*'],
          },
          dependencies: {},
          devDependencies: { nx: '^19.0.0' },
          peerDependencies: {},
          availableCommands: [],
        },
        configFiles: {},
      }),
      createMockPackage({
        packageData: {
          name: 'pnpm-monorepo',
          version: '1.0.0',
          path: 'examples/pnpm',
          manifestPath: 'examples/pnpm/package.json',
          packageManager: 'pnpm',
          isMonorepoRoot: true,
          isWorkspace: false,
          monorepoMetadata: {
            orchestrator: 'pnpm',
            orchestratorConfigPath: 'pnpm-workspace.yaml',
            workspacePatterns: ['packages/*'],
          },
          dependencies: {},
          devDependencies: {},
          peerDependencies: {},
          availableCommands: [],
        },
        configFiles: {},
      }),
      createMockPackage({
        packageData: {
          name: 'lerna-monorepo',
          version: '1.0.0',
          path: 'examples/lerna',
          manifestPath: 'examples/lerna/package.json',
          packageManager: 'npm',
          isMonorepoRoot: true,
          isWorkspace: false,
          monorepoMetadata: {
            orchestrator: 'lerna',
            orchestratorConfigPath: 'lerna.json',
            workspacePatterns: ['packages/*'],
          },
          dependencies: {},
          devDependencies: { lerna: '^8.0.0' },
          peerDependencies: {},
          availableCommands: [],
        },
        configFiles: {},
      }),
      createMockPackage({
        packageData: {
          name: 'rush-monorepo',
          version: '1.0.0',
          path: 'examples/rush',
          manifestPath: 'examples/rush/package.json',
          packageManager: 'npm',
          isMonorepoRoot: true,
          isWorkspace: false,
          monorepoMetadata: {
            orchestrator: 'rush',
            orchestratorConfigPath: 'rush.json',
            workspacePatterns: ['packages/*'],
          },
          dependencies: {},
          devDependencies: {},
          peerDependencies: {},
          availableCommands: [],
        },
        configFiles: {},
      }),
    ],
  },
};

/**
 * Package with environment variables documentation
 */
export const WithEnvVariables: Story = {
  args: {
    packages: [
      createMockPackage({
        packageData: {
          name: 'api-service',
          version: '1.0.0',
          path: '',
          manifestPath: 'package.json',
          packageManager: 'npm',
          isMonorepoRoot: false,
          isWorkspace: false,
          dependencies: {
            express: '^4.18.0',
            pg: '^8.11.0',
            redis: '^4.6.0',
          },
          devDependencies: {
            typescript: '^5.0.0',
            dotenv: '^16.0.0',
          },
          peerDependencies: {},
          availableCommands: [
            { name: 'dev', command: 'tsx watch src/index.ts', type: 'script' },
            { name: 'build', command: 'tsc', type: 'script' },
          ],
        },
        configFiles: {
          typescript: { path: 'tsconfig.json', exists: true, type: 'json' },
          envExample: { path: '.env.example', exists: true, type: 'custom' },
        },
      }),
    ],
    readFile: async (filePath: string) => {
      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (filePath.includes('.env.example')) {
        return `# === Database ===

# Database connection string
# https://www.postgresql.org/docs/current/libpq-connect.html
# required
DATABASE_URL=

# Redis connection URL
# https://redis.io/docs/connect/
# required
REDIS_URL=redis://localhost:6379

# === Server ===

# Server port
PORT=3000

# Enable debug logging
DEBUG=false

# === External Services ===

# API key for external service
# Get your key at https://example.com/dashboard/api-keys
# required
API_KEY=

# JWT secret for authentication
# required
JWT_SECRET=`;
      }
      throw new Error('File not found');
    },
    onCommandClick: (_command: PackageCommand, _packagePath: string) => {},
    onConfigClick: (_config: ConfigFile) => {},
    onPackageClick: (_packagePath: string) => {},
  },
};

/**
 * Package with env.json format
 */
export const WithEnvJson: Story = {
  args: {
    packages: [
      createMockPackage({
        packageData: {
          name: 'backend-service',
          version: '2.0.0',
          path: '',
          manifestPath: 'package.json',
          packageManager: 'npm',
          isMonorepoRoot: false,
          isWorkspace: false,
          dependencies: {
            fastify: '^4.0.0',
            prisma: '^5.0.0',
          },
          devDependencies: {
            typescript: '^5.0.0',
          },
          peerDependencies: {},
          availableCommands: [
            { name: 'dev', command: 'tsx watch src/index.ts', type: 'script' },
          ],
        },
        configFiles: {
          typescript: { path: 'tsconfig.json', exists: true, type: 'json' },
          envJson: { path: 'env.json', exists: true, type: 'json' },
        },
      }),
    ],
    readFile: async (filePath: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (filePath.includes('env.json')) {
        return JSON.stringify({
          variables: [
            {
              name: 'DATABASE_URL',
              description: 'PostgreSQL connection string for the main database',
              required: true,
              example: 'postgresql://user:pass@localhost:5432/mydb',
              group: 'Database',
              link: 'https://www.postgresql.org/docs/current/libpq-connect.html',
            },
            {
              name: 'REDIS_URL',
              description: 'Redis connection URL for caching and sessions',
              required: true,
              default: 'redis://localhost:6379',
              group: 'Database',
              link: 'https://redis.io/docs/connect/',
            },
            {
              name: 'PORT',
              description: 'Port number for the HTTP server',
              required: false,
              default: '3000',
              group: 'Server',
            },
            {
              name: 'LOG_LEVEL',
              description: 'Logging verbosity level',
              required: false,
              default: 'info',
              group: 'Server',
            },
            {
              name: 'STRIPE_API_KEY',
              description: 'Stripe API key for payment processing',
              required: true,
              group: 'Payments',
              link: 'https://dashboard.stripe.com/apikeys',
            },
            {
              name: 'SENDGRID_API_KEY',
              description: 'SendGrid API key for sending emails',
              required: false,
              group: 'Email',
              link: 'https://app.sendgrid.com/settings/api_keys',
            },
          ],
        });
      }
      throw new Error('File not found');
    },
    onCommandClick: (_command: PackageCommand, _packagePath: string) => {},
    onConfigClick: (_config: ConfigFile) => {},
    onPackageClick: (_packagePath: string) => {},
  },
};

/**
 * Expo app with expo.extra configuration
 *
 * Demonstrates environment variables detection from Expo's app.json expo.extra field.
 * This is the fallback when no traditional .env.example or env.json is present.
 */
export const ExpoAppWithExtraConfig: Story = {
  args: {
    packages: [
      createMockPackage({
        packageData: {
          name: 'my-expo-app',
          version: '1.0.0',
          path: '',
          manifestPath: 'package.json',
          packageManager: 'npm',
          isMonorepoRoot: false,
          isWorkspace: false,
          dependencies: {
            expo: '~52.0.0',
            'expo-router': '~4.0.0',
            react: '^19.0.0',
            'react-native': '0.76.0',
          },
          devDependencies: {
            typescript: '^5.0.0',
            '@types/react': '^19.0.0',
          },
          peerDependencies: {},
          availableCommands: [
            { name: 'start', command: 'expo start', type: 'script' },
            { name: 'ios', command: 'expo run:ios', type: 'script' },
            { name: 'android', command: 'expo run:android', type: 'script' },
          ],
        },
        configFiles: {
          typescript: { path: 'tsconfig.json', exists: true, type: 'json' },
          envExpo: {
            path: 'app.json',
            exists: true,
            type: 'json',
            isInline: true,
            inlineField: 'expo.extra',
          },
        },
      }),
    ],
    readFile: async (filePath: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (filePath.includes('app.json')) {
        return JSON.stringify({
          expo: {
            name: 'MyExpoApp',
            slug: 'my-expo-app',
            version: '1.0.0',
            scheme: 'myexpoapp',
            extra: {
              API_URL: 'https://api.example.com',
              SENTRY_DSN: 'https://key@sentry.io/123',
              FEATURE_FLAGS_ENABLED: true,
              MAX_UPLOAD_SIZE: 10485760,
              eas: {
                projectId: 'f1206516-031c-4186-87a2-a4cbdbdb1e9a',
              },
            },
          },
        });
      }
      throw new Error('File not found');
    },
    onCommandClick: (_command: PackageCommand, _packagePath: string) => {},
    onConfigClick: (_config: ConfigFile) => {},
    onPackageClick: (_packagePath: string) => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows environment variables from Expo app.json expo.extra field. This format is auto-detected when no .env.example or env.json exists.',
      },
    },
  },
};

/**
 * Private GitHub Repository
 *
 * Demonstrates the panel header for a private GitHub repository.
 * Shows "Private Repo" with a lock icon in the header.
 */
export const PrivateGitHubRepo: Story = {
  args: {
    packages: samplePackages,
    isGitHubPublic: false,
    onCommandClick: (_command: PackageCommand, _packagePath: string) => {},
    onConfigClick: (_config: ConfigFile) => {},
    onPackageClick: (_packagePath: string) => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows "Private Repo" in the header with a lock icon when the GitHub repository is private.',
      },
    },
  },
};

/**
 * Public GitHub Repository
 *
 * Demonstrates the panel header for a public GitHub repository.
 * Shows "Public Repo" with a globe icon in the header.
 */
export const PublicGitHubRepo: Story = {
  args: {
    packages: samplePackages,
    isGitHubPublic: true,
    onCommandClick: (_command: PackageCommand, _packagePath: string) => {},
    onConfigClick: (_config: ConfigFile) => {},
    onPackageClick: (_packagePath: string) => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows "Public Repo" in the header with a globe icon when the GitHub repository is public.',
      },
    },
  },
};

/**
 * Private vs Public packages (npm)
 *
 * Demonstrates the private package indicator (lock icon) for npm packages.
 * - Private packages show a lock icon next to their name
 * - Hovering shows a tooltip explaining the package won't be published to npm
 * - Typically monorepo roots and internal apps are private
 */
export const PrivatePackages: Story = {
  args: {
    packages: [
      createMockPackage({
        packageData: {
          name: 'my-private-monorepo',
          version: '1.0.0',
          license: 'UNLICENSED',
          path: '',
          manifestPath: 'package.json',
          packageManager: 'pnpm',
          isMonorepoRoot: true,
          isWorkspace: false,
          isPrivate: true,
          monorepoMetadata: {
            orchestrator: 'turbo',
            orchestratorConfigPath: 'turbo.json',
            workspacePatterns: ['packages/*', 'apps/*'],
          },
          dependencies: {},
          devDependencies: {
            turbo: '^2.0.0',
            typescript: '^5.0.0',
          },
          peerDependencies: {},
          availableCommands: [
            { name: 'build', command: 'turbo build', type: 'script' },
            { name: 'dev', command: 'turbo dev', type: 'script' },
          ],
        },
        configFiles: {
          typescript: { path: 'tsconfig.json', exists: true, type: 'json' },
        },
      }),
      createMockPackage({
        packageData: {
          name: '@my-org/shared-ui',
          version: '1.2.0',
          license: 'MIT',
          path: 'packages/shared-ui',
          manifestPath: 'packages/shared-ui/package.json',
          packageManager: 'pnpm',
          isMonorepoRoot: false,
          isWorkspace: true,
          isPrivate: false,
          dependencies: {
            react: '^19.0.0',
          },
          devDependencies: {
            typescript: '^5.0.0',
          },
          peerDependencies: {},
          availableCommands: [
            { name: 'build', command: 'tsup', type: 'script' },
          ],
        },
        configFiles: {
          typescript: {
            path: 'packages/shared-ui/tsconfig.json',
            exists: true,
            type: 'json',
          },
        },
      }),
      createMockPackage({
        packageData: {
          name: '@my-org/internal-tools',
          version: '0.1.0',
          license: 'UNLICENSED',
          path: 'packages/internal-tools',
          manifestPath: 'packages/internal-tools/package.json',
          packageManager: 'pnpm',
          isMonorepoRoot: false,
          isWorkspace: true,
          isPrivate: true,
          dependencies: {},
          devDependencies: {
            typescript: '^5.0.0',
          },
          peerDependencies: {},
          availableCommands: [],
        },
        configFiles: {},
      }),
      createMockPackage({
        packageData: {
          name: 'web-app',
          version: '2.0.0',
          license: 'UNLICENSED',
          path: 'apps/web',
          manifestPath: 'apps/web/package.json',
          packageManager: 'pnpm',
          isMonorepoRoot: false,
          isWorkspace: true,
          isPrivate: true,
          dependencies: {
            react: '^19.0.0',
            '@my-org/shared-ui': 'workspace:*',
          },
          devDependencies: {
            typescript: '^5.0.0',
            vite: '^6.0.0',
          },
          peerDependencies: {},
          availableCommands: [
            { name: 'dev', command: 'vite', type: 'script' },
            { name: 'build', command: 'vite build', type: 'script' },
          ],
        },
        configFiles: {
          typescript: {
            path: 'apps/web/tsconfig.json',
            exists: true,
            type: 'json',
          },
          vite: { path: 'apps/web/vite.config.ts', exists: true, type: 'ts' },
        },
      }),
    ],
    onCommandClick: (_command: PackageCommand, _packagePath: string) => {},
    onConfigClick: (_config: ConfigFile) => {},
    onPackageClick: (_packagePath: string) => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows private packages with a lock icon. Private packages (private: true in package.json) are not published to npm. Hover over the lock icon for more details.',
      },
    },
  },
};

/**
 * Cargo Workspace (Rust)
 *
 * Demonstrates handling of Cargo workspace version inheritance.
 * In Cargo workspaces, packages can use `version = {workspace = true}` which
 * gets parsed as an object instead of a string. This story reproduces the
 * issue to ensure proper handling.
 */
export const CargoWorkspace: Story = {
  args: {
    packages: [
      createMockPackage({
        type: 'cargo',
        packageData: {
          name: 'firnflow',
          version: '0.1.0',
          license: 'MIT',
          path: '',
          manifestPath: 'Cargo.toml',
          packageManager: 'cargo',
          isMonorepoRoot: true,
          isWorkspace: true,
          monorepoMetadata: {
            orchestrator: 'none',
            orchestratorConfigPath: 'Cargo.toml',
            workspacePatterns: ['crates/*'],
          },
          dependencies: {},
          devDependencies: {},
          peerDependencies: {},
          availableCommands: [
            { name: 'build', command: 'cargo build', type: 'script' },
            { name: 'test', command: 'cargo test', type: 'script' },
            {
              name: 'clippy',
              command: 'cargo clippy',
              type: 'script',
              isLensCommand: true,
              lensId: 'clippy',
            },
          ],
        },
        configFiles: {},
      }),
      createMockPackage({
        type: 'cargo',
        packageData: {
          name: 'firnflow-api',
          // This is the key test case - version as an object like Cargo workspace
          version: { workspace: true } as any,
          license: { workspace: true } as any,
          path: 'crates/firnflow-api',
          manifestPath: 'crates/firnflow-api/Cargo.toml',
          packageManager: 'cargo',
          isMonorepoRoot: false,
          isWorkspace: true,
          dependencies: {
            'firnflow-core': { workspace: true } as any,
            tokio: '^1.0',
            axum: '^0.7',
          },
          devDependencies: {},
          peerDependencies: {},
          availableCommands: [
            { name: 'build', command: 'cargo build', type: 'script' },
            { name: 'test', command: 'cargo test', type: 'script' },
          ],
        },
        configFiles: {},
      }),
      createMockPackage({
        type: 'cargo',
        packageData: {
          name: 'firnflow-core',
          version: { workspace: true } as any,
          license: { workspace: true } as any,
          path: 'crates/firnflow-core',
          manifestPath: 'crates/firnflow-core/Cargo.toml',
          packageManager: 'cargo',
          isMonorepoRoot: false,
          isWorkspace: true,
          dependencies: {
            serde: '^1.0',
            serde_json: '^1.0',
          },
          devDependencies: {},
          peerDependencies: {},
          availableCommands: [
            { name: 'build', command: 'cargo build', type: 'script' },
            { name: 'test', command: 'cargo test', type: 'script' },
          ],
        },
        configFiles: {},
      }),
    ],
    onCommandClick: (_command: PackageCommand, _packagePath: string) => {},
    onConfigClick: (_config: ConfigFile) => {},
    onPackageClick: (_packagePath: string) => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the Cargo workspace version inheritance issue where version = {workspace: true} is parsed as an object. The panel should handle this gracefully without crashing.',
      },
    },
  },
};

/**
 * Preview component - shown in panel switcher
 */
export const Preview: StoryObj<typeof PackageCompositionPanelPreview> = {
  render: () => (
    <ThemeProvider>
      <div
        style={{ width: '200px', background: '#1a1a1a', borderRadius: '8px' }}
      >
        <PackageCompositionPanelPreview />
      </div>
    </ThemeProvider>
  ),
};
