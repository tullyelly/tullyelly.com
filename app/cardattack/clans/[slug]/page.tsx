import { notFound } from "next/navigation";
import { Card } from "@ui";
import ClanCardCountSparkline from "@/components/tcdb/ClanCardCountSparkline";
import TcdbCardHistorySummary from "@/components/tcdb/TcdbCardHistorySummary";
import RankingDetailPage, {
  formatRankingDate,
  formatRankingNumber,
  formatRankingSigned,
  rankingTrendField,
} from "@/components/tcdb/RankingDetailPage";
import SquadMemberPosts from "@/components/unclejimmy/SquadMemberPosts";
import { getTaggedPosts } from "@/lib/blog";
import type { ChronicleTagDisplayName } from "@/lib/chronicle-person-tags";
import { listChronicleTagDisplayNames } from "@/lib/chronicle-person-tags";
import {
  getTcdbClanRankingsBySlug,
  listClanTcdbSnapshotHistory,
} from "@/lib/data/tcdb-clans";
import { buildMetadata } from "@/lib/seo/builders";
import type { TagMetadata } from "@/lib/tags-server";
import { getStoredTagMetadataForHrefKind } from "@/lib/tags-server";
import { formatClanSportLabel } from "@/lib/tcdb-clan-format";
import {
  getTcdbClanRankingHref,
  TCDB_CLAN_RANKINGS_PATH,
} from "@/lib/tcdb-clan-routes";
import { canonicalFor } from "@/lib/seo/url";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rankings = await getTcdbClanRankingsBySlug(slug);

  if (rankings.length === 0) {
    return buildMetadata({
      title: "Not found",
      description: "The requested clan ranking could not be located.",
      canonical: canonicalFor(getTcdbClanRankingHref({ slug })),
      robots: { index: false, follow: false },
    });
  }

  const ranking = rankings[0];
  const sports = rankings.map((row) => formatClanSportLabel(row.sport));

  return buildMetadata({
    title: `${ranking.name}; ${ranking.slug}`,
    description: `TCDB clan rankings for ${ranking.name}; current sports include ${sports.join(", ")}.`,
    canonical: canonicalFor(getTcdbClanRankingHref(ranking)),
    robots: { index: true, follow: true },
    type: "website",
    twitterCard: "summary",
  });
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function ClanChronicleDisplayNamesSection({
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
          No Chronicle display names found for this clan tag yet.
        </p>
      ) : null}
    </Card>
  );
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const rankings = await getTcdbClanRankingsBySlug(slug);
  if (rankings.length === 0) return notFound();

  const ranking = rankings[0];
  const clanHref = getTcdbClanRankingHref(ranking);
  const tagMetadata = await getStoredTagMetadataForHrefKind({
    slug: ranking.tag_slug,
    href: clanHref,
    hrefKind: "clan",
  });
  const chronicleTagMetadata =
    tagMetadata?.hrefKind === "clan" ? tagMetadata : null;
  const chronicleDisplayNames = chronicleTagMetadata
    ? listChronicleTagDisplayNames(chronicleTagMetadata.slug)
    : [];
  const taggedChronicles = chronicleTagMetadata
    ? getTaggedPosts(chronicleTagMetadata.slug)
    : [];
  const rankSnapshots = await listClanTcdbSnapshotHistory(ranking.clan_id);
  const rankSnapshotsBySport = new Map<string, typeof rankSnapshots>();
  for (const snapshot of rankSnapshots) {
    const snapshotsForSport = rankSnapshotsBySport.get(snapshot.sport) ?? [];
    snapshotsForSport.push(snapshot);
    rankSnapshotsBySport.set(snapshot.sport, snapshotsForSport);
  }

  return (
    <RankingDetailPage
      title={ranking.name}
      eyebrow={`Clan ${ranking.slug}`}
      topHref={TCDB_CLAN_RANKINGS_PATH}
      topLabel="Back to clans"
      summaryLayout="compact"
      fieldGroups={rankings.map((row) => {
        const sportSnapshots = rankSnapshotsBySport.get(row.sport) ?? [];

        return {
          title: formatClanSportLabel(row.sport),
          content:
            sportSnapshots.length > 0 ? (
              <TcdbCardHistorySummary>
                <ClanCardCountSparkline snapshots={sportSnapshots} />
              </TcdbCardHistorySummary>
            ) : null,
          fields: [
            {
              label: "TCDb Rank",
              value: formatRankingNumber(row.ranking),
            },
            {
              label: "Total Cards",
              value: formatRankingNumber(row.card_count),
            },
            {
              label: "Difference",
              value: formatRankingSigned(row.difference),
            },
            {
              label: "Ranking Updated",
              value: formatRankingDate(row.ranking_at),
            },
            {
              label: "Overall Trend",
              value: rankingTrendField(row.trend_overall),
            },
            {
              label: "Rank Trend",
              value: rankingTrendField(row.trend_rank),
            },
          ],
        };
      })}
    >
      {chronicleTagMetadata ? (
        <ClanChronicleDisplayNamesSection
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
