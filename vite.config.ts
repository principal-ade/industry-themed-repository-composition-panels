import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(() => ({
  plugins: [
    react({
      // Force production JSX runtime to avoid jsxDEV in output
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      development: false,
    }),
    {
      name: 'resolve-file-city-builder',
      resolveId(id) {
        if (id === '@principal-ai/file-city-builder') {
          return path.resolve(
            __dirname,
            'node_modules/@principal-ai/file-city-builder/dist/index.js'
          );
        }
        return null;
      },
    },
  ],
  define: {
    // Ensure NODE_ENV is production for React
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@principal-ai/file-city-builder': path.resolve(
        __dirname,
        './node_modules/@principal-ai/file-city-builder/dist/index.js'
      ),
    },
    conditions: ['import', 'module', 'browser', 'default'],
  },
  build: {
    lib: {
      entry: './src/index.tsx',
      name: 'PanelExtension',
      fileName: 'panels.bundle',
      formats: ['es'],
    },
    rollupOptions: {
      // Externalize peer dependencies and shared packages - these come from the host application
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        '@principal-ade/dynamic-file-tree',
        '@principal-ai/principal-view-core/browser',
        // React Three Fiber and related - must be external to avoid React version conflicts
        '@react-three/fiber',
        '@react-three/drei',
        '@react-spring/three',
        'three',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          'react/jsx-dev-runtime': 'jsxDevRuntime',
        },
      },
    },
    // Generate sourcemaps for debugging
    sourcemap: true,
    // Ensure production mode build
    minify: false,
  },
  // Force production mode for consistent JSX runtime
  mode: 'production',
}));
