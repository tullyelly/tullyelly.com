"use client";

import Link from "next/link";
import TagLink from "@/components/tags/TagLink";
import { Card } from "@ui";
import DataToolbar, { DataResultCount } from "@/components/ui/DataToolbar";
import TableSearch, { useTableSearch } from "@/components/ui/TableSearch";
import TablePager from "@/components/ui/TablePager";
import { PageState } from "@/components/ui/PageState";
import {
  useDirectoryField,
  useDirectorySearch,
} from "@/components/directory/useDirectoryField";
import {
  clampDirectoryPage,
  safeDirectoryReturn,
  withDirectoryReturn,
} from "@/lib/directory-state";
import type { CrateAppearance } from "@/lib/music/crates";
import { fmtDate } from "@/lib/datetime";

export function appearanceTitle(
  row: CrateAppearance,
  names: Record<string, string>,
) {
  return (
    row.song ??
    row.title ??
    row.album ??
    (row.artistTag ? names[row.artistTag] : undefined) ??
    row.id ??
    "Music appearance"
  );
}
export default function CratesDirectory({
  appearances,
  artistNames,
}: {
  appearances: CrateAppearance[];
  artistNames: Record<string, string>;
}) {
  const [q, setQ] = useDirectoryField<string>("q", "");
  const [sort, setSort] = useDirectoryField<string>("sort", "latest", [
    "latest",
    "oldest",
    "title",
  ]);
  const [category, setCategory] = useDirectoryField<string>("category", "all", [
    "all",
    "video",
    "playlist",
  ]);
  const [page, setPage] = useDirectoryField<number>("page", 1);
  const [pageSize, setPageSize] = useDirectoryField<number>(
    "pageSize",
    25,
    [25, 50, 100],
  );
  const search = useDirectorySearch();
  const returnTo = safeDirectoryReturn(
    `/theabbott/crates${search}`,
    "/theabbott/crates",
  );
  const searched = useTableSearch(appearances, q, (row) => [
    appearanceTitle(row, artistNames),
    row.artistTag,
    row.artistTag ? artistNames[row.artistTag] : "",
    row.album,
    row.chronicleTitle,
  ]);
  const rows = searched
    .filter((row) => category === "all" || row.type === category)
    .sort(
      (a, b) =>
        (sort === "title"
          ? appearanceTitle(a, artistNames).localeCompare(
              appearanceTitle(b, artistNames),
              "en",
            )
          : (sort === "latest" ? -1 : 1) *
            a.chronicleDate.localeCompare(b.chronicleDate)) ||
        a.chronicleUrl.localeCompare(b.chronicleUrl),
    );
  const current = clampDirectoryPage(page, rows.length, pageSize);
  return (
    <section className="space-y-4" aria-label="Music appearances">
      <h2 className="text-2xl font-semibold">Music appearances</h2>
      <DataToolbar
        search={
          <TableSearch
            label="Search music"
            query={q}
            onQueryChange={setQ}
            placeholder="Search music, artists or chronicles"
            ariaControls="music-results"
          />
        }
        filters={
          <>
            <select
              className="form-input"
              aria-label="Appearance type"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All appearances</option>
              <option value="video">Videos</option>
              <option value="playlist">Playlists</option>
            </select>
            <select
              className="form-input"
              aria-label="Sort music"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="latest">Latest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A to Z</option>
            </select>
          </>
        }
        actions={
          q || sort !== "latest" || category !== "all" ? (
            <button
              className="btn"
              onClick={() => {
                setQ("");
                setSort("latest");
                setCategory("all");
              }}
            >
              Clear filters
            </button>
          ) : null
        }
        result={
          <DataResultCount>
            {rows.length} {rows.length === 1 ? "appearance" : "appearances"}
          </DataResultCount>
        }
      />
      <ul id="music-results" className="grid gap-4 md:grid-cols-2">
        {rows.slice((current - 1) * pageSize, current * pageSize).map((row) => (
          <Card
            as="li"
            key={`${row.chronicleUrl}-${row.type}-${row.id ?? row.url}-${row.artistTag ?? ""}-${row.song ?? row.title ?? ""}`}
            className="min-w-0 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {row.type}
            </p>
            <h3 className="mt-2 break-words text-lg font-semibold">
              {appearanceTitle(row, artistNames)}
            </h3>
            {row.artistTag ? (
              <p className="mt-1 text-sm">
                <TagLink tag={row.artistTag} directoryReturn={returnTo}>
                  {artistNames[row.artistTag] ?? row.artistTag}
                </TagLink>
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              <time dateTime={row.chronicleDate}>
                {fmtDate(row.chronicleDate)}
              </time>
            </p>
            <Link
              href={withDirectoryReturn(row.chronicleUrl, returnTo)}
              className="mt-3 inline-block break-words link-blue"
            >
              {row.chronicleTitle}
            </Link>
          </Card>
        ))}
      </ul>
      {rows.length === 0 ? (
        <PageState
          compact
          title={
            appearances.length === 0
              ? "No music appearances recorded yet."
              : "No music matches these filters."
          }
          description={
            appearances.length === 0
              ? "Music will appear here alongside its original Chronicle."
              : "Try another artist, title or appearance type."
          }
        />
      ) : null}
      <TablePager
        page={current}
        pageSize={pageSize}
        total={rows.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[25, 50, 100]}
      />
    </section>
  );
}
