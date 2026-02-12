/**
 * GitProjectsMapPanel - Visualize multiple git projects as regions on an overworld map
 */

import React, { useMemo } from 'react';
import type { PanelComponentProps } from '../types';
import type { PackageLayer } from '../types/composition';
import { OverworldMapPanelContent } from './overworld-map/OverworldMapPanel';

/**
 * Represents a git project/repository
 */
export interface GitProject {
  /** Unique identifier (e.g., repo name or path) */
  id: string;

  /** Display name */
  name: string;

  /** Path to the git repository */
  path: string;

  /** Category/type of project (e.g., 'frontend', 'backend', 'tool') */
  category?: string;

  /** Importance level 0-100 (affects visual size) */
  importance?: number;

  /** Other projects this one depends on (by id) */
  dependencies?: string[];

  /** Is this a root/primary project? */
  isRoot?: boolean;
}

export interface GitProjectsMapPanelProps {
  /** Git projects to visualize */
  projects: GitProject[];

  /** Panel width */
  width?: number;

  /** Panel height */
  height?: number;

  /** Loading state */
  isLoading?: boolean;
}

/**
 * GitProjectsMapPanelContent Component
 * Renders multiple git projects as regions on an overworld map
 */
export const GitProjectsMapPanelContent: React.FC<GitProjectsMapPanelProps> = ({
  projects,
  width = 800,
  height = 600,
  isLoading = false,
}) => {
  // Convert projects to package-like structure for compatibility
  // We use a type assertion here because the exact PackageLayer structure is complex,
  // but the OverworldMapPanel will convert it to generic nodes anyway
  const packages = useMemo(() => {
    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      path: project.path,
      packageData: {
        name: project.name,
        version: '1.0.0',
        path: project.path,
        manifestPath: `${project.path}/package.json`,
        packageManager: 'unknown' as const,
        dependencies: (project.dependencies || []).reduce((acc, dep) => {
          acc[dep] = '*';
          return acc;
        }, {} as Record<string, string>),
        devDependencies: {},
        peerDependencies: {},
        optionalDependencies: {},
        isMonorepoRoot: project.isRoot || false,
        isWorkspace: !project.isRoot,
        availableCommands: [],
      },
      type: project.category === 'backend' ? 'node' :
            project.category === 'frontend' ? 'node' :
            project.category === 'library' ? 'node' : 'node',
    })) as unknown as PackageLayer[];
  }, [projects]);

  if (projects.length === 0) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          color: '#64748b',
        }}
      >
        No git projects found
      </div>
    );
  }

  return (
    <OverworldMapPanelContent
      packages={packages}
      width={width}
      height={height}
      isLoading={isLoading}
      includeDevDependencies={false}
      includePeerDependencies={false}
    />
  );
};

/**
 * Preview component for panel selection UI
 */
export const GitProjectsMapPanelPreview: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#87ceeb',
        fontFamily: 'monospace',
        fontSize: 14,
        color: '#ffffff',
      }}
    >
      Git Projects Map
    </div>
  );
};

/**
 * Main panel component that integrates with the panel framework
 */
export const GitProjectsMapPanel: React.FC<PanelComponentProps> = ({ context }) => {
  // Example: Define some git projects manually
  // In a real implementation, this would come from scanning the filesystem
  const projects: GitProject[] = useMemo(() => {
    return [
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
        id: 'shared-ui',
        name: 'Shared UI',
        path: '/projects/shared-ui',
        category: 'library',
        importance: 70,
        dependencies: [],
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
        id: 'backend-api',
        name: 'Backend API',
        path: '/projects/backend-api',
        category: 'backend',
        importance: 95,
        isRoot: true,
        dependencies: ['database', 'shared-types'],
      },
      {
        id: 'database',
        name: 'Database',
        path: '/projects/database',
        category: 'backend',
        importance: 85,
        dependencies: [],
      },
      {
        id: 'cli-tool',
        name: 'CLI Tool',
        path: '/projects/cli-tool',
        category: 'tool',
        importance: 65,
        dependencies: ['api-client'],
      },
      {
        id: 'docs-site',
        name: 'Documentation',
        path: '/projects/docs-site',
        category: 'frontend',
        importance: 50,
        dependencies: [],
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
        id: 'testing-utils',
        name: 'Testing Utils',
        path: '/projects/testing-utils',
        category: 'tool',
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
      {
        id: 'admin-panel',
        name: 'Admin Panel',
        path: '/projects/admin-panel',
        category: 'frontend',
        importance: 75,
        dependencies: ['api-client', 'shared-ui', 'design-system'],
      },
    ];
  }, []);

  return (
    <GitProjectsMapPanelContent
      projects={projects}
      isLoading={false}
    />
  );
};
