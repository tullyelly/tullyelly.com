"use client";

import { Card } from "@/components/ui/Card";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GLOBAL_ERROR]", {
      message: error.message ?? "Unknown error",
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center py-8 sm:py-12">
      <Card
        as="section"
        accent="great-lakes-blue"
        className="w-full max-w-xl p-6 text-center sm:p-8"
        role="alert"
        aria-live="assertive"
        aria-labelledby="global-error-heading"
        aria-describedby="global-error-description"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--blue)]">
          Something failed
        </p>
        <h1
          id="global-error-heading"
          className="mt-2 text-2xl font-semibold text-ink sm:text-3xl"
        >
          We could not load this page
        </h1>
        <p
          id="global-error-description"
          className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink/75 sm:text-base"
        >
          Try again to reload the page content.
        </p>
        <button type="button" className="btn mt-6 px-6" onClick={reset}>
          Retry
        </button>
      </Card>
    </div>
  );
}
