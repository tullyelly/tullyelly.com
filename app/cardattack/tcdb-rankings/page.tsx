import { unstable_cache } from "next/cache";
import RankingLandingPage, {
  type RankingLandingSummary,
} from "./_components/RankingLandingPage";
import {
  listNumberOneTcdbHomieRankings,
  listRecentTcdbHomieFallers,
  listRecentTcdbHomieRisers,
  listTopTcdbHomieRankings,
} from "@/lib/data/tcdb";
import {
  listNumberOneTcdbClanRankings,
  listRecentTcdbClanFallers,
  listRecentTcdbClanRisers,
  listTopTcdbClanRankings,
} from "@/lib/data/tcdb-clans";
import { buildMetadata } from "@/lib/seo/builders";
import { canonicalFor } from "@/lib/seo/url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = buildMetadata({
  title: "cardattack; TCDb rankings",
  description:
    "Cardattack TCDb rankings for homies and clans; current leaders, top collectors, risers, and fallers.",
  canonical: canonicalFor("/cardattack/tcdb-rankings"),
  type: "website",
  twitterCard: "summary",
});

const readLandingSummary = unstable_cache(
  async (): Promise<RankingLandingSummary> => {
    const [
      numberOneHomies,
      numberOneClans,
      topHomies,
      topClans,
      homieRisers,
      homieFallers,
      clanRisers,
      clanFallers,
    ] = await Promise.all([
      listNumberOneTcdbHomieRankings(),
      listNumberOneTcdbClanRankings(),
      listTopTcdbHomieRankings(5),
      listTopTcdbClanRankings(5),
      listRecentTcdbHomieRisers(5),
      listRecentTcdbHomieFallers(5),
      listRecentTcdbClanRisers(5),
      listRecentTcdbClanFallers(5),
    ]);

    return {
      numberOneHomies,
      numberOneClans,
      topHomies,
      topClans,
      homieRisers,
      homieFallers,
      clanRisers,
      clanFallers,
    };
  },
  ["tcdb-rankings-landing"],
  {
    revalidate: 300,
    tags: ["tcdb-rankings", "tcdb-rankings-homies", "tcdb-rankings-clans"],
  },
);

export default async function Page() {
  const summary = await readLandingSummary();
  return <RankingLandingPage summary={summary} />;
}
