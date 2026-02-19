/**
 * Package Expansion Test - Demonstrates multiple buildings per repository
 *
 * Shows how repositories with multiple packages are visualized as
 * clustered buildings, with each building sized by its package file count.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { PackageExpansionTest } from './PackageExpansionTest';

const meta = {
  title: 'Panels/Overworld Map/Package Expansion Test',
  component: PackageExpansionTest,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PackageExpansionTest>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Baseline: Single Repository (Existing Behavior)
 *
 * A repository without packages shows as a single building.
 * Size based on total repository file count.
 */
export const SingleRepository: Story = {
  args: {
    title: 'Single Repository',
    packages: [
      {
        id: 'owner/single-repo',
        name: 'single-repo',
        size: 3.0, // Large repository (10K+ files)
        category: 'node',
        language: 'typescript',
      },
    ],
  },
};

/**
 * Repository with 3 Packages
 *
 * A monorepo with 3 packages shows as 3 clustered buildings in same footprint.
 * Each building sized based on its individual package file count.
 */
export const RepositoryWith3Packages: Story = {
  args: {
    title: 'Repository with 3 Packages (Clustered)',
    packages: [
      {
        id: 'owner/my-app',
        name: 'my-app',
        size: 2.5, // Overall repo size
        category: 'node',
        language: 'typescript',
        // Subdivision: 3 packages within this footprint
        subPackages: [
          { name: 'web', size: 2.5 },
          { name: 'api', size: 2.0 },
          { name: 'shared', size: 1.5 },
        ],
      },
    ],
  },
};

/**
 * Mixed Repositories
 *
 * Shows 2 repositories with packages + 3 single repositories.
 * Demonstrates that package subdivision only affects multi-package repos.
 */
export const MixedRepositories: Story = {
  args: {
    title: 'Mixed Repositories (2 Monorepos + 3 Single Repos)',
    packages: [
      // Monorepo 1: my-app with 3 packages (subdivided)
      {
        id: 'owner/my-app',
        name: 'my-app',
        size: 2.5,
        category: 'node',
        language: 'typescript',
        subPackages: [
          { name: 'web', size: 2.5 },
          { name: 'api', size: 2.0 },
          { name: 'shared', size: 1.5 },
        ],
      },

      // Monorepo 2: backend with 2 packages (subdivided)
      {
        id: 'owner/backend',
        name: 'backend',
        size: 2.5,
        category: 'python',
        language: 'python',
        subPackages: [
          { name: 'core', size: 2.5 },
          { name: 'workers', size: 2.0 },
        ],
      },

      // Single repos (no subdivision)
      {
        id: 'owner/mobile-app',
        name: 'mobile-app',
        size: 2.5,
        category: 'node',
        language: 'typescript',
      },
      {
        id: 'owner/infrastructure',
        name: 'infrastructure',
        size: 1.5,
        category: 'node',
        language: 'typescript',
      },
      {
        id: 'owner/docs',
        name: 'docs',
        size: 1.0,
        category: 'node',
        language: 'typescript',
      },
    ],
  },
};

/**
 * Large Monorepo (10 Packages)
 *
 * Demonstrates tight clustering of many packages within a single repository footprint.
 * Shows 10 smaller buildings arranged in the space one large building would occupy.
 */
export const LargeMonorepo: Story = {
  args: {
    title: 'Large Monorepo (10 Packages Subdivided)',
    packages: [
      {
        id: 'owner/monorepo',
        name: 'monorepo',
        size: 3.5, // Large overall footprint
        category: 'node',
        language: 'typescript',
        subPackages: [
          { name: 'frontend-web', size: 3.0 },
          { name: 'frontend-mobile', size: 2.5 },
          { name: 'api-gateway', size: 2.5 },
          { name: 'api-auth', size: 2.0 },
          { name: 'api-users', size: 2.0 },
          { name: 'api-products', size: 2.0 },
          { name: 'shared-types', size: 1.5 },
          { name: 'shared-utils', size: 1.5 },
          { name: 'shared-ui', size: 2.0 },
          { name: 'config', size: 1.0 },
        ],
      },
    ],
  },
};

/**
 * Multi-Language Packages
 *
 * Shows packages from different ecosystems (Node, Python, Rust, Go).
 * Each repository has subdivided packages in its own footprint.
 */
export const MultiLanguagePackages: Story = {
  args: {
    title: 'Multi-Language Packages (TypeScript, Python, Rust, Go)',
    packages: [
      // TypeScript monorepo
      {
        id: 'owner/fullstack',
        name: 'fullstack',
        size: 2.5,
        category: 'node',
        language: 'typescript',
        subPackages: [
          { name: 'web', size: 2.5 },
          { name: 'api', size: 2.0 },
        ],
      },

      // Python monorepo
      {
        id: 'owner/ml-services',
        name: 'ml-services',
        size: 2.5,
        category: 'python',
        language: 'python',
        subPackages: [
          { name: 'training', size: 2.5 },
          { name: 'inference', size: 2.0 },
        ],
      },

      // Rust monorepo
      {
        id: 'owner/engine',
        name: 'engine',
        size: 2.0,
        category: 'cargo',
        language: 'rust',
        subPackages: [
          { name: 'core', size: 2.0 },
          { name: 'cli', size: 1.5 },
        ],
      },

      // Go monorepo
      {
        id: 'owner/services',
        name: 'services',
        size: 2.0,
        category: 'go',
        language: 'go',
        subPackages: [
          { name: 'gateway', size: 2.0 },
          { name: 'worker', size: 1.5 },
        ],
      },
    ],
  },
};
