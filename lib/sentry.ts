// lib/sentry.ts
import * as Sentry from "@sentry/nextjs";
import buildInfo from "@/build-info.json" assert { type: "json" };

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  release: buildInfo.commitSha,
  environment: buildInfo.env,
});
