import LcsLandingPage from "@/components/lcs/LcsLandingPage";
import { listLcsSummaries } from "@/lib/lcs-content";
import { getLcsRouteConfig } from "@/lib/lcs-route-config";
import { getLcsCollectionMetadata } from "@/lib/lcs-route-metadata";

const routeConfig = getLcsRouteConfig();

export const metadata = getLcsCollectionMetadata();
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CardattackLcsLandingPage() {
  const rows = await listLcsSummaries();
  return <LcsLandingPage config={routeConfig} rows={rows} />;
}
