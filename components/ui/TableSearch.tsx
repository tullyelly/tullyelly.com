"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

type SearchValue = string | number | null | undefined;

export function useTableSearch<Row>(
  rows: Row[],
  query: string,
  getSearchValues: (row: Row) => SearchValue[],
): Row[] {
  return useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();

    if (!needle) return rows;

    return rows.filter((row) =>
      getSearchValues(row).some((value) =>
        String(value ?? "")
          .toLocaleLowerCase()
          .includes(needle),
      ),
    );
  }, [getSearchValues, query, rows]);
}

export default function TableSearch({
  query,
  onQueryChange,
  label,
  placeholder = label,
  resultCount,
  resultLabel,
  ariaControls,
  className,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  label: string;
  placeholder?: string;
  resultCount?: number;
  resultLabel?: (count: number) => string;
  ariaControls?: string;
  className?: string;
}) {
  return (
    <div className="flex w-full items-center gap-2">
      <input
        type="search"
        className={cn("form-input min-w-0 flex-1 sm:max-w-72", className)}
        aria-label={label}
        aria-controls={ariaControls}
        placeholder={placeholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {query.length > 0 ? (
        <button
          type="button"
          className="btn shrink-0 whitespace-nowrap"
          onClick={() => onQueryChange("")}
        >
          Clear search
        </button>
      ) : null}
      {resultCount !== undefined && resultLabel ? (
        <p
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {resultLabel(resultCount)}
        </p>
      ) : null}
    </div>
  );
}
