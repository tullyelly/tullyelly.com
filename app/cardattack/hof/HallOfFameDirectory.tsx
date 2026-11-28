"use client";

import type { ComponentProps } from "react";
import HallOfFamers from "../tcdb-trades/_components/TcdbTradeHallOfFameTable";
import Inductions from "../tcdb-trades/_components/TcdbTradeHallOfFameInductionsTable";
import {
  useDirectoryField,
  useDirectorySearch,
} from "@/components/directory/useDirectoryField";
import { useDirectoryPagination } from "@/components/directory/useDirectoryPagination";
import {
  safeDirectoryReturn,
  withDirectoryReturn,
} from "@/lib/directory-state";
import DataToolbar, { DataResultCount } from "@/components/ui/DataToolbar";
import TableSearch, { useTableSearch } from "@/components/ui/TableSearch";
import { PageState } from "@/components/ui/PageState";
import TablePager from "@/components/ui/TablePager";

type Props = {
  partners: ComponentProps<typeof HallOfFamers>["rows"];
  inductions: ComponentProps<typeof Inductions>["rows"];
};
export default function HallOfFameDirectory({ partners, inductions }: Props) {
  const [q, setQ] = useDirectoryField<string>("q", "");
  const [view, setView] = useDirectoryField<string>("view", "partners", [
    "partners",
    "inductions",
  ]);
  const [sort, setSort] = useDirectoryField<string>("sort", "default", [
    "default",
    "name",
    "latest",
  ]);
  const matchedPartners = useTableSearch(partners, q, (row) => [
    row.tcdbUsername,
    row.name,
    ...(row.categoryTags ?? []),
  ]);
  const matchedInductions = useTableSearch(inductions, q, (row) => [
    row.tcdbUsername,
    row.name,
    row.setName,
    row.categoryTag,
    row.tradeId,
  ]);
  const partnerRows = [...matchedPartners].sort(
    (a, b) =>
      (sort === "name"
        ? a.tcdbUsername.localeCompare(b.tcdbUsername)
        : sort === "latest"
          ? b.latestInductedDate.localeCompare(a.latestInductedDate)
          : b.inductionCount - a.inductionCount ||
            b.latestInductedDate.localeCompare(a.latestInductedDate)) ||
      a.tcdbUsername.localeCompare(b.tcdbUsername),
  );
  const inductionRows = [...matchedInductions].sort(
    (a, b) =>
      (sort === "name"
        ? a.setName.localeCompare(b.setName)
        : b.inductedDate.localeCompare(a.inductedDate)) ||
      a.setSlug.localeCompare(b.setSlug) ||
      a.tradeId.localeCompare(b.tradeId),
  );
  const selected = view === "partners" ? partnerRows : inductionRows;
  const { pagination } = useDirectoryPagination<unknown>(
    selected,
    "/cardattack/hof",
  );
  const search = useDirectorySearch();
  const returnTo = safeDirectoryReturn(
    `/cardattack/hof${search}`,
    "/cardattack/hof",
  );
  const detailHref = (href: string) => withDirectoryReturn(href, returnTo);
  const start = (pagination.page - 1) * pagination.pageSize;
  return (
    <section className="space-y-5" aria-label="Hall of Fame directory">
      <DataToolbar
        search={
          <TableSearch
            label="Search Hall of Fame"
            query={q}
            onQueryChange={setQ}
          />
        }
        filters={
          <>
            <select
              className="form-input"
              aria-label="Hall of Fame view"
              value={view}
              onChange={(e) => setView(e.target.value)}
            >
              <option value="partners">Hall of Famers</option>
              <option value="inductions">Set inductions</option>
            </select>
            <select
              className="form-input"
              aria-label="Sort Hall of Fame"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">Default order</option>
              <option value="name">Name A to Z</option>
              <option value="latest">Latest induction</option>
            </select>
          </>
        }
        actions={
          q || sort !== "default" ? (
            <button
              className="btn"
              onClick={() => {
                setQ("");
                setSort("default");
              }}
            >
              Clear filters
            </button>
          ) : null
        }
        result={
          <DataResultCount>
            {selected.length}{" "}
            {selected.length === 0 && q ? (
              <PageState
                compact
                title="No Hall of Fame results match these filters."
                description="Try another name, set or category."
              />
            ) : view === "partners" ? (
              selected.length === 1 ? (
                "Hall of Famer"
              ) : (
                "Hall of Famers"
              )
            ) : selected.length === 1 ? (
              "induction"
            ) : (
              "inductions"
            )}
          </DataResultCount>
        }
      />
      {selected.length === 0 && q ? (
        <PageState
          compact
          title="No Hall of Fame results match these filters."
          description="Try another name, set or category."
        />
      ) : view === "partners" ? (
        <HallOfFamers
          rows={partnerRows.slice(start, start + pagination.pageSize)}
          preserveOrder
          detailHref={detailHref}
        />
      ) : (
        <Inductions
          rows={inductionRows.slice(start, start + pagination.pageSize)}
          preserveOrder
          detailHref={detailHref}
        />
      )}
      <TablePager {...pagination} />
    </section>
  );
}
