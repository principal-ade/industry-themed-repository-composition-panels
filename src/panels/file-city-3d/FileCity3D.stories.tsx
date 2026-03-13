import type { Meta, StoryObj } from '@storybook/react';
import { FileCity3D, CityData, CityBuilding, CityDistrict } from './FileCity3D';
import {
  buildCityDataFromFileTree,
  estimateLineCounts,
  createMockFileTree,
} from './buildCityData';

const meta: Meta<typeof FileCity3D> = {
  title: 'Panels/FileCity3D',
  component: FileCity3D,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    width: { control: 'text' },
    height: { control: 'number' },
    showControls: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FileCity3D>;

// Code extensions use lineCount for height, others use size
const CODE_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go', 'java'];
const NON_CODE_EXTENSIONS = ['json', 'css', 'md', 'yaml', 'svg', 'png'];

// Helper to generate sample buildings
function generateBuildings(
  basePath: string,
  count: number,
  startX: number,
  startZ: number,
  areaWidth: number,
  areaDepth: number
): CityBuilding[] {
  const buildings: CityBuilding[] = [];
  const allExtensions = [...CODE_EXTENSIONS, ...NON_CODE_EXTENSIONS];
  const cols = Math.ceil(Math.sqrt(count));

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ext = allExtensions[i % allExtensions.length];
    const isCode = CODE_EXTENSIONS.includes(ext);

    // Code files: logarithmic distribution of line counts (20-3000 lines)
    // This creates a realistic mix: many small files, some medium, few large
    const lineCount = isCode
      ? Math.floor(Math.exp(Math.random() * Math.log(3000 - 20) + Math.log(20)))
      : undefined;
    // Non-code files: random size (1KB-200KB)
    const size = isCode
      ? lineCount! * 40
      : Math.floor(Math.random() * 200000) + 1000;

    buildings.push({
      path: `${basePath}/file${i}.${ext}`,
      position: {
        x: startX + (col / cols) * areaWidth + areaWidth / cols / 2,
        y: 0,
        z: startZ + (row / cols) * areaDepth + areaDepth / cols / 2,
      },
      dimensions: [(areaWidth / cols) * 0.7, 10, (areaDepth / cols) * 0.7], // height ignored, calculated from lineCount/size
      type: 'file',
      fileExtension: ext,
      size,
      lineCount,
    });
  }

  return buildings;
}

// Sample city data representing a typical project structure
const sampleCityData: CityData = {
  buildings: [
    // src directory
    ...generateBuildings('src', 12, 0, 0, 40, 40),
    // components directory
    ...generateBuildings('src/components', 8, 50, 0, 30, 30),
    // utils directory
    ...generateBuildings('src/utils', 6, 50, 40, 25, 25),
    // tests directory
    ...generateBuildings('tests', 5, 0, 50, 30, 20),
  ],
  districts: [
    {
      path: 'src',
      worldBounds: { minX: -2, maxX: 42, minZ: -2, maxZ: 42 },
      fileCount: 12,
      type: 'directory',
      label: {
        text: 'src',
        bounds: { minX: -2, maxX: 42, minZ: 42, maxZ: 46 },
        position: 'bottom',
      },
    },
    {
      path: 'src/components',
      worldBounds: { minX: 48, maxX: 82, minZ: -2, maxZ: 32 },
      fileCount: 8,
      type: 'directory',
      label: {
        text: 'components',
        bounds: { minX: 48, maxX: 82, minZ: 32, maxZ: 36 },
        position: 'bottom',
      },
    },
    {
      path: 'src/utils',
      worldBounds: { minX: 48, maxX: 77, minZ: 38, maxZ: 67 },
      fileCount: 6,
      type: 'directory',
      label: {
        text: 'utils',
        bounds: { minX: 48, maxX: 77, minZ: 67, maxZ: 71 },
        position: 'bottom',
      },
    },
    {
      path: 'tests',
      worldBounds: { minX: -2, maxX: 32, minZ: 48, maxZ: 72 },
      fileCount: 5,
      type: 'directory',
      label: {
        text: 'tests',
        bounds: { minX: -2, maxX: 32, minZ: 72, maxZ: 76 },
        position: 'bottom',
      },
    },
  ],
  bounds: {
    minX: -5,
    maxX: 85,
    minZ: -5,
    maxZ: 80,
  },
  metadata: {
    totalFiles: 31,
    totalDirectories: 4,
    rootPath: '/project',
  },
};

