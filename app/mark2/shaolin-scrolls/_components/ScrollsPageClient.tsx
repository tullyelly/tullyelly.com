"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import ReleaseCards from "@/components/scrolls/ReleaseCards";
import ReleasesTable from "@/components/scrolls/ReleasesTable";
import TablePager from "@/components/ui/TablePager";
import type { ReleaseRow, Sort } from "@/lib/scrolls";

type ScrollsPageClientProps = {
  rows: ReleaseRow[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    q: string;
    sort: Sort;
  };
};

export default function ScrollsPageClient({
  rows,
  meta,
}: ScrollsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/mark2/shaolin-scrolls";
  const search = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchSnapshot = search?.toString() ?? "";

  function updateQuery(
    next: Record<string, string | undefined>,
    options: { resetPage?: boolean } = {},
  ) {
    const { resetPage = false } = options;
    const current = new URLSearchParams(searchSnapshot);
    Object.entries(next).forEach(([key, value]) => {
      if (!value) current.delete(key);
      else current.set(key, value);
    });
    if (resetPage) {
      current.delete("page");
    }
    const queryString = current.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    });
  }

  return (
    <div className="space-y-4">
      <div className="md:hidden" suppressHydrationWarning>
        <ReleaseCards rows={rows} />
      </div>
      <ReleasesTable rows={rows} />
      <TablePager
        page={meta.page}
        pageSize={meta.pageSize}
        total={meta.total}
        isPending={isPending}
        onPageChange={(nextPage) => updateQuery({ page: String(nextPage) })}
        onPageSizeChange={(nextSize) =>
          updateQuery({ pageSize: String(nextSize) }, { resetPage: true })
        }
      />
    </div>
  );
}
