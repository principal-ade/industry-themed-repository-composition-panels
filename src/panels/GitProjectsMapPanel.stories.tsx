import type { Meta, StoryObj } from '@storybook/react-vite';
import { GitProjectsMapPanelContent } from './GitProjectsMapPanel';
import type { GitProject } from './GitProjectsMapPanel';

/**
 * GitProjectsMapPanel visualizes multiple git repositories as regions
 * on an 8-bit Mario-style overworld map with isometric graphics.
 */
const meta = {
  title: 'Panels/GitProjectsMapPanel',
  component: GitProjectsMapPanelContent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A retro 8-bit overworld map panel that visualizes multiple git projects/repositories across different regions. Navigate between regions with smooth camera panning.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: { type: 'number', min: 400, max: 1600, step: 100 },
      description: 'Panel width in pixels',
    },
    height: {
      control: { type: 'number', min: 300, max: 1200, step: 100 },
      description: 'Panel height in pixels',
    },
  },
} satisfies Meta<typeof GitProjectsMapPanelContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Small organization with a few interconnected projects
const smallOrgProjects: GitProject[] = [
  {
    id: 'web-app',
    name: 'Web App',
    path: '/repos/web-app',
    category: 'frontend',
    importance: 90,
    isRoot: true,
    dependencies: ['api-client', 'shared-ui'],
  },
  {
    id: 'api-client',
    name: 'API Client',
    path: '/repos/api-client',
    category: 'library',
    importance: 80,
    dependencies: ['shared-types'],
  },
  {
    id: 'shared-ui',
    name: 'Shared UI',
    path: '/repos/shared-ui',
    category: 'library',
    importance: 75,
    dependencies: [],
  },
  {
    id: 'shared-types',
    name: 'Shared Types',
    path: '/repos/shared-types',
    category: 'library',
    importance: 70,
    dependencies: [],
  },
  {
    id: 'backend-api',
    name: 'Backend API',
    path: '/repos/backend-api',
    category: 'backend',
    importance: 95,
    isRoot: true,
    dependencies: ['database-lib', 'shared-types'],
  },
  {
    id: 'database-lib',
    name: 'Database',
    path: '/repos/database-lib',
    category: 'backend',
    importance: 85,
    dependencies: [],
  },
];

// Microservices architecture
const microservicesProjects: GitProject[] = [
  {
    id: 'api-gateway',
    name: 'API Gateway',
    path: '/services/api-gateway',
    category: 'backend',
    importance: 95,
    isRoot: true,
    dependencies: ['auth-service', 'user-service', 'order-service'],
  },
  {
    id: 'auth-service',
    name: 'Auth Service',
    path: '/services/auth-service',
    category: 'backend',
    importance: 90,
    dependencies: ['database-common'],
  },
  {
    id: 'user-service',
    name: 'User Service',
    path: '/services/user-service',
    category: 'backend',
    importance: 85,
    dependencies: ['database-common', 'auth-service'],
  },
  {
    id: 'order-service',
    name: 'Order Service',
    path: '/services/order-service',
    category: 'backend',
    importance: 85,
    dependencies: ['database-common', 'payment-service'],
  },
  {
    id: 'payment-service',
    name: 'Payment Service',
    path: '/services/payment-service',
    category: 'backend',
    importance: 90,
    dependencies: ['database-common'],
  },
  {
    id: 'database-common',
    name: 'Database Common',
    path: '/services/database-common',
    category: 'library',
    importance: 80,
    dependencies: [],
  },
  {
    id: 'notification-service',
    name: 'Notifications',
    path: '/services/notification-service',
    category: 'backend',
    importance: 75,
    dependencies: ['database-common'],
  },
];

