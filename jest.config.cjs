// A Git hook exports its repository context. Fixtures must discover their own
// repositories by cwd, not reinitialize the checkout that launched the hook.
// This changes only the Jest child; the parent push keeps its scoped auth.
for (const key of Object.keys(process.env)) {
  if (
    /^GIT_(?:DIR|COMMON_DIR|WORK_TREE|IMPLICIT_WORK_TREE|INDEX_FILE|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|GRAFT_FILE|NO_REPLACE_OBJECTS|REPLACE_REF_BASE|PREFIX|INTERNAL_SUPER_PREFIX|SHALLOW_FILE|NAMESPACE|CONFIG|CONFIG_PARAMETERS|CONFIG_COUNT|CONFIG_(?:KEY|VALUE)_\d+)$/.test(
      key,
    )
  )
    delete process.env[key];
}

const nextJest = require("next/jest.js");

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.ts",
    "<rootDir>/jest.setup.console-error.ts",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^contentlayer/generated$": "<rootDir>/.contentlayer/generated/index.mjs",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
  },
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/e2e/",
    "<rootDir>/tests/",
    "<rootDir>/vitest/",
  ],
  collectCoverageFrom: [
    "{app,components,lib,db}/**/*.{ts,tsx}",
    "!app/**",
    "!components/**",
    "!lib/**",
    "!db/**",
    "app/mark2/admin/authz/actions.ts",
    "app/ui/badge-maps.ts",
    "components/AnnouncementBanner.tsx",
    "components/BrandedLink.tsx",
    "components/Footer.tsx",
    "components/SiteHeader.tsx",
    "components/flowers/FlowersInline.tsx",
    "components/scrolls/formatReleaseDate.ts",
    "lib/build-info.ts",
    "lib/dates.ts",
    "lib/datetime.ts",
    "lib/env.ts",
    "lib/scrolls.ts",
    "lib/authz/**/*.{ts,tsx}",
    "!lib/authz/resolve.ts",
    "db/assert-database-url.ts",
    "db/pool.ts",
    "!**/*.d.ts",
    "!**/page.tsx",
    "!**/layout.tsx",
    "!**/sitemap.ts",
    "!**/_components/**",
    "!**/*.stories.tsx",
    "!e2e/**",
    "!playwright.config.ts",
    "!jest.config.cjs",
    "!scripts/**",
    "!auth.ts",
  ],
  coverageDirectory: "<rootDir>/coverage",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/app/api/",
    "<rootDir>/components/PersistentBannerHost.tsx",
    "<rootDir>/lib/persistent-banner.ts",
  ],
  coverageReporters: ["json-summary", "text", "lcov"],
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
  },
  // Do NOT set "transform"—next/jest configures it.
};

const getJestConfig = createJestConfig(customJestConfig);

module.exports = async () => {
  const config = await getJestConfig();

  // Exercise the real ESM lightbox with Next's SWC transformer in component tests.
  config.transformIgnorePatterns = config.transformIgnorePatterns.map(
    (pattern) =>
      pattern.replace(
        "/node_modules/",
        "/node_modules/(?!yet-another-react-lightbox/)",
      ),
  );

  return config;
};
