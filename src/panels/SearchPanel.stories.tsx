import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from '@principal-ade/industry-theme';
import { SearchPanelContent, SearchPanelPreview } from './SearchPanel';
import type { FileTree } from '@principal-ai/repository-abstraction';

/**
 * SearchPanelContent provides filename search functionality for repository files.
 * It supports directory filtering with include/exclude modes and wildcard patterns.
 *
 * Note: This is the direct-props version. The SearchPanel component is the Panel Framework wrapper.
 */
const meta = {
  title: 'Panels/SearchPanel',
  component: SearchPanelContent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A panel that provides filename search with directory filtering. Supports wildcards like *.tsx and test?.js.',
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
} satisfies Meta<typeof SearchPanelContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample file tree data
const sampleFiles = [
  'src/index.tsx',
  'src/App.tsx',
  'src/components/Button.tsx',
  'src/components/Input.tsx',
  'src/components/Modal.tsx',
  'src/components/Select.tsx',
  'src/hooks/useAuth.ts',
  'src/hooks/useForm.ts',
  'src/hooks/useQuery.ts',
  'src/utils/helpers.ts',
  'src/utils/formatters.ts',
  'src/utils/validators.ts',
  'src/services/api.ts',
  'src/services/auth.ts',
  'src/services/storage.ts',
  'src/types/index.ts',
  'src/types/api.ts',
  'src/types/user.ts',
  'src/styles/theme.css',
  'src/styles/globals.css',
  'package.json',
  'tsconfig.json',
  'README.md',
  'vite.config.ts',
  '.eslintrc.js',
  '.prettierrc',
];

const createMockFileTree = (files: string[]): FileTree => {
  const allFiles = files.map(path => {
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    return {
      path,
      name,
      relativePath: path,
      type: 'file' as const,
      isSymlink: false,
    };
  });

  const directories = new Set<string>();
  files.forEach(path => {
    const parts = path.split('/');
    let dir = '';
    for (let i = 0; i < parts.length - 1; i++) {
      dir = dir ? `${dir}/${parts[i]}` : parts[i];
      directories.add(dir);
    }
  });

  const allDirectories = Array.from(directories).map(path => {
    const parts = path.split('/');
    return {
      path,
      name: parts[parts.length - 1],
      relativePath: path,
      type: 'directory' as const,
      isSymlink: false,
    };
  });

  return {
    rootPath: '/Users/developer/my-project',
    sha: 'mock-sha',
    allFiles,
    allDirectories,
    root: {
      path: '.',
      name: '.',
      relativePath: '.',
      type: 'directory' as const,
      isSymlink: false,
      children: [],
    },
    stats: {
      fileCount: allFiles.length,
      directoryCount: allDirectories.length,
      totalSize: 0,
    },
    metadata: {},
    getFile: (path: string) => allFiles.find(f => f.path === path),
    getDirectory: (path: string) => allDirectories.find(d => d.path === path),
  } as unknown as FileTree;
};

const sampleFileTree = createMockFileTree(sampleFiles);
const emptyFileTree = createMockFileTree([]);

/**
 * Default panel with sample files
 */
export const Default: Story = {
  args: {
    fileTree: sampleFileTree,
    baseDirectory: '/Users/developer/my-project',
    onFileSelect: (filePath: string) => {
      console.log('File selected:', filePath);
    },
    onSearchResultsChange: (results) => {
      console.log('Search results:', results.length);
    },
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    fileTree: null,
    isLoading: true,
    baseDirectory: '/Users/developer/my-project',
  },
};

/**
 * Empty file tree
 */
export const EmptyFileTree: Story = {
  args: {
    fileTree: emptyFileTree,
    baseDirectory: '/Users/developer/my-project',
  },
};

/**
 * With selected file
 */
export const WithSelectedFile: Story = {
  args: {
    fileTree: sampleFileTree,
    baseDirectory: '/Users/developer/my-project',
    selectedFile: 'src/components/Button.tsx',
  },
};

/**
 * Large file tree
 */
export const LargeFileTree: Story = {
  args: {
    fileTree: createMockFileTree([
      ...sampleFiles,
      ...Array.from({ length: 50 }, (_, i) => `src/features/feature${i}/index.tsx`),
      ...Array.from({ length: 50 }, (_, i) => `src/features/feature${i}/component.tsx`),
      ...Array.from({ length: 50 }, (_, i) => `src/features/feature${i}/styles.css`),
      ...Array.from({ length: 20 }, (_, i) => `tests/unit/test${i}.spec.ts`),
      ...Array.from({ length: 20 }, (_, i) => `tests/integration/test${i}.spec.ts`),
    ]),
    baseDirectory: '/Users/developer/large-project',
    onFileSelect: (filePath: string) => {
      console.log('File selected:', filePath);
    },
  },
};

/**
 * Preview component - shown in panel switcher
 */
export const Preview: StoryObj<typeof SearchPanelPreview> = {
  render: () => (
    <ThemeProvider>
      <div style={{ width: '200px', background: '#1a1a1a', borderRadius: '8px' }}>
        <SearchPanelPreview />
      </div>
    </ThemeProvider>
  ),
};
