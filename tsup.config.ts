import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'node18',
  outDir: 'dist',
  outExtension({ format }) {
    if (format === 'cjs') return { js: '.js' };
    if (format === 'esm') return { js: '.mjs' };
    return { js: '.js' };
  },
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.jsxImportSource = 'react';
    options.define = {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    };
  },
  onSuccess: async () => {
    console.log('Build completed successfully!');
  },
  onError: async (error) => {
    console.error('Build failed:', error);
  },
  ignoreWatch: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
  watch: false,
  bundle: true,
  external: [
    'react',
    'react-dom',
    'ink',
    'chalk',
    'commander',
    'fs-extra',
    'date-fns',
    'cli-table3',
    'ora',
    'jsonstream',
  ],
  noExternal: [],
  skipNodeModulesBundle: false,
  keepNames: true,
  shims: true,
});