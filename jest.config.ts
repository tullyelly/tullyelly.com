import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/jest.setup.env.ts'],
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