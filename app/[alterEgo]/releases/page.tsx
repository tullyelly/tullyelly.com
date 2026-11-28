import FullBleedPage from "@/components/layout/FullBleedPage";
import PageIntro from "@/components/layout/PageIntro";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PersonaReleaseLogEntry } from "@/components/chronicles/PersonaReleaseLog";
import { ReleaseLogPagination } from "@/components/chronicles/ReleaseLogPagination";
import {
  getAlterEgoReleaseEntries,
  filterReleaseEntries,
  getReleasePageDateRange,
  normalizeReleasePage,
  normalizeReleaseOrder,
  orderReleaseEntries,
  paginateReleaseEntries,
} from "@/lib/alter-ego-release-content";
import {
  getPersonaReleaseFeed,
  getPersonaReleaseLogHref,
  type PersonaReleaseFeed,
} from "@/lib/persona-release-feeds";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import {
  SHARED_OPEN_GRAPH_FIELDS,
  SHARED_TWITTER_FIELDS,
} from "@/lib/seo/constants";
import { getTagMetadataBatch } from "@/lib/tags-server";

type Params = { alterEgo: string };
type SearchParams = { page?: string | string[] };
type ReleaseSearchParams = SearchParams & {
  order?: string | string[];
  q?: string | string[];
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { alterEgo } = await params;
  const config = getPersonaReleaseFeed(alterEgo);
  if (!config) return {};
  const title = `${config.displayName} release log | tullyelly`;
  const url = canonicalUrl(`${alterEgo}/releases`);
  return {
    title,
    description: config.description,
    alternates: { canonical: url },
    openGraph: {
      ...SHARED_OPEN_GRAPH_FIELDS,
      title,
      description: config.description,
      url,
      type: "website",
    },
    twitter: {
      ...SHARED_TWITTER_FIELDS,
      title,
      description: config.description,
    },
  };
}

async function releaseTagMetadata(tags: readonly string[]) {
  if (tags.length === 0) return new Map();
  try {
    return await getTagMetadataBatch(tags);
  } catch (error) {
    console.warn("[persona releases] Failed to resolve tag metadata", error);
    return new Map();
  }
}

export default async function PersonaReleasesPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams?: Promise<ReleaseSearchParams>;
}) {
  const { alterEgo } = await params;
  const config = getPersonaReleaseFeed(alterEgo);
  if (!config) notFound();
  const resolvedSearchParams = await searchParams;
  const q =
    typeof resolvedSearchParams?.q === "string"
      ? resolvedSearchParams.q.trim()
      : "";
  const requested = normalizeReleasePage(resolvedSearchParams?.page);
  const order = normalizeReleaseOrder(resolvedSearchParams?.order);
  const orderedEntries = orderReleaseEntries(
    filterReleaseEntries(
      getAlterEgoReleaseEntries(alterEgo as PersonaReleaseFeed),
      q,
    ),
    order,
  );
  const result = paginateReleaseEntries(orderedEntries, requested);
  if (result.outOfRange) notFound();
  const dateRange = getReleasePageDateRange(result.entries);
  const tags = Array.from(
    new Set(result.entries.flatMap((entry) => entry.postTags)),
  );
  const tagMetadataBySlug = await releaseTagMetadata(tags);

  return (
    <FullBleedPage>
      <div className="space-y-10">
        <header className="space-y-3 px-2 md:px-0">
          <Link href={config.baseRoute} className="link-blue">
            ← back to {config.displayName}
          </Link>
          <PageIntro
            eyebrow="Release log"
            title={`${config.displayName} release log`}
            description={config.description}
          />
          <p className="text-sm text-muted-foreground">
            {result.total} {result.total === 1 ? "release" : "releases"} · Page{" "}
            {result.page} of {result.pageCount}
          </p>
          <form
            role="search"
            method="get"
            action={`/${alterEgo}/releases`}
            className="flex flex-wrap gap-2"
          >
            <input
              type="search"
              name="q"
              aria-label="Search releases"
              defaultValue={q}
              placeholder="Search titles, tags and release text"
              className="form-input min-w-0 flex-1"
            />
            {order === "oldest" ? (
              <input type="hidden" name="order" value="oldest" />
            ) : null}
            <button className="btn" type="submit">
              Search
            </button>
            {q ? (
              <Link
                className="btn"
                href={getPersonaReleaseLogHref(
                  alterEgo as PersonaReleaseFeed,
                  1,
                  order,
                )}
              >
                Clear search
              </Link>
            ) : null}
          </form>
          <div
            className="flex flex-wrap items-center gap-2"
            aria-label="Release order"
          >
            <span className="text-sm text-muted-foreground">Order:</span>
            <Link
              href={getPersonaReleaseLogHref(
                alterEgo as PersonaReleaseFeed,
                1,
                "newest",
                q,
              )}
              aria-current={order === "newest" ? "page" : undefined}
              className={
                order === "newest" ? "font-semibold text-ink" : "link-blue"
              }
            >
              newest first
            </Link>
            <span aria-hidden="true" className="text-muted-foreground">
              ·
            </span>
            <Link
              href={getPersonaReleaseLogHref(
                alterEgo as PersonaReleaseFeed,
                1,
                "oldest",
                q,
              )}
              aria-current={order === "oldest" ? "page" : undefined}
              className={
                order === "oldest" ? "font-semibold text-ink" : "link-blue"
              }
            >
              chronological
            </Link>
          </div>
        </header>

        <ReleaseLogPagination
          q={q}
          persona={alterEgo as PersonaReleaseFeed}
          order={order}
          page={result.page}
          pageCount={result.pageCount}
          dateRange={dateRange}
          position="top"
        />

        {result.entries.length === 0 ? (
          <p className="px-2 text-muted-foreground md:px-0">
            {q
              ? "No releases match this search. Try another term or clear your search."
              : "No releases have landed here yet."}
          </p>
        ) : (
          <div className="space-y-12">
            {result.entries.map((entry) => (
              <PersonaReleaseLogEntry
                key={`${entry.postSlug}-${entry.sectionOrdinal}`}
                directoryReturn={getPersonaReleaseLogHref(
                  alterEgo as PersonaReleaseFeed,
                  result.page,
                  order,
                  q,
                )}
                entry={entry}
                tagMetadataBySlug={tagMetadataBySlug}
              />
            ))}
          </div>
        )}

        <ReleaseLogPagination
          q={q}
          persona={alterEgo as PersonaReleaseFeed}
          order={order}
          page={result.page}
          pageCount={result.pageCount}
          dateRange={dateRange}
          position="bottom"
        />
      </div>
    </FullBleedPage>
  );
}
