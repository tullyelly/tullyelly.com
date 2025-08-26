import type { Config } from 'jest';

const config: Config = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(db|db.test).[tj]s?(x)'],
  transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json', useESM: true }] },
  globalSetup: '<rootDir>/test/setup/db-global-setup.ts',
  globalTeardown: '<rootDir>/test/setup/db-global-teardown.ts',
  verbose: true,
  maxWorkers: 1,
};
export default config;
