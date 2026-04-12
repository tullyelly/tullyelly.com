import BricksLandingPage from "@/components/bricks/BricksLandingPage";
import { listBricksSummaries } from "@/lib/bricks-content";
import { getBricksRouteConfig } from "@/lib/bricks-route-config";
import { getBricksCollectionMetadata } from "@/lib/bricks-route-metadata";

const subset = "lego" as const;
const routeConfig = getBricksRouteConfig(subset);

export const metadata = getBricksCollectionMetadata(subset);
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UncleJimmyBricksLegoPage() {
  const rows = await listBricksSummaries(subset);
  return <BricksLandingPage config={routeConfig} rows={rows} />;
}
