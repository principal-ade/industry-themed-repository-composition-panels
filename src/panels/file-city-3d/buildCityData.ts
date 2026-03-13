/**
 * Utilities for building CityData from FileTree for use with FileCity3D
 */

import {
  CodeCityBuilderWithGrid,
  type CityData as BuilderCityData,
  type CityBuilding as BuilderCityBuilding,
} from '@principal-ai/file-city-builder';
import type { FileTree } from '@principal-ai/repository-abstraction';
import type { CityData, CityBuilding } from './FileCity3D';

/**
 * Line count data for enriching buildings
 */
export interface LineCountData {
  [filePath: string]: number;
}

/**
 * Build CityData from a FileTree using file-city-builder
 */
export function buildCityDataFromFileTree(
  fileTree: FileTree,
  rootPath: string = ''
): CityData {
  const builder = new CodeCityBuilderWithGrid();
  const builderData = builder.buildCityFromFileSystem(fileTree, rootPath);

  // Convert builder types to our types (they're compatible but TypeScript needs help)
  return {
    buildings: builderData.buildings.map((b) => ({
      path: b.path,
      position: b.position,
      dimensions: b.dimensions,
      color: b.color,
      type: b.type,
      fileExtension: b.fileExtension,
      size: b.size,
      // lineCount will be added via enrichWithLineCounts
    })),
    districts: builderData.districts,
    bounds: builderData.bounds,
    metadata: {
      totalFiles: builderData.metadata.totalFiles,
      totalDirectories: builderData.metadata.totalDirectories,
      rootPath: builderData.metadata.rootPath,
    },
  };
}

/**
 * Enrich CityData with line count information
 * This adds lineCount to buildings based on provided data
 */
export function enrichWithLineCounts(
  cityData: CityData,
  lineCounts: LineCountData
): CityData {
  return {
    ...cityData,
    buildings: cityData.buildings.map((building) => ({
      ...building,
      lineCount: lineCounts[building.path],
    })),
  };
}

/**
 * Estimate line counts from file sizes for code files
 * Uses average of ~40 bytes per line for code files
 * This is a rough estimate - real line counts are better
 */
export function estimateLineCounts(cityData: CityData): CityData {
  const CODE_EXTENSIONS = new Set([
    'ts',
    'tsx',
    'js',
    'jsx',
    'mjs',
    'cjs',
    'py',
    'pyw',
    'rs',
    'go',
    'java',
    'kt',
    'scala',
    'c',
    'cpp',
    'cc',
    'cxx',
    'h',
    'hpp',
    'cs',
    'rb',
    'php',
    'swift',
    'vue',
    'svelte',
    'lua',
    'sh',
    'bash',
    'zsh',
    'sql',
  ]);

  return {
    ...cityData,
    buildings: cityData.buildings.map((building) => {
      const ext = (
        building.fileExtension ||
        building.path.split('.').pop() ||
        ''
      ).toLowerCase();
      const isCode = CODE_EXTENSIONS.has(ext);

      if (isCode && building.size && !building.lineCount) {
        // Estimate ~40 bytes per line for code
        const estimatedLines = Math.round(building.size / 40);
        return {
          ...building,
          lineCount: Math.max(1, estimatedLines),
        };
      }
      return building;
    }),
  };
}

// Helper to create a FileInfo
function createFile(
  name: string,
  relativePath: string,
  size: number
): import('@principal-ai/repository-abstraction').FileInfo {
  const extension = name.split('.').pop() || '';
  return {
    path: `/mock-project/${relativePath}`,
    name,
    extension,
    size,
    lastModified: new Date(),
    isDirectory: false,
    relativePath,
  };
}

// Helper to create a DirectoryInfo
function createDir(
  name: string,
  relativePath: string,
  children: import('@principal-ai/repository-abstraction').FileTreeNode[],
  depth: number
): import('@principal-ai/repository-abstraction').DirectoryInfo {
  const files = children.filter((c) => 'isDirectory' in c && !c.isDirectory);
  const totalSize = children.reduce(
    (sum, c) =>
      sum + ('size' in c ? c.size : 'totalSize' in c ? c.totalSize : 0),
    0
  );
  return {
    path: relativePath ? `/mock-project/${relativePath}` : '/mock-project',
    name,
    children,
    fileCount: files.length,
    totalSize,
    depth,
    relativePath,
  };
}

