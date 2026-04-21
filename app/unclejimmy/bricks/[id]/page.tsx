import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BricksDetailPage from "@/components/bricks/BricksDetailPage";
import { getBricksPageData } from "@/lib/bricks-content";
import { getBricksRouteConfig } from "@/lib/bricks-route-config";
import { getBricksDetailMetadata } from "@/lib/bricks-route-metadata";
import { normalizeBricksPublicId } from "@/lib/bricks-types";

type Params = { id: string };

const subset = "lego" as const;
const routeConfig = getBricksRouteConfig(subset);

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getNormalizedPublicId(id: string): string | null {
  try {
    return normalizeBricksPublicId(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const publicId = getNormalizedPublicId(id);

  if (!publicId) {
    return getBricksDetailMetadata(subset, id, null);
  }

  const bricks = await getBricksPageData(subset, publicId);
  return getBricksDetailMetadata(subset, publicId, bricks);
}

export default async function UncleJimmyBricksLegoIdPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const publicId = getNormalizedPublicId(id);

  if (!publicId) {
    notFound();
  }

  const bricks = await getBricksPageData(subset, publicId);

  if (!bricks) {
    notFound();
  }

  return <BricksDetailPage config={routeConfig} bricks={bricks} />;
}
