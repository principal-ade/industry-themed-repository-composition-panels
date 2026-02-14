/**
 * Converts PackageLayer data from dependency graph into OverworldMap format
 * This is a specialized implementation using the generic mapper
 */

import type { PackageLayer } from '../../types/composition';
import type {
  OverworldMap,
  OverworldMapCollection,
  LocationNode,
  PathConnection,
  BiomeTheme,
  LocationNodeType,
  Tile,
  GridPoint,
} from './types';
import { MAX_NODES_PER_MAP } from './types';
import { gridToScreen } from './isometricUtils';
import {
  nodesToOverworldMap,
  nodesToUnifiedOverworldMap,
  nodesToOverworldMapCollection,
  type GenericNode,
  type RegionLayout,
} from './genericMapper';

export interface OverworldMapOptions {
  includeDevDependencies?: boolean;
  includePeerDependencies?: boolean;
  mapPadding?: number; // Padding around the map in tiles
  regionLayout?: RegionLayout; // Layout configuration for multi-region maps
}

/**
 * Convert PackageLayer to GenericNode
 */
function packageToGenericNode(
  pkg: PackageLayer,
  packageNames: Set<string>,
  nameToId: Map<string, string>,
  options: OverworldMapOptions
): GenericNode {
  const { includeDevDependencies = true, includePeerDependencies = false } = options;

  // Collect internal dependencies (only packages within the monorepo)
  const dependencies: string[] = [];
  const devDependencies: string[] = [];

  if (pkg.packageData.dependencies) {
    for (const depName of Object.keys(pkg.packageData.dependencies)) {
      if (packageNames.has(depName)) {
        const depId = nameToId.get(depName);
        if (depId) dependencies.push(depId);
      }
    }
  }

  if (includeDevDependencies && pkg.packageData.devDependencies) {
    for (const depName of Object.keys(pkg.packageData.devDependencies)) {
      if (packageNames.has(depName)) {
        const depId = nameToId.get(depName);
        if (depId) devDependencies.push(depId);
      }
    }
  }

  if (includePeerDependencies && pkg.packageData.peerDependencies) {
    for (const depName of Object.keys(pkg.packageData.peerDependencies)) {
      if (packageNames.has(depName)) {
        const depId = nameToId.get(depName);
        if (depId) dependencies.push(depId);
      }
    }
  }

  // Calculate importance based on dependency count (if not provided)
  const depCount = dependencies.length + devDependencies.length;
  const calculatedImportance = Math.min(100, depCount * 10);

  // Use provided importance/size/aging from pkg if available (e.g., from GitProject)
  const importance = pkg.importance ?? calculatedImportance;
  const size = pkg.size; // Size multiplier from repository metrics
  const aging = pkg.aging; // Aging metrics for weathering

  return {
    id: pkg.id,
    name: pkg.packageData.name,
    isRoot: pkg.packageData.isMonorepoRoot,
    category: pkg.type, // 'node', 'python', 'cargo', 'go', etc.
    importance,
    size, // Pass through size for metrics-based scaling
    aging, // Pass through aging for weathering effects
    dependencies,
    devDependencies,
  };
}

/**
 * Convert PackageLayer array to OverworldMap
 * This is a convenience wrapper around the generic mapper
 */
export function packagesToOverworldMap(
  packages: PackageLayer[],
  options: OverworldMapOptions = {}
): OverworldMap {
  // Build package name lookup maps
  const packageNames = new Set(packages.map((p) => p.packageData.name));
  const nameToId = new Map<string, string>();
  packages.forEach((pkg) => {
    nameToId.set(pkg.packageData.name, pkg.id);
  });

  // Convert PackageLayer to GenericNode
  const genericNodes: GenericNode[] = packages.map((pkg) =>
    packageToGenericNode(pkg, packageNames, nameToId, options)
  );

  // Use the generic mapper
  const map = nodesToOverworldMap(genericNodes, {
    includeDevDependencies: options.includeDevDependencies,
    mapPadding: options.mapPadding,
  });

  return {
    ...map,
    name: 'Dependency Overworld',
    description: 'Package dependencies as an 8-bit overworld map',
  };
}

/**
 * Convert PackageLayer array to unified OverworldMap with regions
 * Creates one continuous scrollable map (recommended)
 */
export function packagesToUnifiedOverworldMap(
  packages: PackageLayer[],
  options: OverworldMapOptions = {}
): OverworldMap {
  // Build package name lookup maps
  const packageNames = new Set(packages.map((p) => p.packageData.name));
  const nameToId = new Map<string, string>();
  packages.forEach((pkg) => {
    nameToId.set(pkg.packageData.name, pkg.id);
  });

  // Convert PackageLayer to GenericNode
  const genericNodes: GenericNode[] = packages.map((pkg) =>
    packageToGenericNode(pkg, packageNames, nameToId, options)
  );

  // Use the generic mapper
  const map = nodesToUnifiedOverworldMap(genericNodes, {
    includeDevDependencies: options.includeDevDependencies,
    mapPadding: options.mapPadding,
    regionLayout: options.regionLayout,
  });

  return {
    ...map,
    name: 'Package Dependencies',
    description: `${packages.length} packages across ${map.regions.length} regions`,
  };
}

/**
 * Convert PackageLayer array to OverworldMapCollection
 * @deprecated Use packagesToUnifiedOverworldMap instead for better UX
 * Automatically splits into multiple maps if too many packages
 */
export function packagesToOverworldMapCollection(
  packages: PackageLayer[],
  options: OverworldMapOptions = {}
): OverworldMapCollection {
  // Build package name lookup maps
  const packageNames = new Set(packages.map((p) => p.packageData.name));
  const nameToId = new Map<string, string>();
  packages.forEach((pkg) => {
    nameToId.set(pkg.packageData.name, pkg.id);
  });

  // Convert PackageLayer to GenericNode
  const genericNodes: GenericNode[] = packages.map((pkg) =>
    packageToGenericNode(pkg, packageNames, nameToId, options)
  );

  // Use the generic mapper
  const collection = nodesToOverworldMapCollection(genericNodes, {
    includeDevDependencies: options.includeDevDependencies,
    mapPadding: options.mapPadding,
  });

  // Override names for package-specific context
  collection.maps.forEach((map, index) => {
    map.name = collection.maps.length > 1 ? `World ${index + 1}` : 'Dependency Overworld';
    map.description =
      collection.maps.length > 1
        ? `Map ${index + 1} of ${collection.maps.length}`
        : 'Package dependencies as an 8-bit overworld map';
  });

  return collection;
}
