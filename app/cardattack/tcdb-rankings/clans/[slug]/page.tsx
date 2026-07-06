import { notFound } from "next/navigation";
import RankingDetailPage, {
  formatBoolean,
  formatRankingDate,
  formatRankingNumber,
  formatRankingSigned,
  rankingTrendField,
} from "@/components/tcdb/RankingDetailPage";
import { getTcdbClanRankingsBySlug } from "@/lib/data/tcdb-clans";
import { buildMetadata } from "@/lib/seo/builders";
import { formatClanSportLabel } from "@/lib/tcdb-clan-format";
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
      canonical: canonicalFor(`/cardattack/tcdb-rankings/clans/${slug}`),
      robots: { index: false, follow: false },
    });
  }

  const ranking = rankings[0];
  const sports = rankings.map((row) => formatClanSportLabel(row.sport));

  return buildMetadata({
    title: `${ranking.name}; ${ranking.slug}`,
    description: `TCDB clan rankings for ${ranking.name}; current sports include ${sports.join(", ")}.`,
    canonical: canonicalFor(`/cardattack/tcdb-rankings/clans/${ranking.slug}`),
    robots: { index: true, follow: true },
    type: "website",
    twitterCard: "summary",
  });
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const rankings = await getTcdbClanRankingsBySlug(slug);
  if (rankings.length === 0) return notFound();

  const ranking = rankings[0];

  return (
    <RankingDetailPage
      title={ranking.name}
      eyebrow={`Clan ${ranking.slug}`}
      listHref="/cardattack/tcdb-rankings/clans"
      listLabel="Clan rankings"
      topHref="/cardattack/tcdb-rankings/clans"
      topLabel="Back to clans"
      fieldGroups={rankings.map((row) => ({
        title: formatClanSportLabel(row.sport),
        fields: [
          {
            label: "Sport",
            value: formatClanSportLabel(row.sport),
          },
          {
            label: "Current Rank",
            value: formatRankingNumber(row.ranking),
          },
          {
            label: "Total Cards",
            value: formatRankingNumber(row.card_count),
          },
          {
            label: "Slug",
            value: row.slug,
          },
          {
            label: "Difference",
            value: formatRankingSigned(row.difference),
          },
          {
            label: "Rank Delta",
            value: formatRankingSigned(row.rank_delta),
          },
          {
            label: "Difference Delta",
            value: formatRankingSigned(row.diff_delta),
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
          {
            label: "Diff Sign Changed",
            value: formatBoolean(row.diff_sign_changed),
          },
        ],
      }))}
    />
  );
}
