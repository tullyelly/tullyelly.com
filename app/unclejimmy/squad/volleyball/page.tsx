import { Card } from "@ui";

import FullBleedPage from "@/components/layout/FullBleedPage";
import PageIntro from "@/components/layout/PageIntro";
import PersonCard from "@/components/mdx/PersonTag";
import VolleyballTournamentList from "@/components/unclejimmy/VolleyballTournamentList";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import { getVolleyballTournamentListSummaries } from "@/lib/volleyball-tournament-db";

const pageTitle = "Volleyball Tournaments | 🎙unclejimmy squad";
const pageDescription =
  "Tournament runs pulled from the volleyball tables; records are cumulative across all tracked tournament days.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("unclejimmy/squad/volleyball") },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/unclejimmy/squad/volleyball",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UncleJimmyVolleyballLandingPage() {
  const tournaments = await getVolleyballTournamentListSummaries();

  return (
    <FullBleedPage>
      <Card
        as="section"
        className="space-y-8 border-0 shadow-none px-1 py-6 md:p-8"
      >
        <PageIntro title="Volleyball Tournaments">
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            Here&apos;s a running list of{" "}
            <PersonCard displayName="jeff meff" tag="jeff-meff" />
            &apos;s volleyball tournaments.
          </p>
        </PageIntro>

        <VolleyballTournamentList rows={tournaments} />
      </Card>
    </FullBleedPage>
  );
}
