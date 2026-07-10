import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PersonaReleaseLogEntry } from "@/components/chronicles/PersonaReleaseLog";
import {
  getAlterEgoReleaseEntries,
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
import { getTagMetadataBatch } from "@/lib/tags-server";

type Params = { alterEgo: string };
type SearchParams = { page?: string | string[] };
type ReleaseSearchParams = SearchParams & { order?: string | string[] };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { alterEgo } = await params;
  const config = getPersonaReleaseFeed(alterEgo);
  if (!config) return {};
  const title = `${config.displayName} release log | tullyelly`;
  const url = canonicalUrl(`${alterEgo}/releases`);
  return {
    title,
    description: config.description,
    alternates: { canonical: url },
    openGraph: { title, description: config.description, url, type: "website" },
    twitter: { card: "summary", title, description: config.description },
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
  const requested = normalizeReleasePage(resolvedSearchParams?.page);
  const order = normalizeReleaseOrder(resolvedSearchParams?.order);
  const orderedEntries = orderReleaseEntries(
    getAlterEgoReleaseEntries(alterEgo as PersonaReleaseFeed),
    order,
  );
  const result = paginateReleaseEntries(orderedEntries, requested);
  if (result.outOfRange) notFound();
  const tags = Array.from(new Set(result.entries.flatMap((entry) => entry.postTags)));
  const tagMetadataBySlug = await releaseTagMetadata(tags);

  return (
    <div className="-mx-2 md:mx-0">
      <main className="w-full max-w-none space-y-10 pt-12 md:mx-auto md:max-w-3xl md:pt-14">
        <header className="space-y-3 px-2 md:px-0">
          <Link href={config.baseRoute} className="link-blue">← back to {config.displayName}</Link>
          <h1 className="text-2xl font-semibold leading-snug md:text-3xl">{config.displayName} release log</h1>
          <p className="text-muted-foreground">{config.description}</p>
          <p className="text-sm text-muted-foreground">{result.total} {result.total === 1 ? "release" : "releases"} · Page {result.page} of {result.pageCount}</p>
          <div className="flex flex-wrap items-center gap-2" aria-label="Release order">
            <span className="text-sm text-muted-foreground">Order:</span>
            <Link
              href={getPersonaReleaseLogHref(alterEgo as PersonaReleaseFeed)}
              aria-current={order === "newest" ? "page" : undefined}
              className={order === "newest" ? "font-semibold text-ink" : "link-blue"}
            >
              newest first
            </Link>
            <span aria-hidden="true" className="text-muted-foreground">·</span>
            <Link
              href={getPersonaReleaseLogHref(alterEgo as PersonaReleaseFeed, 1, "oldest")}
              aria-current={order === "oldest" ? "page" : undefined}
              className={order === "oldest" ? "font-semibold text-ink" : "link-blue"}
            >
              chronological
            </Link>
          </div>
        </header>

        {result.entries.length === 0 ? (
          <p className="px-2 text-muted-foreground md:px-0">No releases have landed here yet.</p>
        ) : (
          <div className="space-y-12">
            {result.entries.map((entry) => (
              <PersonaReleaseLogEntry key={`${entry.postSlug}-${entry.sectionOrdinal}`} entry={entry} tagMetadataBySlug={tagMetadataBySlug} />
            ))}
          </div>
        )}

        <nav aria-label="Release log pagination" className="flex items-center justify-between border-t border-border pt-6">
          {result.page > 1 ? <Link className="link-blue" href={getPersonaReleaseLogHref(alterEgo as PersonaReleaseFeed, result.page - 1, order)}>← Previous</Link> : <span />}
          <span className="text-sm text-muted-foreground">Page {result.page} of {result.pageCount}</span>
          {result.page < result.pageCount ? <Link className="link-blue" href={getPersonaReleaseLogHref(alterEgo as PersonaReleaseFeed, result.page + 1, order)}>Next →</Link> : <span />}
        </nav>
      </main>
    </div>
  );
}
