// lib/safeSentry.ts
type Sdk = any;

export const isSentryEnabled =
  process.env.DISABLE_SENTRY !== "1" && process.env.NODE_ENV !== "test";

let cached: Sdk | null | undefined;

export async function getSentry(): Promise<Sdk | null> {
  if (!isSentryEnabled) return null;
  if (cached !== undefined) return cached ?? null;
  try {
    const mod = (await eval("import('@sentry/nextjs')")) as Sdk;
    cached = mod;
    return mod;
  } catch {
    cached = null;
    return null;
  }
}
