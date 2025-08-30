declare module '@sentry/nextjs' {
  export function init(...args: unknown[]): void;
  export function captureException(err: unknown): void;
}
