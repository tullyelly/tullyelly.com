import { buildInfo } from "@/lib/build-info";
import { getSentry, isSentryEnabled } from "@/lib/safeSentry";

export async function initSentry() {
  if (!isSentryEnabled) return;
  const Sentry = await getSentry();
  if (!Sentry) return;
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    release: buildInfo.commitSha,
    environment: buildInfo.env,
    integrations: (integrations) =>
      integrations.filter((i: any) => i.name !== "Prisma"),
  });
}

export const captureException = (...args: any[]) => {
  if (!isSentryEnabled) return;
  getSentry().then((S) => S?.captureException(...args));
};
