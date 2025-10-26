import Link from "next/link";
import type { Route } from "next";
import { getMenu } from "@/lib/menu/getMenu";
import { flattenLinks, type FlatLink } from "@/lib/menu.flatten";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string } | undefined>;
};

type Result = {
  link: FlatLink;
  score: number;
};

const MAX_RESULTS = 30;

function normalize(value: string): string {
  return value.toLowerCase();
}

function computeScore(link: FlatLink, query: string): number {
  const needle = normalize(query);
  if (!needle) return 0;

  let score = 0;
  const label = normalize(link.label);

  if (label === needle) {
    score += 6;
  } else if (label.includes(needle)) {
    score += 4;
  }

  const keywords = link.keywords.map(normalize);
  if (keywords.some((entry) => entry === needle)) {
    score += 3;
  } else if (keywords.some((entry) => entry.includes(needle))) {
    score += 2;
  }

  const pathText = normalize(link.pathLabels.join(" "));
  if (pathText.includes(needle)) {
    score += 1;
  }

  const personaLabel = link.persona?.label
    ? normalize(link.persona.label)
    : null;
  if (personaLabel && personaLabel.includes(needle)) {
    score += 1;
  }

  const href = normalize(link.href);
  if (href.includes(needle)) {
    score += 1;
  }

  return score;
}

function formatContext(link: FlatLink): string {
  if (!link.pathLabels.length) return "";
  const withoutLabel = link.pathLabels.slice(0, -1);
  if (!withoutLabel.length) return "";
  return withoutLabel.join(" / ");
}

function dedupeLinks(links: FlatLink[]): FlatLink[] {
  const seen = new Map<string, FlatLink>();
  for (const link of links) {
    if (!seen.has(link.href)) {
      seen.set(link.href, link);
    }
  }
  return Array.from(seen.values());
}

async function loadResults(query: string): Promise<Result[]> {
  if (!query.trim()) return [];
  const { tree } = await getMenu();
  const flattened = dedupeLinks(flattenLinks(tree));
  const matches = flattened
    .map<Result | null>((link) => {
      const score = computeScore(link, query);
      if (score <= 0) return null;
      return { link, score };
    })
    .filter((entry): entry is Result => entry !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.link.label.localeCompare(b.link.label);
    });

  return matches.slice(0, MAX_RESULTS);
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const rawQuery = params?.q ?? "";
  const query = rawQuery.trim();
  const results = await loadResults(query);

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
            Type in the navigation drawer search to look up pages and posts.
          </p>
        )}
      </header>
      {query ? (
        results.length ? (
          <ol className="space-y-3">
            {results.map(({ link }) => {
              const context = formatContext(link);
              const personaLabel = link.persona?.label ?? null;
              const isExternal = link.kind === "external";
              const linkContent = (
                <>
                  <span className="text-base font-medium text-[color:var(--text-strong,#0e2240)]">
                    {link.label}
                  </span>
                  <span className="mt-1 text-xs text-[color:var(--text-muted,#58708c)]">
                    {personaLabel ? `${personaLabel} | ` : ""}
                    {link.href}
                  </span>
                  {context ? (
                    <span className="mt-1 text-xs text-[color:var(--text-muted,#58708c)]">
                      {context}
                    </span>
                  ) : null}
                </>
              );

              return (
                <li key={`${link.kind}:${link.id}`}>
                  {isExternal ? (
                    <a
                      href={link.href}
                      className={cn(
                        "flex flex-col rounded-2xl border border-[color:var(--border-subtle,#d1d5db)] bg-white px-4 py-3 transition hover:border-[color:var(--brand-blue,#0077c0)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue,#0077c0)] focus-visible:ring-offset-2",
                      )}
                      rel="noreferrer noopener"
                      target={link.target ?? "_blank"}
                    >
                      {linkContent}
                    </a>
                  ) : (
                    <Link
                      href={link.href as Route}
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
