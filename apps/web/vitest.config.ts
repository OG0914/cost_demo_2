import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['hooks/**/*.ts', 'lib/**/*.ts', 'components/**/*.tsx'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.d.ts',
        'node_modules/**',
        '.next/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  esbuild: {
    target: 'es2020',
  },
})
