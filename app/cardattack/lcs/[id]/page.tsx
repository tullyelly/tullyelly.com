import type { Metadata } from "next";
import { notFound } from "next/navigation";

import LcsDetailPage from "@/components/lcs/LcsDetailPage";
import { getLcsPageData } from "@/lib/lcs-content";
import { getLcsRouteConfig } from "@/lib/lcs-route-config";
import { getLcsDetailMetadata } from "@/lib/lcs-route-metadata";
import { normalizeLcsSlug } from "@/lib/lcs-types";

type Params = { id: string };

const routeConfig = getLcsRouteConfig();

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getNormalizedLcsSlug(id: string): string | null {
  try {
    return normalizeLcsSlug(id);
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
  const slug = getNormalizedLcsSlug(id);

  if (!slug) {
    return getLcsDetailMetadata(id, null);
  }

  const lcs = await getLcsPageData(slug);
  return getLcsDetailMetadata(slug, lcs);
}

export default async function CardattackLcsIdPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const slug = getNormalizedLcsSlug(id);

  if (!slug) {
    notFound();
  }

  const lcs = await getLcsPageData(slug);

  if (!lcs) {
    notFound();
  }

  return <LcsDetailPage config={routeConfig} lcs={lcs} />;
}
