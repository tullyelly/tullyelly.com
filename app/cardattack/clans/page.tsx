import { makeListGenerateMetadata } from "@/lib/seo/factories";
import { TCDB_CLAN_RANKINGS_PATH } from "@/lib/tcdb-clan-routes";
import {
  renderTcdbClanRankingsPage,
  type ClanSearchParams,
} from "./renderTcdbClanRankingsPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const generateMetadata = makeListGenerateMetadata({
  path: TCDB_CLAN_RANKINGS_PATH,
  getTitle: (q, page) => {
    const base = "cardattack; clans";
    const withQuery = q ? `${base}; search: "${q}"` : base;
    return page && page !== "1" ? `${withQuery}; page ${page}` : withQuery;
  },
  getDescription: (q, page) => {
    const base = q
      ? `Cardattack clans filtered by "${q}"; review clan snapshots and handmade trends`
      : "Cardattack clans; review clan snapshots and handmade trends";
    return page && page !== "1" ? `${base} (page ${page}).` : `${base}.`;
  },
});

type PageProps = {
  searchParams: Promise<ClanSearchParams | undefined>;
};

export default async function Page({ searchParams }: PageProps) {
  return renderTcdbClanRankingsPage(searchParams);
}
