import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    name: 'api-base',
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-debugger': 'error',
      'prefer-const': 'warn',
      'no-var': 'warn',
    },
  },
  {
    name: 'api-ignore',
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
    ],
  },
])
