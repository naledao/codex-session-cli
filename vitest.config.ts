import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/index.ts',
        'src/types/**',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    bail: 0,
    reporters: ['default'],
    outputFile: undefined,
    passWithNoTests: false,
    allowOnly: false,
    dangerouslyIgnoreUnhandledErrors: false,
    sequence: {
      shuffle: false,
      concurrent: false,
      seed: Date.now(),
    },
    shard: undefined,
    benchmark: {
      include: ['tests/**/*.{bench,benchmark}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['node_modules', 'dist'],
      reporters: ['default'],
    },
    typecheck: {
      checker: 'tsc',
      include: ['tests/**/*.{test,spec}.{ts,tsx}'],
      exclude: [],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});