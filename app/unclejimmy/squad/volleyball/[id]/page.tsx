import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@ui";

import VolleyballTournamentSections from "@/components/unclejimmy/VolleyballTournamentSections";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import {
  getVolleyballTournamentPageData,
} from "@/lib/volleyball-tournaments";

type Params = { id: string };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const tournamentData = getVolleyballTournamentPageData(id);
  const tournamentName =
    tournamentData?.tournamentName ?? `Volleyball Tournament ${id}`;
  const pageTitle = `${tournamentName} | 🎙unclejimmy squad`;
  const pageDescription = `Team overall record: ${tournamentData?.summary.overallRecord ?? "0-0"}.`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: canonicalUrl(`unclejimmy/squad/volleyball/${id}`) },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `/unclejimmy/squad/volleyball/${id}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: pageTitle,
      description: pageDescription,
    },
  };
}

export default async function UncleJimmyVolleyballTournamentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const tournamentData = getVolleyballTournamentPageData(id);
  if (!tournamentData) {
    notFound();
  }

  const { sections, summary, tournamentName } = tournamentData;

  return (
    <article className="max-w-3xl mx-auto space-y-10 mt-8 md:mt-10">
      <Card as="section" className="space-y-8 p-6 md:p-8">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            {tournamentName}
          </h1>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            {`Team overall record: ${summary.overallRecord}`}
          </p>
        </header>
        <VolleyballTournamentSections sections={sections} />
      </Card>
    </article>
  );
}
