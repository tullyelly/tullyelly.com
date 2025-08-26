import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^server-only$': '<rootDir>/test/shims/server-only.ts',
    '^@/app/lib/db$': '<rootDir>/__mocks__/db.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json', useESM: true }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testMatch: ['<rootDir>/**/__tests__/**/*.test.(ts|tsx)'],
  testPathIgnorePatterns: ['/__tests__/db/'],
};

export default config;
