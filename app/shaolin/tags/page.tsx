import type { Metadata } from "next";
import DataPageShell from "@/components/layout/DataPageShell";
import PageIntro from "@/components/layout/PageIntro";
import SectionHeader from "@/components/layout/SectionHeader";
import { getPublishedPosts, getTagsWithCounts } from "@/lib/blog";
import { listChroniclePersonTagDisplayNames } from "@/lib/chronicle-person-tags";
import { buildMetadata } from "@/lib/seo/builders";
import { canonicalFor } from "@/lib/seo/url";
import { getKnownTagDisplayName, normalizeTagSlug } from "@/lib/tags";
import { getTagMetadataBatch } from "@/lib/tags-server";
import type { TagHrefKind, TagMetadata } from "@/lib/tags-server";
import TagDirectoryClient, {
  type TagDirectoryRow,
} from "./_components/TagDirectoryClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Chronicle tags | tullyelly",
    description:
      "Search and browse tags from the published Shaolin Chronicles.",
    canonical: canonicalFor("/shaolin/tags"),
    type: "website",
    twitterCard: "summary_large_image",
  });
}

async function getDisplayNames(tags: readonly string[]) {
  try {
    return await getTagMetadataBatch(tags);
  } catch (error) {
    console.warn("[chronicle-tags] Failed to resolve tag metadata", error);
    return new Map();
  }
}

const ALIAS_LABELS: Partial<Record<TagHrefKind, string>> = {
  persona: "Alter ego page",
  squad: "Squad page",
  homie: "Homie page",
  clan: "Clan page",
  custom: "Related page",
  external: "External page",
};

function getTagAlias(metadata: TagMetadata | undefined, archiveHref: string) {
  if (
    !metadata?.isClickable ||
    !metadata.href ||
    metadata.href === archiveHref ||
    metadata.hrefKind === "tag" ||
    metadata.hrefKind === "none"
  ) {
    return null;
  }

  const label = metadata.href.startsWith("/unclejimmy/fam/")
    ? "Fam page"
    : metadata.href.startsWith("/unclejimmy/squads/")
      ? "Squad page"
      : (ALIAS_LABELS[metadata.hrefKind] ?? "Related page");

  return {
    href: metadata.href,
    label,
    external: metadata.hrefKind === "external",
  };
}

export default async function Page() {
  const counts = getTagsWithCounts(getPublishedPosts());
  const normalizedCounts = Object.entries(counts).reduce<
    Record<string, number>
  >((result, [tag, count]) => {
    const slug = normalizeTagSlug(tag);
    result[slug] = (result[slug] ?? 0) + count;
    return result;
  }, {});
  const tags = Object.keys(normalizedCounts);
  const metadataBySlug = await getDisplayNames(tags);
  const rows: TagDirectoryRow[] = tags.map((slug) => {
    const metadata = metadataBySlug.get(slug);
    const archiveHref = `/shaolin/tags/${encodeURIComponent(slug)}`;
    const personTagNames = listChroniclePersonTagDisplayNames(slug);
    return {
      slug,
      canonicalDisplayName:
        metadata?.displayName ?? getKnownTagDisplayName(slug),
      chronicleCount: normalizedCounts[slug] ?? 0,
      alias: getTagAlias(metadata, archiveHref),
      personTagNames: personTagNames
        .slice(0, 5)
        .map(({ displayName, count }) => ({
          displayName,
          count,
        })),
      remainingPersonTagNameCount: Math.max(0, personTagNames.length - 5),
    };
  });

  return (
    <DataPageShell>
      <PageIntro
        title="Chronicle tags"
        description="Browse the labels used across the published Shaolin Chronicles."
      />
      <section className="space-y-4" aria-labelledby="tag-directory-heading">
        <SectionHeader
          id="tag-directory-heading"
          title="Tag directory"
          description="Search by tag name, then sort by usage or alphabetically."
        />
        <TagDirectoryClient rows={rows} />
      </section>
    </DataPageShell>
  );
}