/**
 * Create a mock FileTree for testing/demos
 */
export function createMockFileTree(): FileTree {
  // Build files first
  const buttonFile = createFile(
    'Button.tsx',
    'src/components/Button.tsx',
    3200
  );
  const cardFile = createFile('Card.tsx', 'src/components/Card.tsx', 4800);
  const modalFile = createFile('Modal.tsx', 'src/components/Modal.tsx', 12000);
  const tableFile = createFile('Table.tsx', 'src/components/Table.tsx', 20000);
  const formFile = createFile('Form.tsx', 'src/components/Form.tsx', 28000);

  const useAuthFile = createFile('useAuth.ts', 'src/hooks/useAuth.ts', 4000);
  const useApiFile = createFile('useApi.ts', 'src/hooks/useApi.ts', 6000);
  const useLocalStorageFile = createFile(
    'useLocalStorage.ts',
    'src/hooks/useLocalStorage.ts',
    2000
  );

  const helpersFile = createFile('helpers.ts', 'src/utils/helpers.ts', 8000);
  const constantsFile = createFile(
    'constants.ts',
    'src/utils/constants.ts',
    1600
  );
  const typesFile = createFile('types.ts', 'src/utils/types.ts', 3600);

  const globalCssFile = createFile('global.css', 'src/styles/global.css', 4000);
  const variablesCssFile = createFile(
    'variables.css',
    'src/styles/variables.css',
    2000
  );

  const indexFile = createFile('index.ts', 'src/index.ts', 2400);
  const appFile = createFile('App.tsx', 'src/App.tsx', 8000);

  const appTestFile = createFile('App.test.tsx', 'tests/App.test.tsx', 4000);
  const utilsTestFile = createFile(
    'utils.test.ts',
    'tests/utils.test.ts',
    6000
  );
  const componentsTestFile = createFile(
    'components.test.tsx',
    'tests/components.test.tsx',
    12000
  );

  const packageJsonFile = createFile('package.json', 'package.json', 2000);
  const tsconfigFile = createFile('tsconfig.json', 'tsconfig.json', 800);
  const readmeFile = createFile('README.md', 'README.md', 5000);

  // Build directories
  const componentsDir = createDir(
    'components',
    'src/components',
    [buttonFile, cardFile, modalFile, tableFile, formFile],
    2
  );
  const hooksDir = createDir(
    'hooks',
    'src/hooks',
    [useAuthFile, useApiFile, useLocalStorageFile],
    2
  );
  const utilsDir = createDir(
    'utils',
    'src/utils',
    [helpersFile, constantsFile, typesFile],
    2
  );
  const stylesDir = createDir(
    'styles',
    'src/styles',
    [globalCssFile, variablesCssFile],
    2
  );
  const srcDir = createDir(
    'src',
    'src',
    [indexFile, appFile, componentsDir, hooksDir, utilsDir, stylesDir],
    1
  );
  const testsDir = createDir(
    'tests',
    'tests',
    [appTestFile, utilsTestFile, componentsTestFile],
    1
  );
  const rootDir = createDir(
    'project',
    '',
    [srcDir, testsDir, packageJsonFile, tsconfigFile, readmeFile],
    0
  );

  // Collect all files and directories
  const allFiles = [
    buttonFile,
    cardFile,
    modalFile,
    tableFile,
    formFile,
    useAuthFile,
    useApiFile,
    useLocalStorageFile,
    helpersFile,
    constantsFile,
    typesFile,
    globalCssFile,
    variablesCssFile,
    indexFile,
    appFile,
    appTestFile,
    utilsTestFile,
    componentsTestFile,
    packageJsonFile,
    tsconfigFile,
    readmeFile,
  ];

  const allDirectories = [
    componentsDir,
    hooksDir,
    utilsDir,
    stylesDir,
    srcDir,
    testsDir,
    rootDir,
  ];

  const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);

  return {
    sha: 'mock-sha-12345',
    root: rootDir,
    allFiles,
    allDirectories,
    stats: {
      totalFiles: allFiles.length,
      totalDirectories: allDirectories.length,
      totalSize,
      maxDepth: 2,
    },
    metadata: {
      id: 'mock-project',
      timestamp: new Date(),
      sourceType: 'mock',
      sourceInfo: {},
    },
  };
}
