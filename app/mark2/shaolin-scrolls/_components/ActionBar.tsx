import DataToolbar, { DataResultCount } from "@/components/ui/DataToolbar";
import type { Sort } from "@/lib/scrolls";

export type ActionBarProps = {
  q: string | null;
  sort: Sort;
  total: number;
};

const ENABLED = process.env.NEXT_PUBLIC_RELEASE_CREATION_ENABLED === "1";

export default function ActionBar({ q, sort, total }: ActionBarProps) {
  const qVal = q ?? "";
  return (
    <DataToolbar
      ariaLabel="Shaolin Scroll controls"
      search={
        <form
          role="search"
          action="/mark2/shaolin-scrolls"
          method="get"
          className="flex w-full flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            name="q"
            type="search"
            placeholder="Search scrolls"
            aria-label="Search scrolls"
            defaultValue={qVal}
            className="form-input w-full sm:w-72"
            autoComplete="off"
          />
          <select
            name="sort"
            defaultValue={sort}
            className="form-input w-full sm:w-auto"
            aria-label="Sort scrolls"
          >
            <option value="semver:desc">Newest release first</option>
            <option value="semver:asc">Oldest release first</option>
          </select>
          <button type="submit" className="btn shrink-0">
            Search
          </button>
        </form>
      }
      actions={
        ENABLED ? (
          <div id="action-zone" className="flex flex-wrap items-center gap-2">
            <form
              method="post"
              action="/api/shaolin-scrolls/patch"
              className="inline"
            >
              <input type="hidden" name="label" value={qVal} />
              <button type="submit" className="btn" aria-label="Create Patch">
                Create Patch
              </button>
            </form>
            <form
              method="post"
              action="/api/shaolin-scrolls/minor"
              className="inline"
            >
              <input type="hidden" name="label" value={qVal} />
              <button type="submit" className="btn" aria-label="Create Minor">
                Create Minor
              </button>
            </form>
          </div>
        ) : null
      }
      result={
        <DataResultCount>
          {total} scroll{total === 1 ? "" : "s"}
        </DataResultCount>
      }
    />
  );
}
