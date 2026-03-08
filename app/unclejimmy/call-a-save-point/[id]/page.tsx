import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@ui";

import FullBleedPage from "@/components/layout/FullBleedPage";
import SavePointSections from "@/components/unclejimmy/SavePointSections";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import {
  getAllSavePointSummaries,
  getSavePointPageData,
} from "@/lib/save-point";

type Params = { id: string };

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams(): Params[] {
  const summaries = getAllSavePointSummaries();
  return summaries.map((summary) => ({ id: summary.savePointId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const savePointData = getSavePointPageData(id);
  const savePointName = savePointData?.savePointName ?? `Save Point ${id}`;
  const averageRating = savePointData?.summary.averageRating ?? 0;
  const reviewCount = savePointData?.summary.visitCount ?? 0;
  const reviewLabel = reviewCount === 1 ? "review" : "reviews";
  const pageTitle = `${savePointName} | 🎙unclejimmy call a save point`;
  const pageDescription = `Average rating: ${averageRating.toFixed(
    1,
  )}/10 from ${reviewCount} tracked ${reviewLabel}.`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: canonicalUrl(`unclejimmy/call-a-save-point/${id}`) },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `/unclejimmy/call-a-save-point/${id}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: pageTitle,
      description: pageDescription,
    },
  };
}

export default async function UncleJimmySavePointIdPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const savePointData = getSavePointPageData(id);

  if (!savePointData) {
    notFound();
  }

  const { sections, summary, savePointName, savePointUrl } = savePointData;
  const reviewLabel = summary.visitCount === 1 ? "review" : "reviews";

  return (
    <FullBleedPage>
      <Card
        as="section"
        className="space-y-4 border-0 shadow-none px-1 py-6 md:p-8"
      >
        <header className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            {savePointName}
          </h1>
          <Link href="/unclejimmy/call-a-save-point" className="link-blue">
            ← Back to call a save point
          </Link>
          {savePointUrl ? (
            <a
              href={savePointUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-blue"
            >
              
            </a>
          ) : null}
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            {`Average rating: ${summary.averageRating.toFixed(1)}/10 across ${summary.visitCount} ${reviewLabel}`}
          </p>
        </header>
        <SavePointSections sections={sections} />
      </Card>
    </FullBleedPage>
  );
}
