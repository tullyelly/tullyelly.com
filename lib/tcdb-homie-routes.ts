export type HomieTcdbRankingRouteFields = {
  homie_id: number | string;
  tag_slug?: string | null;
  route_slug?: string | null;
};

export function getHomieTcdbRankingRouteKey(
  row: HomieTcdbRankingRouteFields,
): string {
  const routeSlug = row.route_slug?.trim();
  if (routeSlug) return routeSlug;

  const tagSlug = row.tag_slug?.trim();
  return tagSlug || String(row.homie_id);
}

export function getHomieTcdbRankingHref(
  row: HomieTcdbRankingRouteFields,
): string {
  return `/cardattack/homies/${encodeURIComponent(getHomieTcdbRankingRouteKey(row))}`;
}
