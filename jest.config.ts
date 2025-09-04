import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  // Use jsdom so React/DOM-oriented tests (incl. jest-axe) have a browser-like env
  testEnvironment: 'jsdom',
  rootDir: '.',
  // Match both TS and TSX, including names like *.axe.test.tsx
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)'],
  // Keep your env setup, and add matcher/setup extensions (e.g., jest-axe, jest-dom)
  setupFiles: ['<rootDir>/jest.setup.env.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  verbose: true,
  // Make sure Next aliases resolve
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^server-only$': '<rootDir>/test/shims/server-only.ts',
  },
  // Keep workers low to avoid too many DB connections in CI
  maxWorkers: 1,
};

export default config;