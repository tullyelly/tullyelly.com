"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useTransition } from "react";
import type { Route } from "next";
import ScrollDialog from "@/app/(components)/shaolin/ScrollDialog";
import { useScrollDialog } from "@/app/(components)/shaolin/useScrollDialog";
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
  const { open, setOpen, id, openWithId, close } = useScrollDialog();
  const triggerRef = useRef<HTMLAnchorElement | null>(null);
  const searchSnapshot = search?.toString() ?? "";
  const basePath = "/mark2/shaolin-scrolls";

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
      const nextPath = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(nextPath as Route);
    });
  }

  const openDialog = useCallback(
    (nextId: string | number, trigger?: HTMLAnchorElement) => {
      triggerRef.current = trigger ?? null;
      openWithId(nextId);
    },
    [openWithId],
  );

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      triggerRef.current?.focus();
      if (pathname !== basePath) {
        router.replace(basePath as Route);
      }
    }
  };

  useEffect(() => {
    const normalized =
      pathname.endsWith("/") && pathname !== "/"
        ? pathname.slice(0, -1)
        : pathname;
    if (normalized === basePath) {
      close();
      return;
    }
    if (!normalized.startsWith(basePath)) return;
    const segments = normalized.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && /^\d+$/.test(lastSegment)) {
      openDialog(lastSegment);
    }
  }, [pathname, basePath, close, openDialog]);

  return (
    <div
      className="space-y-4"
      aria-live="polite"
      aria-busy={isPending ? "true" : undefined}
      role="region"
    >
      <div className="md:hidden" suppressHydrationWarning>
        <ReleaseCards rows={rows} onOpen={openDialog} />
      </div>
      <ReleasesTable rows={rows} onOpen={openDialog} />
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
      <ScrollDialog open={open} onOpenChange={handleOpenChange} id={id} />
    </div>
  );
}
