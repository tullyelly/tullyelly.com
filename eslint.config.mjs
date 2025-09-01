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

  // Hydration guardrails: ban non-determinism and unstable patterns in render paths
  {
    files: ['**/*.tsx'],
    rules: {
      // Avoid index keys in React lists
      'react/no-array-index-key': 'error',

      // Disallow runtime randomness and time in components
      'no-restricted-syntax': [
        'error',
        // Date.now()
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Do not use Date.now() in render paths; compute on server and pass via props.',
        },
        // new Date()
        {
          selector: "NewExpression[callee.name='Date']",
          message: 'Do not construct Date in render; pass serialized values and format deterministically.',
        },
        // Math.random()
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: 'Do not use Math.random() in render paths; compute on server and pass via props.',
        },
        // crypto.randomUUID()
        {
          selector: "CallExpression[callee.object.name='crypto'][callee.property.name='randomUUID']",
          message: 'Do not use crypto.randomUUID() in render paths; use stable IDs from data.',
        },
        // toLocaleString / toLocaleDateString / toLocaleTimeString
        {
          selector: "CallExpression[callee.property.name=/^toLocale(String|DateString|TimeString)$/]",
          message: 'Avoid locale-sensitive toLocale* in SSR; use lib/format.ts helpers or client-only upgrade.',
        },
        // typeof window/document/navigator checks in components
        {
          selector: "UnaryExpression[operator='typeof'][argument.name=/^(window|document|navigator)$/]",
          message: 'Move client-only branches into dedicated client components; avoid typeof window in render.',
        },
        // Array.sort without comparator
        {
          selector: "CallExpression[callee.property.name='sort'][arguments.length=0]",
          message: 'Always provide a stable, pure comparator to Array.sort to avoid non-deterministic order.',
        },
      ],
    },
  },
]

export default config
