import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card } from "@ui";

import FullBleedPage from "@/components/layout/FullBleedPage";
import VolleyballTournamentSections from "@/components/unclejimmy/VolleyballTournamentSections";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import { getVolleyballTournamentSections } from "@/lib/volleyball-tournaments";
import { getVolleyballTournamentSummaryByKey } from "@/lib/volleyball-tournament-db";

type Params = { id: string };

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TROPHY_ICON_SRC = "/images/optimus/ccvbc-trophy.webp";

function getFinishLabel(finish: number | null): string | null {
  if (finish === 1) return "1st Place";
  if (finish === 2) return "2nd Place";
  if (finish === 3) return "3rd Place";
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const tournamentData = await getVolleyballTournamentSummaryByKey(id);
  const tournamentName =
    tournamentData?.tournamentName ?? `Volleyball Tournament ${id}`;
  const pageTitle = `${tournamentName} | 🎙unclejimmy squad`;
  const pageDescription = `Team overall record: ${tournamentData?.overallRecord ?? "0-0"}.`;

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
  const sections = getVolleyballTournamentSections(id);
  if (sections.length === 0) {
    notFound();
  }

  const tournamentSummary = await getVolleyballTournamentSummaryByKey(id);
  if (!tournamentSummary) {
    notFound();
  }

  const finishLabel = getFinishLabel(tournamentSummary.finish);
  const finishHasTrophy = tournamentSummary.finish === 1;
  const finishBadgeClassName = finishHasTrophy
    ? "inline-flex items-center justify-center gap-3 rounded-full border border-[var(--cream)] bg-black pl-2.5 pr-4 py-2 text-sm font-semibold text-[var(--cream)] shadow-sm"
    : "inline-flex items-center justify-center gap-3 rounded-full border border-black/10 bg-black/5 px-3 py-2 text-sm font-semibold text-muted-foreground";

  return (
    <FullBleedPage>
      <Card
        as="section"
        className="space-y-8 border-0 shadow-none px-1 py-6 md:p-8"
      >
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            {tournamentSummary.tournamentName}
          </h1>
          {finishLabel ? (
            <div className={finishBadgeClassName}>
              {finishHasTrophy ? (
                <Image
                  src={TROPHY_ICON_SRC}
                  alt=""
                  aria-hidden="true"
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0"
                />
              ) : null}
              <span className="leading-none">{finishLabel}</span>
            </div>
          ) : null}
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            {`Team overall record: ${tournamentSummary.overallRecord}`}
          </p>
        </header>
        <VolleyballTournamentSections sections={sections} />
      </Card>
    </FullBleedPage>
  );
}