// Large organization with multiple regions
const largeOrgProjects: GitProject[] = [
  // Frontend projects
  {
    id: 'web-ade',
    name: 'Web ADE',
    path: '/projects/web-ade',
    category: 'frontend',
    importance: 90,
    isRoot: true,
    dependencies: ['shared-ui', 'api-client'],
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    path: '/projects/mobile-app',
    category: 'frontend',
    importance: 85,
    dependencies: ['api-client', 'shared-ui'],
  },
  {
    id: 'admin-panel',
    name: 'Admin Panel',
    path: '/projects/admin-panel',
    category: 'frontend',
    importance: 75,
    dependencies: ['api-client', 'shared-ui', 'design-system'],
  },
  {
    id: 'docs-site',
    name: 'Documentation',
    path: '/projects/docs-site',
    category: 'frontend',
    importance: 50,
    dependencies: [],
  },

  // Shared libraries
  {
    id: 'shared-ui',
    name: 'Shared UI',
    path: '/projects/shared-ui',
    category: 'library',
    importance: 70,
    dependencies: ['design-system'],
  },
  {
    id: 'api-client',
    name: 'API Client',
    path: '/projects/api-client',
    category: 'library',
    importance: 80,
    dependencies: ['shared-types'],
  },
  {
    id: 'shared-types',
    name: 'Shared Types',
    path: '/projects/shared-types',
    category: 'library',
    importance: 60,
    dependencies: [],
  },
  {
    id: 'design-system',
    name: 'Design System',
    path: '/projects/design-system',
    category: 'library',
    importance: 80,
    dependencies: [],
  },

  // Backend services
  {
    id: 'backend-api',
    name: 'Backend API',
    path: '/projects/backend-api',
    category: 'backend',
    importance: 95,
    isRoot: true,
    dependencies: ['database', 'shared-types'],
  },
  {
    id: 'auth-service',
    name: 'Auth Service',
    path: '/projects/auth-service',
    category: 'backend',
    importance: 90,
    dependencies: ['database'],
  },
  {
    id: 'notification-service',
    name: 'Notifications',
    path: '/projects/notification-service',
    category: 'backend',
    importance: 70,
    dependencies: ['database', 'shared-types'],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    path: '/projects/analytics',
    category: 'backend',
    importance: 75,
    dependencies: ['database'],
  },
  {
    id: 'database',
    name: 'Database',
    path: '/projects/database',
    category: 'backend',
    importance: 85,
    dependencies: [],
  },

  // Tools
  {
    id: 'cli-tool',
    name: 'CLI Tool',
    path: '/projects/cli-tool',
    category: 'tool',
    importance: 65,
    dependencies: ['api-client'],
  },
  {
    id: 'testing-utils',
    name: 'Testing Utils',
    path: '/projects/testing-utils',
    category: 'tool',
    importance: 60,
    dependencies: [],
  },
];

/**
 * Default story showing a small organization with 6 interconnected projects.
 * Projects are visualized as 8-bit buildings with connecting paths showing dependencies.
 */
export const Default: Story = {
  args: {
    projects: smallOrgProjects,
    width: 800,
    height: 600,
  },
};

/**
 * Microservices architecture showing a typical service mesh.
 * API Gateway connects to multiple backend services.
 */
export const Microservices: Story = {
  args: {
    projects: microservicesProjects,
    width: 800,
    height: 600,
  },
};

/**
 * Large organization with 15+ projects split into multiple regions.
 * Navigate between regions using the arrow buttons - camera smoothly pans!
 * Each region contains up to 12 projects for optimal viewing.
 */
export const LargeOrganization: Story = {
  args: {
    projects: largeOrgProjects,
    width: 1000,
    height: 700,
  },
};

/**
 * Empty state when no projects are found.
 */
export const Empty: Story = {
  args: {
    projects: [],
    width: 800,
    height: 600,
  },
};

/**
 * Single standalone project with no dependencies.
 */
export const SingleProject: Story = {
  args: {
    projects: [
      {
        id: 'standalone-app',
        name: 'Standalone App',
        path: '/projects/standalone-app',
        category: 'frontend',
        importance: 80,
        isRoot: true,
        dependencies: [],
      },
    ],
    width: 800,
    height: 600,
  },
};

