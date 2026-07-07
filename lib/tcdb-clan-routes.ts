export const TCDB_CLAN_RANKINGS_PATH = "/cardattack/clans";

export type TcdbClanRankingRouteFields = {
  slug: string;
};

export function getTcdbClanRankingHref(
  row: TcdbClanRankingRouteFields,
): string {
  return `${TCDB_CLAN_RANKINGS_PATH}/${encodeURIComponent(row.slug)}`;
}
