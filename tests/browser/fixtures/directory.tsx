import React from "react";
import { createRoot } from "react-dom/client";
import "@/app/globals.css";
import { useDirectoryField } from "@/components/directory/useDirectoryField";
import PageIntro from "@/components/layout/PageIntro";
import PageSections from "@/components/layout/PageSections";
import DataToolbar, { DataResultCount } from "@/components/ui/DataToolbar";
import TableSearch from "@/components/ui/TableSearch";
import TablePager from "@/components/ui/TablePager";
import { PageState } from "@/components/ui/PageState";
import { clampDirectoryPage } from "@/lib/directory-state";

function Fixture() {
  const [q, setQ] = useDirectoryField<string>("q", "");
  const [sort, setSort] = useDirectoryField<string>("sort", "name", [
    "name",
    "reverse",
  ]);
  const [page, setPage] = useDirectoryField<number>("page", 1);
  const [size, setSize] = useDirectoryField<number>("pageSize", 25, [25, 50]);
  const rows = Array.from(
    { length: 60 },
    (_, i) => `Homie ${String(i + 1).padStart(2, "0")}`,
  ).filter((name) => name.toLowerCase().includes(q.toLowerCase()));
  if (sort === "reverse") rows.reverse();
  const current = clampDirectoryPage(page, rows.length, size);
  return (
    <main className="mx-auto max-w-[72rem] space-y-6 p-4">
      <PageIntro
        title="Directory fixture with a long title that must wrap"
        eyebrow="cardattack"
        description="Isolated public browse state."
        showProductionLink={false}
      />
      <DataToolbar
        search={
          <TableSearch
            label="Search homies"
            query={q}
            onQueryChange={setQ}
            ariaControls="results"
          />
        }
        filters={
          <label>
            Sort
            <select
              aria-label="Sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="reverse">Reverse</option>
            </select>
          </label>
        }
        result={<DataResultCount>{rows.length} results</DataResultCount>}
      />
      <ul id="results">
        {rows.slice((current - 1) * size, current * size).map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      {rows.length === 0 ? (
        <PageState
          compact
          title="No matches"
          description="Try another search."
          actions={<button onClick={() => setQ("")}>Reset search</button>}
        />
      ) : null}
      <TablePager
        page={current}
        pageSize={size}
        total={rows.length}
        onPageChange={setPage}
        onPageSizeChange={setSize}
        pageSizeOptions={[25, 50]}
      />
      <PageSections
        sections={[
          {
            id: "relationships",
            title: "Relationships",
            content: <p>No relationships recorded yet.</p>,
          },
          {
            id: "history",
            title: "History",
            content: <p>Zero cards is a recorded count.</p>,
          },
        ]}
      />
      <PageState compact role="status" title="Loading history" />
      <PageState
        compact
        title="History unavailable"
        description="The source could not be loaded."
      />
      <PageState
        compact
        role="alert"
        title="Could not load details"
        description="Try again later."
      />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
