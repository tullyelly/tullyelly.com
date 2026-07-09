type RuntimeEnv = NodeJS.ProcessEnv;

function getRuntimeEnv(): RuntimeEnv {
  if (typeof process === "undefined" || !process.env) {
    return {} as RuntimeEnv;
  }
  return process.env;
}

export function isTruthyFlag(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function isProductionRuntime(
  env: RuntimeEnv = getRuntimeEnv(),
): boolean {
  return env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
}

export function isDbSkipEnabled(env: RuntimeEnv = getRuntimeEnv()): boolean {
  return !isProductionRuntime(env) && isTruthyFlag(env.SKIP_DB);
}

export function isE2EModeEnabled(env: RuntimeEnv = getRuntimeEnv()): boolean {
  return !isProductionRuntime(env) && isTruthyFlag(env.E2E_MODE);
}

export function isNextE2EEnabled(env: RuntimeEnv = getRuntimeEnv()): boolean {
  return !isProductionRuntime(env) && isTruthyFlag(env.NEXT_E2E);
}

export function isPublicE2EModeEnabled(
  env: RuntimeEnv = getRuntimeEnv(),
): boolean {
  return !isProductionRuntime(env) && isTruthyFlag(env.NEXT_PUBLIC_E2E_MODE);
}

export function isTestMenuModeEnabled(
  env: RuntimeEnv = getRuntimeEnv(),
): boolean {
  if (isProductionRuntime(env)) return false;
  return (
    isTruthyFlag(env.NEXT_PUBLIC_TEST_MODE) ||
    isTruthyFlag(env.TEST_MODE) ||
    isTruthyFlag(env.FORCE_TEST_MENU)
  );
}

export function isMenuBypassEnabled(
  env: RuntimeEnv = getRuntimeEnv(),
): boolean {
  return (
    !isProductionRuntime(env) && isTruthyFlag(env.NEXT_PUBLIC_MENU_SHOW_ALL)
  );
}

export function isDebugDbMetadataEnabled(
  env: RuntimeEnv = getRuntimeEnv(),
): boolean {
  return (
    !isProductionRuntime(env) &&
    (isTruthyFlag(env.DEBUG_DB_META) ||
      isTruthyFlag(env.NEXT_PUBLIC_DEBUG_DB_META))
  );
}

export function isDiagnosticsDebugEnabled(
  env: RuntimeEnv = getRuntimeEnv(),
): boolean {
  return !isProductionRuntime(env) && isTruthyFlag(env.DEBUG_DIAG);
}

export function isImageSanityCheckEnabled(
  env: RuntimeEnv = getRuntimeEnv(),
): boolean {
  return !isProductionRuntime(env) && isTruthyFlag(env.DEBUG_IMAGE_CHECK);
}

export function isBreadcrumbDebugAllowed(
  env: RuntimeEnv = getRuntimeEnv(),
): boolean {
  return !isProductionRuntime(env);
}

export function isBreadcrumbDebugForceEnabled(
  env: RuntimeEnv = getRuntimeEnv(),
): boolean {
  return (
    isBreadcrumbDebugAllowed(env) && isTruthyFlag(env.NEXT_PUBLIC_BC_FORCE)
  );
}
