// lib/sentry.ts
import buildInfo from "@/build-info.json";
import { getSentry } from "./safeSentry";

export async function initSentry() {
  const Sentry = await getSentry();
  if (!Sentry) return;

  Sentry.init({
    dsn:
      process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
    environment:
      buildInfo.env ||
      process.env.VERCEL_ENV ||
      process.env.NODE_ENV ||
      "development",
    release: buildInfo.commitSha,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
  });
}
