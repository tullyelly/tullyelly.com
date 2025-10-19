"use client";
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
    <div>
      <h1>Something went sideways.</h1>
      <button className="btn" onClick={reset}>
        Retry
      </button>
    </div>
  );
}
