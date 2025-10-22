"use client";
import { useEffect } from "react";

export default function JsonLd({
  json,
}: {
  json: Record<string, unknown> | null;
}) {
  useEffect(() => {
    // no-op: purely for hydration safety
  }, []);
  if (!json) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
