import type { ExtendedCanvas, PVNodeShape, CanvasColor } from '@principal-ai/principal-view-core';
import type { PackageLayer } from '../../types/composition';

/** Root package color (orange) */
const ROOT_COLOR = '#f97316';

/**
 * Hex colors for each language/ecosystem
 */
const LANGUAGE_COLORS: Record<PackageLayer['type'], string> = {
  package: '#06b6d4',  // cyan - generic/JS
  node: '#06b6d4',     // cyan - Node.js/TypeScript
  python: '#fbbf24',   // yellow - Python
  cargo: '#ef4444',    // red - Rust
  go: '#22c55e',       // green - Go
};

export interface DependencyCanvasOptions {
  /** Include devDependencies in the graph */
  includeDevDependencies?: boolean;
  /** Include peerDependencies in the graph */
  includePeerDependencies?: boolean;
  /** Default node width */
  nodeWidth?: number;
  /** Default node height */
  nodeHeight?: number;
}

/**
 * Convert an array of PackageLayer objects (from a monorepo) into an ExtendedCanvas
 * that can be rendered by GraphRenderer.
 *
 * Only internal dependencies (packages within the monorepo) are shown as edges.
 */
export function dependencyTreeToCanvas(
  packages: PackageLayer[],
  options: DependencyCanvasOptions = {}
): ExtendedCanvas {
  const {
    includeDevDependencies = true,
    includePeerDependencies = false,
    nodeWidth = 180,
    nodeHeight = 70,
  } = options;

  // Build a set of package names that exist in this monorepo
  const packageNames = new Set(packages.map((p) => p.packageData.name));

  // Create nodes for each package
  const nodes = packages.map((pkg) => {
    const isRoot = pkg.packageData.isMonorepoRoot;
    const shape: PVNodeShape = isRoot ? 'hexagon' : 'rectangle';
    // Root gets orange, others get color based on language/ecosystem
    const color: CanvasColor = isRoot ? ROOT_COLOR : (LANGUAGE_COLORS[pkg.type] || '#06b6d4');

    return {
      id: pkg.id,
      x: 0, // Will be positioned by layout algorithm
      y: 0,
      width: nodeWidth,
      height: nodeHeight,
      type: 'text' as const,
      text: pkg.packageData.name,
      color,
      pv: {
        nodeType: isRoot ? 'monorepo-root' : 'package',
        shape,
        icon: isRoot ? 'Layers' : 'Package',
      },
    };
  });

  // Build a map from package name to package id for edge creation
  const nameToId = new Map<string, string>();
  for (const pkg of packages) {
    nameToId.set(pkg.packageData.name, pkg.id);
  }

  // Create edges for internal dependencies
  const edges: ExtendedCanvas['edges'] = [];
  const edgeIdSet = new Set<string>();

  for (const pkg of packages) {
    const sourceId = pkg.id;

    // Collect all dependencies to check
    const depsToCheck: Array<{ name: string; type: 'production' | 'development' | 'peer' }> = [];

    // Always include production dependencies
    if (pkg.packageData.dependencies) {
      for (const depName of Object.keys(pkg.packageData.dependencies)) {
        depsToCheck.push({ name: depName, type: 'production' });
      }
    }

    // Optionally include dev dependencies
    if (includeDevDependencies && pkg.packageData.devDependencies) {
      for (const depName of Object.keys(pkg.packageData.devDependencies)) {
        depsToCheck.push({ name: depName, type: 'development' });
      }
    }

    // Optionally include peer dependencies
    if (includePeerDependencies && pkg.packageData.peerDependencies) {
      for (const depName of Object.keys(pkg.packageData.peerDependencies)) {
        depsToCheck.push({ name: depName, type: 'peer' });
      }
    }

    // Create edges only for internal (monorepo) dependencies
    for (const dep of depsToCheck) {
      if (packageNames.has(dep.name)) {
        const targetId = nameToId.get(dep.name);
        if (targetId && targetId !== sourceId) {
          // Create a unique edge ID to avoid duplicates
          const edgeId = `${sourceId}->${targetId}`;
          if (!edgeIdSet.has(edgeId)) {
            edgeIdSet.add(edgeId);
            edges.push({
              id: edgeId,
              fromNode: sourceId,
              toNode: targetId,
              fromSide: 'bottom',
              toSide: 'top',
              pv: {
                edgeType: dep.type === 'development' ? 'dev-dependency' : 'dependency',
              },
            });
          }
        }
      }
    }
  }

  return {
    nodes,
    edges,
    pv: {
      version: '1.0.0',
      name: 'Monorepo Dependencies',
      description: 'Auto-generated dependency graph from package.json files',
      edgeTypes: {
        dependency: {
          style: 'solid' as const,
          color: '#6366f1',
          width: 2,
          directed: true,
        },
        'dev-dependency': {
          style: 'dashed' as const,
          color: '#94a3b8',
          width: 1,
          directed: true,
        },
      },
    },
  };
}
