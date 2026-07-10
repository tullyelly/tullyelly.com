import {
  isBreadcrumbDebugForceEnabled,
  isDbSkipEnabled,
  isDebugDbMetadataEnabled,
  isE2EModeEnabled,
  isMenuBypassEnabled,
  isProductionRuntime,
  isTestMenuModeEnabled,
} from "@/lib/escape-hatches";

function env(values: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return values as NodeJS.ProcessEnv;
}

describe("escape hatch guards", () => {
  it("treats NODE_ENV production and Vercel production as production runtime", () => {
    expect(isProductionRuntime(env({ NODE_ENV: "production" }))).toBe(true);
    expect(isProductionRuntime(env({ VERCEL_ENV: "production" }))).toBe(true);
    expect(
      isProductionRuntime(env({ NODE_ENV: "test", VERCEL_ENV: "preview" })),
    ).toBe(false);
  });

  it("honors local and test escape hatches outside production", () => {
    expect(isDbSkipEnabled(env({ NODE_ENV: "test", SKIP_DB: "true" }))).toBe(
      true,
    );
    expect(isE2EModeEnabled(env({ NODE_ENV: "test", E2E_MODE: "1" }))).toBe(
      true,
    );
    expect(
      isTestMenuModeEnabled(
        env({ NODE_ENV: "development", NEXT_PUBLIC_TEST_MODE: "1" }),
      ),
    ).toBe(true);
    expect(
      isMenuBypassEnabled(
        env({ NODE_ENV: "development", NEXT_PUBLIC_MENU_SHOW_ALL: "yes" }),
      ),
    ).toBe(true);
    expect(
      isDebugDbMetadataEnabled(
        env({ NODE_ENV: "development", DEBUG_DB_META: "1" }),
      ),
    ).toBe(true);
  });

  it("ignores escape hatch flags in production runtime", () => {
    const productionEnv = env({
      NODE_ENV: "production",
      DEBUG_DB_META: "1",
      E2E_MODE: "1",
      FORCE_TEST_MENU: "1",
      NEXT_PUBLIC_BC_FORCE: "true",
      NEXT_PUBLIC_DEBUG_DB_META: "1",
      NEXT_PUBLIC_MENU_SHOW_ALL: "1",
      NEXT_PUBLIC_TEST_MODE: "1",
      SKIP_DB: "true",
      TEST_MODE: "1",
    });

    expect(isDbSkipEnabled(productionEnv)).toBe(false);
    expect(isE2EModeEnabled(productionEnv)).toBe(false);
    expect(isTestMenuModeEnabled(productionEnv)).toBe(false);
    expect(isMenuBypassEnabled(productionEnv)).toBe(false);
    expect(isDebugDbMetadataEnabled(productionEnv)).toBe(false);
    expect(isBreadcrumbDebugForceEnabled(productionEnv)).toBe(false);
  });
});
