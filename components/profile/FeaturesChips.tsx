"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function FeaturesChips({ features }: { features: string[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return features;
    return features.filter((feature) =>
      feature.toLowerCase().includes(trimmed),
    );
  }, [features, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {features.length} features
        </p>
        <div className="w-full max-w-xs">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter features"
            aria-label="Filter features"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {filtered.length === 0 ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <p>
              {features.length === 0
                ? "No features are available."
                : "No features match the current filter."}
            </p>
            {features.length > 0 && query.length > 0 ? (
              <button
                type="button"
                className="btn"
                onClick={() => setQuery("")}
              >
                Clear filter
              </button>
            ) : null}
          </div>
        ) : (
          filtered.map((feature) => (
            <span
              key={feature}
              className={cn(
                "rounded-full border bg-muted px-3 py-1 text-xs font-semibold",
              )}
            >
              {feature}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