/**
 * Mix of single repos and monorepos showing different building styles.
 * Monorepos appear as clusters of connected buildings.
 * Single repos appear as modern office buildings.
 */
export const GitReposAndMonorepos: Story = {
  args: {
    projects: [
      // Monorepos - large clusters
      {
        id: 'main-monorepo',
        name: 'Main Monorepo',
        path: '/repos/main-monorepo',
        category: 'monorepo',
        importance: 95,
        isRoot: true,
        isMonorepo: true,
        dependencies: ['shared-lib', 'tools-repo'],
      },
      {
        id: 'platform-monorepo',
        name: 'Platform',
        path: '/repos/platform-monorepo',
        category: 'monorepo',
        importance: 90,
        isMonorepo: true,
        dependencies: ['shared-lib'],
      },
      // Single package repos - modern buildings
      {
        id: 'web-app',
        name: 'Web App',
        path: '/repos/web-app',
        category: 'git-repo',
        importance: 80,
        dependencies: ['api-client', 'shared-lib'],
      },
      {
        id: 'mobile-app',
        name: 'Mobile App',
        path: '/repos/mobile-app',
        category: 'git-repo',
        importance: 75,
        dependencies: ['api-client'],
      },
      {
        id: 'api-client',
        name: 'API Client',
        path: '/repos/api-client',
        category: 'git-repo',
        importance: 70,
        dependencies: ['shared-lib'],
      },
      {
        id: 'shared-lib',
        name: 'Shared Library',
        path: '/repos/shared-lib',
        category: 'git-repo',
        importance: 85,
        dependencies: [],
      },
      {
        id: 'tools-repo',
        name: 'Dev Tools',
        path: '/repos/tools',
        category: 'git-repo',
        importance: 60,
        dependencies: [],
      },
      {
        id: 'docs',
        name: 'Documentation',
        path: '/repos/docs',
        category: 'git-repo',
        importance: 50,
        dependencies: [],
      },
    ],
    width: 800,
    height: 600,
  },
};

/**
 * Projects categorized by type (frontend, backend, library, tool).
 * Different categories get different biome themes in the map.
 */
export const CategorizedProjects: Story = {
  args: {
    projects: [
      // Frontend (grass biome)
      {
        id: 'frontend-1',
        name: 'Web App',
        path: '/repos/web',
        category: 'frontend',
        importance: 85,
        dependencies: ['lib-1'],
      },
      {
        id: 'frontend-2',
        name: 'Mobile App',
        path: '/repos/mobile',
        category: 'frontend',
        importance: 80,
        dependencies: ['lib-1'],
      },
      // Backend (desert biome)
      {
        id: 'backend-1',
        name: 'API Server',
        path: '/repos/api',
        category: 'backend',
        importance: 90,
        dependencies: ['lib-2'],
      },
      {
        id: 'backend-2',
        name: 'Database',
        path: '/repos/db',
        category: 'backend',
        importance: 85,
        dependencies: [],
      },
      // Libraries (volcano biome)
      {
        id: 'lib-1',
        name: 'UI Library',
        path: '/repos/ui-lib',
        category: 'library',
        importance: 75,
        dependencies: [],
      },
      {
        id: 'lib-2',
        name: 'Core Library',
        path: '/repos/core-lib',
        category: 'library',
        importance: 80,
        dependencies: [],
      },
      // Tools (ice biome)
      {
        id: 'tool-1',
        name: 'CLI Tool',
        path: '/repos/cli',
        category: 'tool',
        importance: 65,
        dependencies: ['lib-2'],
      },
      {
        id: 'tool-2',
        name: 'Build Tool',
        path: '/repos/build',
        category: 'tool',
        importance: 70,
        dependencies: [],
      },
    ],
    width: 800,
    height: 600,
  },
};
