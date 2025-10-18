const nextJest = require('next/jest.js')

const createJestConfig = nextJest({ dir: './' })

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts',
    '<rootDir>/jest.setup.console-error.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/tests/',
    '<rootDir>/vitest/',
  ],
  collectCoverageFrom: [
    '{app,components,lib,db}/**/*.{ts,tsx}',
    '!app/**',
    '!components/**',
    '!lib/**',
    '!db/**',
    'app/mark2/admin/authz/actions.ts',
    'app/ui/badge-maps.ts',
    'components/AnnouncementBanner.tsx',
    'components/BrandedLink.tsx',
    'components/Footer.tsx',
    'components/SiteHeader.tsx',
    'components/flowers/FlowersInline.tsx',
    'components/scrolls/formatReleaseDate.ts',
    'lib/build-info.ts',
    'lib/dates.ts',
    'lib/datetime.ts',
    'lib/env.ts',
    'lib/scrolls.ts',
    'lib/authz/**/*.{ts,tsx}',
    '!lib/authz/resolve.ts',
    'db/assert-database-url.ts',
    'db/pool.ts',
    '!**/*.d.ts',
    '!**/page.tsx',
    '!**/layout.tsx',
    '!**/sitemap.ts',
    '!**/_components/**',
    '!**/*.stories.tsx',
    '!e2e/**',
    '!playwright.config.ts',
    '!jest.config.cjs',
    '!scripts/**',
    '!auth.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/app/api/',
    '<rootDir>/components/PersistentBannerHost.tsx',
    '<rootDir>/lib/persistent-banner.ts',
  ],
  coverageReporters: ['json-summary', 'text', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
  },
  // Do NOT set "transform"—next/jest configures it.
}

module.exports = createJestConfig(customJestConfig)
