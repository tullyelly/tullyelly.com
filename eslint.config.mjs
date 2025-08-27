// eslint.config.mjs
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  // allows classic "extends: ['next/...']" inside flat config
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
})

export default [
  // 1) Replace .eslintignore with flat-config ignores
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.css',          // avoid applying JS/React rules to CSS
    ],
  },

  // 2) Bring in Next.js' rules (incl. core-web-vitals) via compat
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript', 'prettier'],
    settings: {
      // 3) Silence "React version not specified" warning
      react: { version: 'detect' },
    },
    rules: {
      // add your overrides here if needed
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  }),
]