import type { Metadata, Route } from "next";
import Link from "next/link";
import DataPageShell from "@/components/layout/DataPageShell";
import PageIntro from "@/components/layout/PageIntro";
import SectionHeader from "@/components/layout/SectionHeader";
import { Stat, StatGrid } from "@/components/ui/StatGrid";
import { ALTER_EGO_OPTIONS, type AlterEgo } from "@/lib/alterEgo";
import { getPublishedPosts } from "@/lib/blog";
import { fmtDate } from "@/lib/datetime";
import { buildMetadata } from "@/lib/seo/builders";
import { canonicalFor } from "@/lib/seo/url";
import { normalizeTagSlug } from "@/lib/tags";
import ChronicleListClient, {
  type ChronicleListRow,
} from "./_components/ChronicleListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Shaolin Chronicles | tullyelly",
    description:
      "Search and explore the Shaolin Chronicles archive by alter ego and tag.",
    canonical: canonicalFor("/shaolin"),
    type: "website",
    twitterCard: "summary",
  });
}

function isAlterEgo(value: string | undefined): value is AlterEgo {
  return ALTER_EGO_OPTIONS.some((alterEgo) => alterEgo === value);
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ alterEgo?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const requestedAlterEgo = params?.alterEgo?.trim().toLowerCase();
  const initialAlterEgo = isAlterEgo(requestedAlterEgo)
    ? requestedAlterEgo
    : "";
  const posts = getPublishedPosts();
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
  const tags = Array.from(new Set(rows.flatMap((row) => row.tags))).sort(
    (a, b) => a.localeCompare(b),
  );
  const infinityStoneCount = rows.filter((row) => row.infinityStone).length;
  const latestChronicle = rows[0];

  return (
    <DataPageShell>
      <PageIntro
        title="Shaolin Chronicles"
        description={
          <>
            The running record of whatever I&apos;m building, collecting,
            fixing, breaking, watching, thinking about, or otherwise getting
            myself into.
          </>
        }
      />

      <section aria-label="Chronicle metrics">
        <StatGrid columns={4}>
          <Stat
            label="Latest"
            value={
              latestChronicle ? (
                <Link href={latestChronicle.url as Route} className="link-blue">
                  <time dateTime={latestChronicle.date}>
                    {fmtDate(latestChronicle.date)}
                  </time>
                </Link>
              ) : (
                "Not available"
              )
            }
          />
          <Stat label="Chronicles" value={String(rows.length)} />
          <Stat
            label="Tags"
            value={
              <>
                {tags.length}{" "}
                <Link href="/shaolin/tags" className="link-blue text-sm">
                  (view all)
                </Link>
              </>
            }
          />
          <Stat label="Infinity Stones" value={String(infinityStoneCount)} />
        </StatGrid>
      </section>

      <section className="space-y-4" aria-labelledby="chronicles-heading">
        <SectionHeader
          id="chronicles-heading"
          title="Chronicles"
          description="Search the whole archive or narrow things down by alter ego and tag."
        />

        <ChronicleListClient
          rows={rows}
          alterEgos={ALTER_EGO_OPTIONS}
          initialAlterEgo={initialAlterEgo}
        />
      </section>
    </DataPageShell>
  );
}
