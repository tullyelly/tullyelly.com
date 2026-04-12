import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BricksDetailPage from "@/components/bricks/BricksDetailPage";
import { getBricksPageData } from "@/lib/bricks-content";
import { getBricksRouteConfig } from "@/lib/bricks-route-config";
import { getBricksDetailMetadata } from "@/lib/bricks-route-metadata";

type Params = { id: string };

const subset = "lego" as const;
const routeConfig = getBricksRouteConfig(subset);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const bricks = await getBricksPageData(subset, id);
  return getBricksDetailMetadata(subset, id, bricks);
}

export default async function UncleJimmyBricksLegoIdPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const bricks = await getBricksPageData(subset, id);

  if (!bricks) {
    notFound();
  }

  return <BricksDetailPage config={routeConfig} bricks={bricks} />;
}
