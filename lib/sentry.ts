import 'server-only';
import { isSentryEnabled } from './safeSentry';

let captureException = (_err: unknown) => {
  // noop in tests/e2e
};

if (isSentryEnabled) {
  const Sentry = await import('@sentry/nextjs');
  Sentry.init({
    integrations: (integrations: Array<{ name?: string }>) =>
      integrations.filter((i) => i.name !== 'Prisma'),
  });
  captureException = Sentry.captureException;
}

export { captureException };