// Larger city for stress testing
function generateLargeCityData(): CityData {
  const buildings: CityBuilding[] = [];
  const districts: CityDistrict[] = [];

  const gridSize = 5; // 5x5 grid of directories
  const dirSize = 40;
  const filesPerDir = 15;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const dirPath = `dir_${row}_${col}`;
      const startX = col * (dirSize + 10);
      const startZ = row * (dirSize + 10);

      buildings.push(
        ...generateBuildings(
          dirPath,
          filesPerDir,
          startX,
          startZ,
          dirSize,
          dirSize
        )
      );

      districts.push({
        path: dirPath,
        worldBounds: {
          minX: startX - 2,
          maxX: startX + dirSize + 2,
          minZ: startZ - 2,
          maxZ: startZ + dirSize + 2,
        },
        fileCount: filesPerDir,
        type: 'directory',
        label: {
          text: dirPath,
          bounds: {
            minX: startX - 2,
            maxX: startX + dirSize + 2,
            minZ: startZ + dirSize + 2,
            maxZ: startZ + dirSize + 6,
          },
          position: 'bottom',
        },
      });
    }
  }

  const totalSize = gridSize * (dirSize + 10);

  return {
    buildings,
    districts,
    bounds: {
      minX: -10,
      maxX: totalSize + 10,
      minZ: -10,
      maxZ: totalSize + 10,
    },
    metadata: {
      totalFiles: buildings.length,
      totalDirectories: districts.length,
      rootPath: '/large-project',
    },
  };
}

// Monorepo-style layout
function generateMonorepoCityData(): CityData {
  const buildings: CityBuilding[] = [];
  const districts: CityDistrict[] = [];

  const packages = [
    { name: 'packages/core', files: 20, x: 0, z: 0, w: 50, d: 50 },
    { name: 'packages/cli', files: 10, x: 60, z: 0, w: 35, d: 35 },
    { name: 'packages/react', files: 15, x: 60, z: 45, w: 40, d: 40 },
    { name: 'packages/server', files: 8, x: 0, z: 60, w: 30, d: 30 },
    { name: 'apps/web', files: 25, x: 110, z: 0, w: 55, d: 55 },
    { name: 'apps/docs', files: 12, x: 110, z: 65, w: 40, d: 35 },
  ];

  for (const pkg of packages) {
    buildings.push(
      ...generateBuildings(pkg.name, pkg.files, pkg.x, pkg.z, pkg.w, pkg.d)
    );

    districts.push({
      path: pkg.name,
      worldBounds: {
        minX: pkg.x - 2,
        maxX: pkg.x + pkg.w + 2,
        minZ: pkg.z - 2,
        maxZ: pkg.z + pkg.d + 2,
      },
      fileCount: pkg.files,
      type: 'directory',
      label: {
        text: pkg.name.split('/').pop() || pkg.name,
        bounds: {
          minX: pkg.x - 2,
          maxX: pkg.x + pkg.w + 2,
          minZ: pkg.z + pkg.d + 2,
          maxZ: pkg.z + pkg.d + 6,
        },
        position: 'bottom',
      },
    });
  }

  return {
    buildings,
    districts,
    bounds: {
      minX: -10,
      maxX: 175,
      minZ: -10,
      maxZ: 110,
    },
    metadata: {
      totalFiles: buildings.length,
      totalDirectories: districts.length,
      rootPath: '/monorepo',
    },
  };
}

/**
 * Default view - starts fully grown in 3D mode
 */
export const Default: Story = {
  args: {
    cityData: sampleCityData,
    height: 700,
  },
};

/**
 * Animated intro - starts flat (2D), then grows into 3D with a ripple effect.
 * Buildings grow from the center outward.
 */
