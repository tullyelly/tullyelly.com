import { Card } from "@ui";

import FullBleedPage from "@/components/layout/FullBleedPage";
import { getAllLcsSummaries } from "@/lib/lcs";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

import LcsListClient from "./_components/LcsListClient";

const pageTitle = "LCS | 🃏cardattack";
const pageDescription =
  "Local card shop visits tracked from chronicles, with average ratings by shop.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("cardattack/lcs") },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/cardattack/lcs",
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

export default function CardattackLcsLandingPage() {
  const shops = getAllLcsSummaries();

  return (
    <FullBleedPage>
      <Card
        as="section"
        className="space-y-8 border-0 shadow-none px-1 py-6 md:p-8"
      >
        <header>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            Local Card Shops
          </h1>
        </header>

        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Running list of the local card shops I have been visiting. 
        </p>

        <LcsListClient rows={shops} />
      </Card>
    </FullBleedPage>
  );
}
