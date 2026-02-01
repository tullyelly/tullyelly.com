import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@ui$": "<rootDir>/components/ui",
    "^@ui/(.*)$": "<rootDir>/components/ui/$1",
    "^@/(.*)$": "<rootDir>/$1",
    "^contentlayer/generated$": "<rootDir>/.contentlayer/generated/index.mjs",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
  },
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/e2e/",
  ],
  // Do NOT set "transform"—next/jest configures it.
};

export default createJestConfig(customJestConfig);
