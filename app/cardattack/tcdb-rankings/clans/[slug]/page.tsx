import { notFound } from "next/navigation";
import RankingDetailPage, {
  formatBoolean,
  formatRankingDate,
  formatRankingNumber,
  formatRankingSigned,
  rankingTrendField,
} from "@/components/tcdb/RankingDetailPage";
import { getTcdbClanRanking } from "@/lib/data/tcdb-clans";
import { makeDetailGenerateMetadata } from "@/lib/seo/factories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export const generateMetadata = makeDetailGenerateMetadata({
  pathBase: "/cardattack/tcdb-rankings/clans",
  paramKey: "slug",
  fetcher: async (slug: string) => await getTcdbClanRanking(slug),
  resolve: (ranking) => {
    const title = `${ranking.name}; ${ranking.slug}`;
    const description = `TCDB clan ranking for ${ranking.name}; rank ${ranking.ranking} with ${ranking.card_count} cards as of ${ranking.ranking_at}.`;
    return {
      title,
      description,
      canonicalPath: `/cardattack/tcdb-rankings/clans/${ranking.slug}`,
      index: true,
    };
  },
});

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const ranking = await getTcdbClanRanking(slug);
  if (!ranking) return notFound();

  return (
    <RankingDetailPage
      current="clans"
      title={ranking.name}
      eyebrow={`Clan ${ranking.slug}`}
      listHref="/cardattack/tcdb-rankings/clans"
      listLabel="Clan rankings"
      fields={[
        {
          label: "Current Rank",
          value: formatRankingNumber(ranking.ranking),
        },
        {
          label: "Total Cards",
          value: formatRankingNumber(ranking.card_count),
        },
        {
          label: "Slug",
          value: ranking.slug,
        },
        {
          label: "Difference",
          value: formatRankingSigned(ranking.difference),
        },
        {
          label: "Rank Delta",
          value: formatRankingSigned(ranking.rank_delta),
        },
        {
          label: "Difference Delta",
          value: formatRankingSigned(ranking.diff_delta),
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
        {
          label: "Diff Sign Changed",
          value: formatBoolean(ranking.diff_sign_changed),
        },
      ]}
    />
  );
}
