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
      ? `CardAttack clan collections filtered by "${q}"; review current cards, TCDb rankings, and collection growth`
      : "CardAttack clan collections; review current cards, TCDb rankings, and collection growth";
    return page && page !== "1" ? `${base} (page ${page}).` : `${base}.`;
  },
});

type PageProps = {
  searchParams: Promise<ClanSearchParams | undefined>;
};

export default async function Page({ searchParams }: PageProps) {
  return renderTcdbClanRankingsPage(searchParams);
}
