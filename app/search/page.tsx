import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { makeListGenerateMetadata } from "@/lib/seo/factories";
import DataToolbar from "@/components/ui/DataToolbar";
import { Badge } from "@/app/ui/Badge";
import { searchSite } from "@/lib/search/site-search";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string } | undefined>;
};

export const generateMetadata = makeListGenerateMetadata({
  path: "/search",
  getTitle: (q) => {
    const base = "Search | tullyelly";
    return q ? `${base}; q: "${q}"` : base;
  },
  getDescription: (q) => {
    return q
      ? `Results for "${q}" across tullyelly pages and Chronicles.`
      : "Search across tullyelly pages and Chronicles.";
  },
});

export default async function SearchPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const rawQuery = params?.q ?? "";
  const query = rawQuery.trim();
  const results = await searchSite(query);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-[color:var(--text-strong,#0e2240)]">
          Search
        </h1>
        {query ? (
          <p className="text-sm text-[color:var(--text-muted,#58708c)]">
            Showing {results.length}{" "}
            {results.length === 1 ? "match" : "matches"} for{" "}
            <span className="font-medium text-[color:var(--text-strong,#0e2240)]">
              {query}
            </span>
          </p>
        ) : (
          <p className="text-sm text-[color:var(--text-muted,#58708c)]">
            Search tullyelly pages and Chronicles.
          </p>
        )}
      </header>
      <DataToolbar
        ariaLabel="Site search controls"
        search={
          <form
            action="/search"
            method="get"
            role="search"
            className="flex w-full items-center gap-2"
          >
            <input
              type="search"
              name="q"
              aria-label="Search tullyelly"
              placeholder="Search tullyelly"
              defaultValue={query}
              className="form-input min-w-0 flex-1 sm:max-w-72"
            />
            <button type="submit" className="btn shrink-0">
              Search
            </button>
          </form>
        }
        actions={
          query ? (
            <Link
              href="/search"
              className="btn whitespace-nowrap !text-white !no-underline"
            >
              Clear search
            </Link>
          ) : null
        }
      />
      {query ? (
        results.length ? (
          <ol className="space-y-3">
            {results.map((result) => {
              const linkContent = (
                <>
                  <span className="flex items-center gap-2">
                    <span className="text-base font-medium text-[color:var(--text-strong,#0e2240)]">
                      {result.title}
                    </span>
                    <Badge className="bg-[color:var(--surface-subtle,#f8fafc)] text-[color:var(--text-muted,#58708c)] ring-[color:var(--border-subtle,#d1d5db)]">
                      {result.type === "chronicle" ? "Chronicle" : "Page"}
                    </Badge>
                  </span>
                  <span className="mt-1 text-xs text-[color:var(--text-muted,#58708c)]">
                    {result.persona ? `${result.persona} | ` : ""}
                    {result.href}
                  </span>
                  {result.description ? (
                    <span className="mt-1 text-sm text-[color:var(--text-muted,#58708c)]">
                      {result.description}
                    </span>
                  ) : null}
                </>
              );

              return (
                <li key={`${result.type}:${result.href}`}>
                  {result.external ? (
                    <a
                      href={result.href}
                      className={cn(
                        "flex flex-col rounded-2xl border border-[color:var(--border-subtle,#d1d5db)] bg-white px-4 py-3 transition hover:border-[color:var(--brand-blue,#0077c0)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue,#0077c0)] focus-visible:ring-offset-2",
                      )}
                      rel="noreferrer noopener"
                      target={result.target ?? "_blank"}
                    >
                      {linkContent}
                    </a>
                  ) : (
                    <Link
                      href={result.href as Route}
                      className={cn(
                        "flex flex-col rounded-2xl border border-[color:var(--border-subtle,#d1d5db)] bg-white px-4 py-3 transition hover:border-[color:var(--brand-blue,#0077c0)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue,#0077c0)] focus-visible:ring-offset-2",
                      )}
                    >
                      {linkContent}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-[color:var(--text-muted,#58708c)]">
            No matches found for {query}.
          </p>
        )
      ) : (
        <p className="text-sm text-[color:var(--text-muted,#58708c)]">
          No search query yet.
        </p>
      )}
    </section>
  );
}
