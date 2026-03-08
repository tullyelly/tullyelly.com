import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@ui";

import LcsSections from "@/components/cardattack/LcsSections";
import FullBleedPage from "@/components/layout/FullBleedPage";
import { getAllLcsSummaries, getLcsPageData } from "@/lib/lcs";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

type Params = { id: string };

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams(): Params[] {
  const summaries = getAllLcsSummaries();
  return summaries.map((summary) => ({ id: summary.lcsId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const lcsData = getLcsPageData(id);
  const lcsName = lcsData?.lcsName ?? `Card Shop ${id}`;
  const averageRating = lcsData?.summary.averageRating ?? 0;
  const visitCount = lcsData?.summary.visitCount ?? 0;
  const visitLabel = visitCount === 1 ? "visit" : "visits";
  const pageTitle = `${lcsName} | 🃏cardattack lcs`;
  const pageDescription = `Average rating: ${averageRating.toFixed(
    1,
  )}/10 from ${visitCount} tracked ${visitLabel}.`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: canonicalUrl(`cardattack/lcs/${id}`) },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `/cardattack/lcs/${id}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: pageTitle,
      description: pageDescription,
    },
  };
}

export default async function CardattackLcsIdPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const lcsData = getLcsPageData(id);

  if (!lcsData) {
    notFound();
  }

  const { sections, summary, lcsName } = lcsData;
  const visitLabel = summary.visitCount === 1 ? "visit" : "visits";

  return (
    <FullBleedPage>
      <Card
        as="section"
        className="space-y-4 border-0 shadow-none px-1 py-6 md:p-8"
      >
        <header className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            {lcsName}
          </h1>
          <Link href="/cardattack/lcs" className="link-blue">
            ← Back to local card shops
          </Link>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            {`Average rating: ${summary.averageRating.toFixed(1)}/10 across ${summary.visitCount} ${visitLabel}`}
          </p>
        </header>
        <LcsSections sections={sections} />
      </Card>
    </FullBleedPage>
  );
}
