import type { Metadata } from "next";
import { allPosts } from "contentlayer/generated";
import { notFound } from "next/navigation";
import ChronicleListClient, {
  type ChronicleListRow,
} from "@/app/shaolin/_components/ChronicleListClient";
import { TagCommentsSection } from "@/components/chronicles/TagCommentsSection";
import DataPageShell from "@/components/layout/DataPageShell";
import PageIntro from "@/components/layout/PageIntro";
import SectionHeader from "@/components/layout/SectionHeader";
import type { AlterEgo } from "@/lib/alterEgo";
import { getPublishedPosts } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo/builders";
import { canonicalFor } from "@/lib/seo/url";
import { getKnownTagDisplayName, normalizeTagSlug } from "@/lib/tags";
import { getTagMetadataBatch } from "@/lib/tags-server";

type Params = { tag: string };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateStaticParams() {
  const tags = new Set<string>();
  for (const post of allPosts) {
    if (post.draft) continue;
    for (const tag of post.tags ?? []) tags.add(normalizeTagSlug(tag));
  }
  return Array.from(tags).map((tag) => ({ tag }));
}

async function getTagDisplayNames(tags: readonly string[]) {
  try {
    const metadata = await getTagMetadataBatch(tags);
    return Object.fromEntries(
      Array.from(metadata, ([slug, value]) => [slug, value.displayName]),
    );
  } catch (error) {
    console.warn("[chronicle-tags] Failed to resolve tag metadata", error);
    return {};
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tag: rawTag } = await params;
  const tag = normalizeTagSlug(rawTag);
  const displayNames = await getTagDisplayNames([tag]);
  const displayName = displayNames[tag] ?? getKnownTagDisplayName(tag);
  return buildMetadata({
    title: `#${displayName} Chronicles | tullyelly`,
    description: `Browse published Shaolin Chronicles tagged ${displayName}.`,
    canonical: canonicalFor(`/shaolin/tags/${encodeURIComponent(tag)}`),
    type: "website",
    twitterCard: "summary_large_image",
  });
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { tag: rawTag } = await params;
  const tag = normalizeTagSlug(rawTag);
  const posts = getPublishedPosts().filter((post) =>
    (post.tags ?? []).some((value) => normalizeTagSlug(value) === tag),
  );
  if (posts.length === 0) notFound();

  const rows: ChronicleListRow[] = posts.map((post) => ({
    slug: post.slug,
    url: post.url,
    title: post.title,
    summary: post.summary,
    date: post.date,
    alterEgo: post.resolvedAlterEgo as AlterEgo,
    tags: Array.from(new Set((post.tags ?? []).map(normalizeTagSlug))),
    infinityStone: post.infinityStone,
  }));
  const tags = Array.from(new Set(rows.flatMap((row) => row.tags)));
  const tagDisplayNames = await getTagDisplayNames(tags);
  const displayName = tagDisplayNames[tag] ?? getKnownTagDisplayName(tag);
  const alterEgos = Array.from(new Set(rows.map((row) => row.alterEgo))).sort(
    (a, b) => a.localeCompare(b),
  );

  return (
    <DataPageShell>
      <PageIntro
        title={`#${displayName}`}
        description={`Published Shaolin Chronicles that carry the ${displayName} tag.`}
      />
      <section className="space-y-4" aria-labelledby="tag-chronicles-heading">
        <SectionHeader
          id="tag-chronicles-heading"
          title="Chronicles"
          description={`${rows.length} chronicle${rows.length === 1 ? "" : "s"} in this tag archive.`}
        />
        <ChronicleListClient
          rows={rows}
          alterEgos={alterEgos}
          tagDisplayNames={tagDisplayNames}
          archiveLabel={`${displayName} Chronicle archive`}
          controlsLabel={`${displayName} Chronicle controls`}
        />
      </section>
      <TagCommentsSection tag={tag} />
    </DataPageShell>
  );
}
