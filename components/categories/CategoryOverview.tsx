"use client";
import { useState } from "react";
import Link from "next/link";
import CategoryRankSummary from "@/components/categories/CategoryRankSummary";
import { Card } from "@ui";
import TableSearch, { useTableSearch } from "@/components/ui/TableSearch";
import DataToolbar, { DataResultCount } from "@/components/ui/DataToolbar";
import { Stat, StatGrid } from "@/components/ui/StatGrid";
import {
  type CategorySnapshot,
  formatCategoryChange,
  formatCategoryCount,
} from "@/lib/card-categories";
import { fmtDate } from "@/lib/datetime";

const searchValues = (row: CategorySnapshot) => [row.name, row.slug];
export default function CategoryOverview({
  categories,
}: {
  categories: CategorySnapshot[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const matches = useTableSearch(categories, query, searchValues);
  const rows = [...matches].sort((a, b) =>
    sort === "ranking"
      ? (a.ranking ?? Infinity) - (b.ranking ?? Infinity) ||
        a.name.localeCompare(b.name)
      : sort === "date"
        ? (b.measured_on ?? "").localeCompare(a.measured_on ?? "") ||
          a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
  );
  const tracked = categories.filter(
    (category) => category.snapshot_id !== null,
  ).length;
  return (
    <div className="space-y-6">
      <StatGrid>
        <Stat label="Configured categories" value={categories.length} />
        <Stat label="With measurements" value={tracked} />
        <Stat
          label="Awaiting first snapshot"
          value={categories.length - tracked}
        />
      </StatGrid>
      {categories.length === 0 ? (
        <p>No categories are configured yet.</p>
      ) : (
        <>
          <DataToolbar
            search={
              <TableSearch
                query={query}
                onQueryChange={setQuery}
                label="Search categories"
                ariaControls="category-results"
              />
            }
            filters={
              <label className="text-sm">
                Sort categories{" "}
                <select
                  className="form-input"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="date">Latest measurement</option>
                  <option value="ranking">TCDb rank</option>
                </select>
              </label>
            }
            result={
              <DataResultCount>{rows.length} categories match</DataResultCount>
            }
          />
          <div
            id="category-results"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {rows.map((row) => (
              <Card
                key={row.slug}
                as="section"
                className="min-w-0 border-[color:var(--trade-border)] bg-[color:var(--trade-off-white)]"
              >
                <h2 className="text-xl font-semibold">
                  <Link
                    className="text-[color:var(--trade-blue)] underline"
                    href={`/cardattack/categories/${row.slug}`}
                  >
                    {row.name}
                  </Link>
                </h2>
                {row.card_count === null ? (
                  <p>Not tracked yet</p>
                ) : (
                  <dl className="mt-3 space-y-2 text-sm">
                    <div>
                      <dt>Latest owned-card count</dt>
                      <dd className="text-xl font-semibold tabular-nums">
                        {formatCategoryCount(row.card_count)}
                      </dd>
                    </div>
                    <div>
                      <dt>Measured on</dt>
                      <dd>{fmtDate(row.measured_on)}</dd>
                    </div>
                    <div>
                      <dt>Change since previous measurement</dt>
                      <dd>{formatCategoryChange(row.count_change)}</dd>
                    </div>
                    <CategoryRankSummary snapshot={row} />
                    {row.previous_date ? (
                      <div>
                        <dt>Previous measurement</dt>
                        <dd>
                          {row.previous_count === null
                            ? ""
                            : formatCategoryCount(row.previous_count)}{" "}
                          cards on {fmtDate(row.previous_date)}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                )}
              </Card>
            ))}
          </div>
          {!rows.length ? <p>No categories match your search.</p> : null}
        </>
      )}
    </div>
  );
}
