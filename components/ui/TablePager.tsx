"use client";

import { useId, useMemo } from "react";
import { cn } from "@/lib/cn";
import { PAGE_SIZE_OPTIONS } from "@/lib/pagination";

type TablePagerProps = {
  page: number;
  pageSize: number;
  total: number;
  isPending?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

export default function TablePager({
  page,
  pageSize,
  total,
  isPending = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  className,
}: TablePagerProps) {
  const selectId = useId();

  const { currentPage, totalPages } = useMemo(() => {
    if (total <= 0 || pageSize <= 0) {
      return { currentPage: 0, totalPages: 0 };
    }
    const calculatedTotalPages = Math.ceil(total / pageSize);
    const safePage = Math.min(Math.max(page, 1), calculatedTotalPages);
    return { currentPage: safePage, totalPages: calculatedTotalPages };
  }, [page, pageSize, total]);

  const sizes = useMemo(() => {
    const opts =
      pageSizeOptions && pageSizeOptions.length > 0
        ? pageSizeOptions
        : PAGE_SIZE_OPTIONS;
    return Array.from(new Set([...opts, pageSize])).sort((a, b) => a - b);
  }, [pageSizeOptions, pageSize]);

  const canGoPrev = currentPage > 1;
  const canGoNext = totalPages > 0 && currentPage < totalPages;

  return (
    <div
      className={cn(
        "mt-4 flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-3",
        className,
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-ink/70" aria-live="polite">
          {totalPages === 0
            ? "No results"
            : `Page ${currentPage} of ${totalPages} • ${total} total`}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={selectId} className="text-sm text-ink/70">
            Rows per page
          </label>
          <select
            id={selectId}
            className="form-input h-9"
            value={String(pageSize)}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            disabled={isPending}
          >
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn text-sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={isPending || !canGoPrev}
          >
            Prev
          </button>
          <button
            type="button"
            className="btn text-sm"
            onClick={() =>
              onPageChange(Math.min(totalPages || 1, currentPage + 1))
            }
            disabled={isPending || !canGoNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
