"use client";

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
import { clampDirectoryPage, safeDirectoryReturn } from "@/lib/directory-state";

type DirectoryIdentity = {
  id: number;
  slug: string;
  displayName: string;
  aliases?: string[];
};
const searchValues = (row: DirectoryIdentity) => [
  row.displayName,
  row.slug,
  ...(row.aliases ?? []),
];
export default function IdentityDirectoryClient({
  identities,
  directoryHref,
  title,
  emptyLabel,
}: {
  identities: DirectoryIdentity[];
  directoryHref: string;
  title: string;
  emptyLabel: string;
}) {
  const [q, setQ] = useDirectoryField<string>("q", "");
  const [sort, setSort] = useDirectoryField<string>("sort", "name", [
    "name",
    "name-desc",
  ]);
  const [page, setPage] = useDirectoryField<number>("page", 1);
  const [pageSize, setPageSize] = useDirectoryField<number>(
    "pageSize",
    25,
    [25, 50, 100],
  );
  const search = useDirectorySearch();
  const searched = useTableSearch(identities, q, searchValues);
  const rows = [...searched].sort(
    (a, b) =>
      (sort === "name-desc" ? -1 : 1) *
      (a.displayName.localeCompare(b.displayName, "en") ||
        a.slug.localeCompare(b.slug, "en")),
  );
  const current = clampDirectoryPage(page, rows.length, pageSize);
  const returnTo = safeDirectoryReturn(
    `${directoryHref}${search}`,
    directoryHref,
  );
  return (
    <section aria-label={`${title} directory`} className="space-y-4">
      <DataToolbar
        search={
          <TableSearch
            query={q}
            onQueryChange={setQ}
            label={`Search ${title}`}
            ariaControls="identity-results"
          />
        }
        filters={
          <select
            aria-label={`Sort ${title}`}
            className="form-input"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Name A to Z</option>
            <option value="name-desc">Name Z to A</option>
          </select>
        }
        actions={
          q || sort !== "name" ? (
            <button
              className="btn"
              onClick={() => {
                setQ("");
                setSort("name");
              }}
            >
              Clear filters
            </button>
          ) : null
        }
        result={
          <DataResultCount>
            {rows.length} {title}
          </DataResultCount>
        }
      />
      <ul id="identity-results" className="grid gap-3 sm:grid-cols-2">
        {rows
          .slice((current - 1) * pageSize, current * pageSize)
          .map((identity) => (
            <Card as="li" key={identity.id} className="min-w-0 p-4">
              <h2 className="!m-0 break-words text-lg font-semibold">
                <TagLink
                  tag={identity.slug}
                  directoryReturn={returnTo}
                  className="link-blue"
                >
                  {identity.displayName}
                </TagLink>
              </h2>
              <p className="!mb-0 mt-2 break-words text-sm text-muted-foreground">
                #{identity.slug}
              </p>
            </Card>
          ))}
      </ul>
      {rows.length === 0 ? (
        <PageState
          compact
          title={
            identities.length === 0
              ? emptyLabel
              : `No ${title} match these filters.`
          }
          description={
            identities.length === 0
              ? "Stories and relationships will appear as they are recorded."
              : "Try another name or clear your filters."
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
