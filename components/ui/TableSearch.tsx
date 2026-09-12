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
    <>
      <input
        type="search"
        className={cn("form-input h-10 w-full sm:w-72", className)}
        aria-label={label}
        aria-controls={ariaControls}
        placeholder={placeholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {resultCount !== undefined && resultLabel ? (
        <p className="sr-only" aria-live="polite">
          {resultLabel(resultCount)}
        </p>
      ) : null}
    </>
  );
}
