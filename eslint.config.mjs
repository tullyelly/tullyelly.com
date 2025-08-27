// eslint.config.mjs
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import globals from 'globals'
import json from '@eslint/json'
import markdown from '@eslint/markdown'

const compat = new FlatCompat({
  // allows classic "extends: ['next/...']" inside flat config
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
})

const nextConfig = compat
  .config({
    extends: ['next/core-web-vitals', 'next/typescript', 'prettier'],
    settings: {
      // Silence "React version not specified" warning
      react: { version: 'detect' },
    },
    rules: {
      // add your overrides here if needed
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  })
  .map((config) => ({
    ...config,
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  }))

const jsConfig = {
  files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  ...js.configs.recommended,
  languageOptions: {
    ...js.configs.recommended.languageOptions,
    globals: { ...globals.browser, ...globals.node },
  },
}

export default [
  // Replace .eslintignore with flat-config ignores
  {
    ignores: ['**/.next/**', '**/node_modules/**', '**/dist/**', '**/build/**', '**/*.css'],
  },

  jsConfig,

  ...nextConfig,

  { files: ['**/*.json'], ...json.configs.recommended },
  { files: ['**/*.jsonc'], ...json.configs.recommended, language: 'json/jsonc' },
  { files: ['**/*.json5'], ...json.configs.recommended, language: 'json/json5' },
  { files: ['**/*.md'], ...markdown.configs.recommended },
]
