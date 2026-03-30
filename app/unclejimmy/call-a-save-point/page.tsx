import { Card } from "@ui";

import FullBleedPage from "@/components/layout/FullBleedPage";
import PageIntro from "@/components/layout/PageIntro";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import { getAllSavePointSummaries } from "@/lib/save-point";

import SavePointListClient from "./_components/SavePointListClient";

const pageTitle = "Call A Save Point | 🎙unclejimmy";
const pageDescription =
  "Video game reviews tracked from chronicles, with average ratings by game.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("unclejimmy/call-a-save-point") },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/unclejimmy/call-a-save-point",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export const dynamic = "force-static";
export const revalidate = 3600;

export default function UncleJimmyCallASavePointPage() {
  const games = getAllSavePointSummaries();

  return (
    <FullBleedPage>
      <Card
        as="section"
        className="space-y-8 border-0 shadow-none px-1 py-6 md:p-8"
      >
        <PageIntro title="Call A Save Point">
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            Running list of video game reviews from chronicles.
          </p>
        </PageIntro>
        <SavePointListClient rows={games} />
      </Card>
    </FullBleedPage>
  );
}
