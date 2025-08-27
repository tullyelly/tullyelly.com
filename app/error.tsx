'use client';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[GLOBAL_ERROR]', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <html>
      <body>
        <h1>Something went sideways.</h1>
        <button onClick={reset}>Retry</button>
      </body>
    </html>
  );
}
