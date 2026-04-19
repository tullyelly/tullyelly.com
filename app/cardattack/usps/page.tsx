import UspsLandingPage from "@/components/usps/UspsLandingPage";
import { listUspsSummaries } from "@/lib/usps-content";
import { getUspsRouteConfig } from "@/lib/usps-route-config";
import { getUspsCollectionMetadata } from "@/lib/usps-route-metadata";

const routeConfig = getUspsRouteConfig();

export const metadata = getUspsCollectionMetadata();
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CardattackUspsLandingPage() {
  const rows = await listUspsSummaries();
  return <UspsLandingPage config={routeConfig} rows={rows} />;
}
