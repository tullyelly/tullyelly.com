"use client";

import { useDirectoryField, useDirectorySearch } from "./useDirectoryField";
import {
  clampDirectoryPage,
  safeDirectoryReturn,
  withDirectoryReturn,
} from "@/lib/directory-state";

/** Shared client-only paging; callers retain ownership of filtering and ordering. */
export function useDirectoryPagination<Row>(rows: Row[], directory: string) {
  const [page, setPage] = useDirectoryField<number>("page", 1);
  const [pageSize, setPageSize] = useDirectoryField<number>(
    "pageSize",
    25,
    [25, 50, 100],
  );
  const search = useDirectorySearch();
  const current = clampDirectoryPage(page, rows.length, pageSize);
  const returnTo = safeDirectoryReturn(`${directory}${search}`, directory);
  return {
    pageRows: rows.slice((current - 1) * pageSize, current * pageSize),
    detailHref: (href: string) =>
      search ? withDirectoryReturn(href, returnTo) : href,
    pagination: {
      page: current,
      pageSize,
      total: rows.length,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
      pageSizeOptions: [25, 50, 100],
    },
  };
}
