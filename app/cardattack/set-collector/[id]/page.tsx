import type { Metadata } from "next";
import { notFound } from "next/navigation";

import SetCollectorDetailPage from "@/components/set-collector/SetCollectorDetailPage";
import { fmtDate } from "@/lib/datetime";
import { getSetCollectorPageData } from "@/lib/set-collector-content";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import {
  formatSetCollectorPercentComplete,
  normalizeSetCollectorId,
} from "@/lib/set-collector-types";

type Params = { id: string };

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getNormalizedId(id: string): number | null {
  try {
    return normalizeSetCollectorId(id);
  } catch {
    return null;
  }
}

function buildDescription(
  id: string,
  setCollector: Awaited<ReturnType<typeof getSetCollectorPageData>>,
): string {
  if (!setCollector) {
    return `Tracked card set ${id} detail page.`;
  }

  const setSize = `Set size: ${setCollector.totalCards} cards.`;
  const latestProgress =
    setCollector.cardsOwned !== undefined &&
    setCollector.percentComplete !== undefined
      ? `${setCollector.cardsOwned} of ${setCollector.totalCards} cards; ${formatSetCollectorPercentComplete(setCollector.percentComplete)} complete.`
      : "No snapshots have been recorded yet.";
  const latestSnapshot = setCollector.latestSnapshotDate
    ? ` Latest snapshot: ${fmtDate(setCollector.latestSnapshotDate)}.`
    : "";

  return `${setCollector.releaseYear} ${setCollector.manufacturer} ${setCollector.setName}. ${setSize} ${latestProgress}${latestSnapshot}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const normalizedId = getNormalizedId(id);

  if (!normalizedId) {
    return {
      title: "Set Collector | cardattack vault",
      description: `Tracked card set ${id} detail page.`,
    };
  }

  const setCollector = await getSetCollectorPageData(normalizedId);
  const title = setCollector
    ? `${setCollector.setName} | Set Collector`
    : `Set ${normalizedId} | Set Collector`;
  const description = buildDescription(String(normalizedId), setCollector);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(
        `cardattack/set-collector/${encodeURIComponent(String(normalizedId))}`,
      ),
    },
    openGraph: {
      title,
      description,
      url: `/cardattack/set-collector/${encodeURIComponent(String(normalizedId))}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CardattackSetCollectorIdPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const normalizedId = getNormalizedId(id);

  if (!normalizedId) {
    notFound();
  }

  const setCollector = await getSetCollectorPageData(normalizedId);

  if (!setCollector) {
    notFound();
  }

  return <SetCollectorDetailPage setCollector={setCollector} />;
}
