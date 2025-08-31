// eslint.config.mjs
import { FlatCompat } from '@eslint/eslintrc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
  // Ignore build artifacts
  { ignores: ['.next/**', 'node_modules/**', 'dist/**', 'coverage/**'] },

  // Next's recommended rules (includes react + react-hooks)
  ...compat.extends('next/core-web-vitals'),

  // Allow console in server-ish files (optional)
  {
    files: ['app/api/**/*.{ts,tsx}', 'app/error.tsx'],
    rules: {
      'no-console': 'off',
    },
  },

  // Playwright/tests are not React components
  {
    files: [
      'e2e/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'playwright.config.*',
    ],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },

  // Config files: allow anonymous default export or just disable the rule
  {
    files: ['**/*config*.{js,cjs,mjs,ts}'],
    rules: {
      'import/no-anonymous-default-export': 'off',
    },
  },

  // Guard against deprecated storage APIs
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      // Prefer standardized navigator.storage APIs
      'no-restricted-properties': [
        'error',
        {
          object: 'navigator',
          property: 'webkitPersistentStorage',
          message:
            'Deprecated: use navigator.storage.estimate()/persist()/persisted() instead.',
        },
        {
          object: 'navigator',
          property: 'webkitTemporaryStorage',
          message: 'Deprecated: use navigator.storage.estimate() instead.',
        },
        {
          object: 'window',
          property: 'PERSISTENT',
          message: 'Deprecated: use navigator.storage APIs; quota is UA-managed.',
        },
        {
          object: 'window',
          property: 'TEMPORARY',
          message: 'Deprecated: use navigator.storage APIs; quota is UA-managed.',
        },
        {
          object: 'window',
          property: 'webkitRequestFileSystem',
          message: 'Deprecated File System API; consider OPFS via navigator.storage.getDirectory().',
        },
        {
          object: 'StorageType',
          property: 'persistent',
          message: 'Deprecated: use navigator.storage instead of StorageType.persistent.',
        },
      ],
    },
  },
]

export default config
