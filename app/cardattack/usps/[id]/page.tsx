import type { Metadata } from "next";
import { notFound } from "next/navigation";

import UspsDetailPage from "@/components/usps/UspsDetailPage";
import { getUspsPageData } from "@/lib/usps-content";
import { normalizeUspsCitySlug } from "@/lib/usps-db";
import { getUspsRouteConfig } from "@/lib/usps-route-config";
import { getUspsDetailMetadata } from "@/lib/usps-route-metadata";

type Params = { id: string };

const routeConfig = getUspsRouteConfig();

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getNormalizedCitySlug(id: string): string | null {
  const normalizedCitySlug = normalizeUspsCitySlug(id);
  return normalizedCitySlug || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const citySlug = getNormalizedCitySlug(id);

  if (!citySlug) {
    return getUspsDetailMetadata(id, null);
  }

  const usps = await getUspsPageData(citySlug);
  return getUspsDetailMetadata(citySlug, usps);
}

export default async function CardattackUspsIdPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const citySlug = getNormalizedCitySlug(id);

  if (!citySlug) {
    notFound();
  }

  const usps = await getUspsPageData(citySlug);

  if (!usps) {
    notFound();
  }

  return <UspsDetailPage config={routeConfig} usps={usps} />;
}
