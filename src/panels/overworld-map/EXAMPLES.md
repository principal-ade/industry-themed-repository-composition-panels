# Overworld Map Examples

The overworld map system is **generic** and can be used for any node/edge graph visualization, not just packages!

## Architecture

- **Generic Layer** (`genericMapper.ts`) - Core mapping logic for any nodes
- **Package Adapter** (`dataConverter.ts`) - Converts `PackageLayer` to generic nodes
- **Visual Layer** (`OverworldMapPanel.tsx`) - Renders the map

## Example 1: Repository Dependencies

Map repositories that depend on each other:

```typescript
import {
  nodesToOverworldMapCollection,
  type GenericNode,
} from '@industry-theme/repository-composition-panels';

// Your repository data
interface Repository {
  id: string;
  name: string;
  language: string;
  isMainRepo: boolean;
  dependencies: string[]; // IDs of repos this depends on
}

// Example repos
const repos: Repository[] = [
  {
    id: 'repo-1',
    name: 'main-api',
    language: 'typescript',
    isMainRepo: true,
    dependencies: ['repo-2', 'repo-3'],
  },
  {
    id: 'repo-2',
    name: 'auth-service',
    language: 'python',
    isMainRepo: false,
    dependencies: ['repo-4'],
  },
  {
    id: 'repo-3',
    name: 'data-processor',
    language: 'rust',
    isMainRepo: false,
    dependencies: [],
  },
  {
    id: 'repo-4',
    name: 'shared-types',
    language: 'typescript',
    isMainRepo: false,
    dependencies: [],
  },
];

// Convert to generic nodes
const nodes: GenericNode[] = repos.map((repo) => ({
  id: repo.id,
  name: repo.name,
  isRoot: repo.isMainRepo,
  category: repo.language, // Used for theming
  importance: repo.isMainRepo ? 100 : 50,
  dependencies: repo.dependencies,
}));

// Generate maps
const mapCollection = nodesToOverworldMapCollection(nodes);

// Use with OverworldMapPanelContent
<OverworldMapPanelContent
  packages={[]} // Not used
  width={800}
  height={600}
  // TODO: Need to add a prop to accept generic nodes directly
/>
```

## Example 2: Microservices

Map microservices and their communication:

```typescript
interface Microservice {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'api';
  callsServices: string[]; // Service IDs this service calls
  traffic: number; // RPS or similar metric
}

const services: Microservice[] = [
  {
    id: 'svc-1',
    name: 'Web Frontend',
    type: 'frontend',
    callsServices: ['svc-2', 'svc-3'],
    traffic: 1000,
  },
  {
    id: 'svc-2',
    name: 'API Gateway',
    type: 'api',
    callsServices: ['svc-4', 'svc-5'],
    traffic: 5000,
  },
  {
    id: 'svc-3',
    name: 'Auth Service',
    type: 'backend',
    callsServices: ['svc-6'],
    traffic: 2000,
  },
  {
    id: 'svc-4',
    name: 'User Service',
    type: 'backend',
    callsServices: ['svc-6'],
    traffic: 3000,
  },
  {
    id: 'svc-5',
    name: 'Order Service',
    type: 'backend',
    callsServices: ['svc-6'],
    traffic: 2500,
  },
  {
    id: 'svc-6',
    name: 'Postgres DB',
    type: 'database',
    callsServices: [],
    traffic: 10000,
  },
];

// Convert to generic nodes
const nodes: GenericNode[] = services.map((svc) => ({
  id: svc.id,
  name: svc.name,
  isRoot: svc.type === 'frontend', // Frontend is the entry point
  category: svc.type,
  importance: Math.min(100, svc.traffic / 100), // Higher traffic = bigger building
  dependencies: svc.callsServices,
}));

const mapCollection = nodesToOverworldMapCollection(nodes, {
  // Custom theme mapper
  getCategoryTheme: (category) => {
    const themes = {
      frontend: 'grass',
      backend: 'volcano',
      database: 'water',
      api: 'desert',
    };
    return themes[category] || 'grass';
  },
});
```

## Example 3: File Dependencies

Visualize module dependencies in a codebase:

```typescript
interface Module {
  path: string;
  imports: string[]; // Paths of modules this imports
  exports: number; // Number of exports
}

const modules: Module[] = [
  { path: 'src/index.ts', imports: ['src/app.ts', 'src/config.ts'], exports: 1 },
  { path: 'src/app.ts', imports: ['src/routes.ts', 'src/db.ts'], exports: 5 },
  { path: 'src/config.ts', imports: [], exports: 10 },
  { path: 'src/routes.ts', imports: ['src/controllers.ts'], exports: 3 },
  { path: 'src/controllers.ts', imports: ['src/db.ts'], exports: 12 },
  { path: 'src/db.ts', imports: [], exports: 8 },
];

// Create path to ID mapping
const pathToId = new Map(modules.map((m, i) => [m.path, `mod-${i}`]));

const nodes: GenericNode[] = modules.map((mod) => ({
  id: pathToId.get(mod.path)!,
  name: mod.path.split('/').pop()!, // Just filename
  isRoot: mod.path === 'src/index.ts',
  category: mod.path.endsWith('.ts') ? 'typescript' : 'javascript',
  importance: mod.exports * 5, // More exports = more important
  dependencies: mod.imports.map((p) => pathToId.get(p)!).filter(Boolean),
}));

const mapCollection = nodesToOverworldMapCollection(nodes);
```

## Customization Options

### Custom Node Type Mapping

Control which buildings appear:

```typescript
nodesToOverworldMapCollection(nodes, {
  getNodeType: (node) => {
    if (node.isRoot) return 'castle';
    if (node.importance > 80) return 'fortress';
    if (node.importance > 50) return 'tower';
    if (node.category === 'special') return 'pipe'; // Warp pipe!
    return 'house';
  },
});
```

### Custom Colors

Override the default colors:

```typescript
nodesToOverworldMapCollection(nodes, {
  getNodeColor: (node) => {
    if (node.isRoot) return '#ff0000'; // Red castle
    if (node.category === 'critical') return '#ff6600'; // Orange
    return '#00ff00'; // Green
  },
});
```

### Custom Themes/Biomes

Create custom themed areas:

```typescript
nodesToOverworldMapCollection(nodes, {
  getCategoryTheme: (category) => {
    const customThemes = {
      'high-priority': 'volcano',
      'stable': 'grass',
      'experimental': 'ice',
      'legacy': 'desert',
    };
    return customThemes[category] || 'grass';
  },
});
```

## Future: Direct Generic Node Support

Currently, the panel component only accepts `PackageLayer[]`. We should add:

```typescript
// Proposed API
<OverworldMapPanelContent
  // Option 1: Use packages (current)
  packages={packageLayers}

  // Option 2: Use generic nodes (new!)
  nodes={genericNodes}

  width={800}
  height={600}
/>
```

This would make it fully generic without needing the package adapter layer.
