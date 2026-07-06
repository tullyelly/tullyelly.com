import { notFound } from "next/navigation";
import { Card } from "@ui";
import HomieCardCountSparkline from "@/components/tcdb/HomieCardCountSparkline";
import RankingDetailPage, {
  formatRankingDate,
  formatRankingNumber,
  formatRankingSigned,
  rankingTrendField,
} from "@/components/tcdb/RankingDetailPage";
import SquadMemberPosts from "@/components/unclejimmy/SquadMemberPosts";
import { getTaggedPosts } from "@/lib/blog";
import {
  getHomieTcdbRankingByRouteKey,
  listHomieTcdbSnapshotHistory,
} from "@/lib/data/tcdb";
import type { ChronicleTagDisplayName } from "@/lib/chronicle-person-tags";
import { listChronicleTagDisplayNames } from "@/lib/chronicle-person-tags";
import type { TagMetadata } from "@/lib/tags-server";
import { getStoredTagMetadataForHrefKind } from "@/lib/tags-server";
import { getHomieTcdbRankingHref } from "@/lib/tcdb-homie-routes";
import { makeDetailGenerateMetadata } from "@/lib/seo/factories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export const generateMetadata = makeDetailGenerateMetadata({
  pathBase: "/cardattack/homies",
  paramKey: "tagSlugOrId",
  fetcher: async (tagSlugOrId: string) =>
    await getHomieTcdbRankingByRouteKey(tagSlugOrId),
  resolve: (ranking) => {
    const title = `${ranking.name}; Jersey ${ranking.homie_id}`;
    const description = `TCDB ranking for ${ranking.name}; rank ${ranking.ranking} with ${ranking.card_count} cards as of ${ranking.ranking_at}.`;
    return {
      title,
      description,
      canonicalPath: getHomieTcdbRankingHref(ranking),
      index: true,
    };
  },
});

type PageProps = {
  params: Promise<{ tagSlugOrId: string }>;
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function HomieChronicleDisplayNamesSection({
  tagMetadata,
  displayNames,
}: {
  tagMetadata: TagMetadata;
  displayNames: ChronicleTagDisplayName[];
}) {
  const totalTagUses = displayNames.reduce(
    (total, variant) => total + variant.count,
    0,
  );

  return (
    <Card
      as="section"
      className="border-[color:var(--trade-border)] bg-[color:var(--trade-off-white)]"
    >
      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold uppercase leading-tight text-[color:var(--trade-rust-deep)] opacity-80 md:text-[0.72rem]">
          chronicle display names for {tagMetadata.displayName.toLowerCase()}
        </p>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <li className="min-w-0 rounded-xl border border-[color:var(--trade-border)] bg-white px-3.5 py-3">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[0.68rem] font-semibold uppercase leading-tight text-[color:var(--trade-rust-deep)] opacity-80 md:text-[0.72rem]">
                Default tag
              </div>
              <div className="mt-1 truncate text-sm font-semibold leading-none text-[color:var(--trade-blue)]">
                #{tagMetadata.slug}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[0.68rem] font-semibold uppercase leading-tight text-[color:var(--trade-rust-deep)] opacity-80 md:text-[0.72rem]">
                Total uses
              </div>
              <div className="mt-1 text-sm font-semibold leading-none text-[color:var(--trade-charcoal)]">
                {pluralize(totalTagUses, "mention")}
              </div>
            </div>
          </div>
        </li>
        {displayNames.map((variant) => (
          <li
            key={variant.displayName}
            className="min-w-0 rounded-xl border border-[color:var(--trade-border)] bg-white px-3.5 py-3"
          >
            <div className="truncate text-sm font-semibold text-[color:var(--trade-charcoal)]">
              {variant.displayName}
            </div>
            <div className="mt-1 text-xs font-medium leading-snug text-[color:var(--trade-muted)]">
              {pluralize(variant.count, "mention")} across{" "}
              {pluralize(variant.chronicleCount, "chronicle")}
            </div>
          </li>
        ))}
      </ul>

      {displayNames.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-[color:var(--trade-muted)]">
          No Chronicle display names found for this homie tag yet.
        </p>
      ) : null}
    </Card>
  );
}

export default async function Page({ params }: PageProps) {
  const { tagSlugOrId } = await params;
  const ranking = await getHomieTcdbRankingByRouteKey(tagSlugOrId);
  if (!ranking) return notFound();

  const homieHref = getHomieTcdbRankingHref(ranking);
  const tagMetadata = await getStoredTagMetadataForHrefKind({
    slug: ranking.tag_slug,
    href: homieHref,
    hrefKind: "homie",
  });
  const chronicleTagMetadata =
    tagMetadata?.hrefKind === "homie" ? tagMetadata : null;
  const chronicleDisplayNames = chronicleTagMetadata
    ? listChronicleTagDisplayNames(chronicleTagMetadata.slug)
    : [];
  const taggedChronicles = chronicleTagMetadata
    ? getTaggedPosts(chronicleTagMetadata.slug)
    : [];
  const rankSnapshots = await listHomieTcdbSnapshotHistory(ranking.homie_id);

  return (
    <RankingDetailPage
      title={ranking.name}
      eyebrow={`Jersey ${ranking.homie_id}`}
      summaryLayout="compact"
      summaryContent={<HomieCardCountSparkline snapshots={rankSnapshots} />}
      fields={[
        {
          label: "TCDb Rank",
          value: formatRankingNumber(ranking.ranking),
        },
        {
          label: "Total Cards",
          value: formatRankingNumber(ranking.card_count),
        },
        {
          label: "Difference",
          value: formatRankingSigned(ranking.difference),
        },
        {
          label: "Ranking Updated",
          value: formatRankingDate(ranking.ranking_at),
        },
        {
          label: "Overall Trend",
          value: rankingTrendField(ranking.trend_overall),
        },
        {
          label: "Rank Trend",
          value: rankingTrendField(ranking.trend_rank),
        },
      ]}
    >
      {chronicleTagMetadata ? (
        <HomieChronicleDisplayNamesSection
          tagMetadata={chronicleTagMetadata}
          displayNames={chronicleDisplayNames}
        />
      ) : null}
      {chronicleTagMetadata ? (
        <SquadMemberPosts
          tag={chronicleTagMetadata.slug}
          posts={taggedChronicles}
        />
      ) : null}
    </RankingDetailPage>
  );
}