export const AnimatedIntro: Story = {
  args: {
    cityData: sampleCityData,
    height: 700,
    animation: {
      startFlat: true,
      autoStartDelay: 800,
      staggerDelay: 20,
      tension: 100,
      friction: 12,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Starts with a flat 2D view looking down, then buildings grow upward with a ripple effect from center. Camera transitions to isometric view.',
      },
    },
  },
};

/**
 * Manual control - starts flat, use button to trigger growth
 */
export const ManualControl: Story = {
  args: {
    cityData: sampleCityData,
    height: 700,
    animation: {
      startFlat: true,
      autoStartDelay: null, // Don't auto-start
      staggerDelay: 15,
    },
    showControls: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Starts flat with manual control. Click the "Grow to 3D" button to trigger the animation. You can toggle back and forth.',
      },
    },
  },
};

/**
 * Fast animation - snappy growth effect
 */
export const FastAnimation: Story = {
  args: {
    cityData: sampleCityData,
    height: 700,
    animation: {
      startFlat: true,
      autoStartDelay: 500,
      staggerDelay: 8,
      tension: 200,
      friction: 18,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'A faster, snappier animation with higher tension and shorter stagger delay.',
      },
    },
  },
};

/**
 * Slow dramatic reveal - buildings grow slowly with bounce
 */
export const SlowDramatic: Story = {
  args: {
    cityData: sampleCityData,
    height: 700,
    animation: {
      startFlat: true,
      autoStartDelay: 1000,
      staggerDelay: 40,
      tension: 60,
      friction: 8,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Slow, dramatic reveal with more bounce. Buildings grow one by one from the center.',
      },
    },
  },
};

/**
 * Large city with animation - 375 buildings growing in waves
 */
export const LargeCityAnimated: Story = {
  args: {
    cityData: generateLargeCityData(),
    height: 800,
    animation: {
      startFlat: true,
      autoStartDelay: 600,
      staggerDelay: 5, // Shorter delay for many buildings
      tension: 150,
      friction: 16,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'A larger city with 375 buildings animating with fast stagger to create a wave effect.',
      },
    },
  },
};

/**
 * Monorepo layout with animation
 */
export const MonorepoAnimated: Story = {
  args: {
    cityData: generateMonorepoCityData(),
    height: 700,
    animation: {
      startFlat: true,
      autoStartDelay: 700,
      staggerDelay: 12,
      tension: 120,
      friction: 14,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A monorepo-style layout with animated growth.',
      },
    },
  },
};

/**
 * Static 3D view (no animation, just the result)
 */
export const Static3D: Story = {
  args: {
    cityData: sampleCityData,
    height: 600,
    animation: {
      startFlat: false,
    },
    showControls: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Static 3D view with no animation or controls. Just the city.',
      },
    },
  },
};

/**
 * With click handler
 */
