import { notFound } from "next/navigation";
import RankingDetailPage, {
  formatBoolean,
  formatRankingDate,
  formatRankingNumber,
  formatRankingSigned,
  rankingTrendField,
} from "@/components/tcdb/RankingDetailPage";
import { getTcdbRanking } from "@/lib/data/tcdb";
import { makeDetailGenerateMetadata } from "@/lib/seo/factories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export const generateMetadata = makeDetailGenerateMetadata({
  pathBase: "/cardattack/tcdb-rankings",
  fetcher: async (id: string) => await getTcdbRanking(id),
  resolve: (ranking) => {
    const id = String(ranking.homie_id);
    const title = `${ranking.name}; Jersey ${id}`;
    const description = `TCDB ranking for ${ranking.name}; rank ${ranking.ranking} with ${ranking.card_count} cards as of ${ranking.ranking_at}.`;
    return {
      title,
      description,
      canonicalPath: `/cardattack/tcdb-rankings/${id}`,
      index: true,
    };
  },
});

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const ranking = await getTcdbRanking(id);
  if (!ranking) return notFound();

  return (
    <RankingDetailPage
      current="homies"
      title={ranking.name}
      eyebrow={`Homie ${ranking.homie_id}`}
      listHref="/cardattack/tcdb-rankings/homies"
      listLabel="Homie rankings"
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
          label: "Jersey / Homie ID",
          value: ranking.homie_id,
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
