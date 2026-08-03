"use client";

import { useMemo } from "react";

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
  className = "",
}: {
  query: string;
  onQueryChange: (query: string) => void;
  label: string;
  placeholder?: string;
  resultCount: number;
  resultLabel: (count: number) => string;
  className?: string;
}) {
  return (
    <>
      <input
        type="search"
        className={`form-input h-9 w-full md:w-64 ${className}`.trim()}
        aria-label={label}
        placeholder={placeholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <p className="sr-only" aria-live="polite">
        {resultLabel(resultCount)}
      </p>
    </>
  );
}
