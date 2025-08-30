// lib/safeSentry.ts
type Sdk = typeof import("@sentry/nextjs");
let cached: Sdk | null | undefined;

export async function getSentry(): Promise<Sdk | null> {
  if (cached !== undefined) return cached ?? null;
  try {
    const mod = (await import("@sentry/nextjs")) as Sdk;
    cached = mod;
    return mod;
  } catch {
    cached = null;
    return null;
  }
}
