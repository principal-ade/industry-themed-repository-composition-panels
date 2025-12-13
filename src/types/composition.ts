/**
 * Types from codebase-composition for PackageCompositionPanel
 */

// Lens operation types
export type LensOperation = 'check' | 'coverage' | 'fix' | 'watch';

// Quality metrics matching QualityHexagon component
export interface QualityMetrics {
  tests: number;
  deadCode: number;
  linting: number;
  formatting: number;
  types: number;
  documentation: number;
}

// Package command structure
export interface PackageCommand {
  name: string;
  command: string;
  description?: string;
  type?: 'script' | 'standard';
  workingDirectory?: string;
  isLensCommand?: boolean;
  lensId?: string;
  lensOperation?: LensOperation;
}

// Config file information
export interface ConfigFile {
  path: string;
  exists: boolean;
  type: 'json' | 'yaml' | 'toml' | 'js' | 'ts' | 'ini' | 'custom';
  isInline?: boolean;
  inlineField?: string;
}

// Base file selection types
export interface FilePattern {
  type: 'glob' | 'regex' | 'exact';
  pattern: string;
  description?: string;
}

export interface FileSet {
  id: string;
  name: string;
  description?: string;
  patterns: FilePattern[];
  matchedFiles?: string[];
  fileCount?: number;
}

// Base layer that PackageLayer extends
export interface BaseLayer {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  workspaceId?: string;
  workspaceRoot?: string;
  derivedFrom: {
    fileSets: FileSet[];
    derivationType:
      | 'presence'
      | 'content'
      | 'aggregation'
      | 'relationship'
      | 'content+pattern'
      | 'content+presence';
    description: string;
  };
  dependsOn?: string[];
  enhances?: string;
  color?: string;
  icon?: string;
  pillar?: 'validation' | 'dataFlow' | 'foundationHealth' | 'viewLayers';
}

// Package layer - derived from package.json presence
export interface PackageLayer extends BaseLayer {
  type: 'package' | 'node' | 'python' | 'cargo' | 'go';

  packageData: {
    name: string;
    version?: string;
    path: string;
    manifestPath: string;
    packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'pip' | 'poetry' | 'pipenv' | 'cargo' | 'unknown';
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    peerDependencies: Record<string, string>;
    isMonorepoRoot: boolean;
    isWorkspace: boolean;
    parentPackage?: string;
    availableCommands?: PackageCommand[];
  };

  lockFiles?: FileSet;

  configFiles?: {
    knip?: ConfigFile;
    eslint?: ConfigFile;
    prettier?: ConfigFile;
    typescript?: ConfigFile;
    jest?: ConfigFile;
    vitest?: ConfigFile;
    webpack?: ConfigFile;
    vite?: ConfigFile;
    rollup?: ConfigFile;
    babel?: ConfigFile;
    pytest?: ConfigFile;
    flake8?: ConfigFile;
    mypy?: ConfigFile;
    black?: ConfigFile;
    ruff?: ConfigFile;
    pylint?: ConfigFile;
    rustfmt?: ConfigFile;
    clippy?: ConfigFile;
    dockerfile?: ConfigFile;
    gitignore?: ConfigFile;
    editorconfig?: ConfigFile;
    [key: string]: ConfigFile | undefined;
  };

  docsFolder?: string;

  qualityMetrics?: {
    hexagon: Partial<QualityMetrics>;
    availableLenses: string[];
    missingLenses?: string[];
  };
}