export const WithClickHandler: Story = {
  args: {
    cityData: sampleCityData,
    height: 600,
    onBuildingClick: (building) => {
      // eslint-disable-next-line no-console
      console.log('Clicked building:', building.path);
      alert(`Clicked: ${building.path}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click on buildings to trigger the callback. Check console for output.',
      },
    },
  },
};

/**
 * Package isolation - transparent mode
 * Non-highlighted buildings become transparent
 */
export const IsolationTransparent: Story = {
  args: {
    cityData: sampleCityData,
    height: 700,
    isolationMode: 'transparent',
    dimOpacity: 0.1,
    highlightLayers: [
      {
        id: 'focus',
        name: 'Focus Layer',
        enabled: true,
        color: '#22c55e', // Green
        items: [{ path: 'src', type: 'directory' as const }],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Highlight the "src" directory. Other buildings become transparent (10% opacity).',
      },
    },
  },
};

/**
 * Package isolation - collapse mode
 * Non-highlighted buildings flatten to ground level
 */
export const IsolationCollapse: Story = {
  args: {
    cityData: sampleCityData,
    height: 700,
    isolationMode: 'collapse',
    highlightLayers: [
      {
        id: 'focus',
        name: 'Focus Layer',
        enabled: true,
        color: '#3b82f6', // Blue
        items: [{ path: 'src/components', type: 'directory' as const }],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Highlight "src/components". Non-highlighted buildings collapse to ground level.',
      },
    },
  },
};

/**
 * Package isolation - hide mode
 * Non-highlighted buildings are completely hidden
 */
export const IsolationHide: Story = {
  args: {
    cityData: sampleCityData,
    height: 700,
    isolationMode: 'hide',
    highlightLayers: [
      {
        id: 'focus',
        name: 'Focus Layer',
        enabled: true,
        color: '#f59e0b', // Amber
        items: [{ path: 'tests', type: 'directory' as const }],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Highlight "tests" directory. All other buildings are hidden.',
      },
    },
  },
};

/**
 * Multiple highlight layers
 * Different directories highlighted with different colors
 */
export const MultipleHighlights: Story = {
  args: {
    cityData: sampleCityData,
    height: 700,
    isolationMode: 'transparent',
    dimOpacity: 0.08,
    highlightLayers: [
      {
        id: 'src',
        name: 'Source',
        enabled: true,
        color: '#22c55e', // Green
        items: [{ path: 'src', type: 'directory' as const }],
      },
      {
        id: 'tests',
        name: 'Tests',
        enabled: true,
        color: '#ef4444', // Red
        items: [{ path: 'tests', type: 'directory' as const }],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Multiple layers: src (green) and tests (red). Everything else is dimmed.',
      },
    },
  },
};

/**
 * Animated intro with highlight layer
 */
export const AnimatedWithHighlight: Story = {
  args: {
    cityData: sampleCityData,
    height: 700,
    animation: {
      startFlat: true,
      autoStartDelay: 800,
      staggerDelay: 20,
    },
    isolationMode: 'transparent',
    dimOpacity: 0.15,
    highlightLayers: [
      {
        id: 'components',
        name: 'Components',
        enabled: true,
        color: '#8b5cf6', // Purple
        items: [{ path: 'src/components', type: 'directory' as const }],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Animated intro with components directory highlighted in purple.',
      },
    },
  },
};

// ============================================================================
// Real Data Stories - Using file-city-builder
// ============================================================================

/**
 * Build city data from a mock FileTree using real file-city-builder
 */
function buildRealCityData(): CityData {
  const fileTree = createMockFileTree();
  const cityData = buildCityDataFromFileTree(fileTree);
  // Estimate line counts from file sizes
  return estimateLineCounts(cityData);
}

/**
 * Real FileTree data - built using file-city-builder
 */
export const RealFileTree: Story = {
  args: {
    cityData: buildRealCityData(),
    height: 700,
  },
  parameters: {
    docs: {
      description: {
        story:
          'City built from a real FileTree structure using file-city-builder. Heights are estimated from file sizes (~40 bytes per line for code).',
      },
    },
  },
};

/**
 * Real FileTree with animated intro
 */
export const RealFileTreeAnimated: Story = {
  args: {
    cityData: buildRealCityData(),
    height: 700,
    animation: {
      startFlat: true,
      autoStartDelay: 600,
      staggerDelay: 30,
      tension: 100,
      friction: 12,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Real FileTree data with animated 2D→3D transition.',
      },
    },
  },
};

/**
 * Real FileTree with components highlighted
 */
export const RealFileTreeHighlighted: Story = {
  args: {
    cityData: buildRealCityData(),
    height: 700,
    isolationMode: 'transparent',
    dimOpacity: 0.12,
    highlightLayers: [
      {
        id: 'components',
        name: 'Components',
        enabled: true,
        color: '#22c55e',
        items: [{ path: 'src/components', type: 'directory' as const }],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Real FileTree with src/components directory highlighted.',
      },
    },
  },
};

/**
 * Real FileTree - collapse non-src
 */
export const RealFileTreeCollapsed: Story = {
  args: {
    cityData: buildRealCityData(),
    height: 700,
    isolationMode: 'collapse',
    highlightLayers: [
      {
        id: 'src',
        name: 'Source',
        enabled: true,
        color: '#3b82f6',
        items: [{ path: 'src', type: 'directory' as const }],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Real FileTree with only src directory standing tall, everything else collapsed.',
      },
    },
  },
};
