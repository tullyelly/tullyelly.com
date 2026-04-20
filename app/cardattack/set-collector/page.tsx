import type { Metadata } from "next";

import SetCollectorLandingPage from "@/components/set-collector/SetCollectorLandingPage";
import { listSetCollectorSummaryRows } from "@/lib/set-collector-content";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

const title = "Set Collector | cardattack vault";
const description =
  "DB-backed set completion tracker for the cardattack vault; tracked sets, progress percentages, snapshot history, and trade-linked movement.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl("cardattack/set-collector") },
  openGraph: {
    title,
    description,
    url: "/cardattack/set-collector",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CardattackSetCollectorPage() {
  const rows = await listSetCollectorSummaryRows();
  return <SetCollectorLandingPage rows={rows} />;
}
