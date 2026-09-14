"use client";

import { PageState } from "@/components/ui/PageState";
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
    <PageState
      role="alert"
      eyebrow="Something failed"
      title="We could not load this page"
      description="Try again to reload the page content."
      actions={
        <button type="button" className="btn px-6" onClick={reset}>
          Retry
        </button>
      }
    />
  );
}
