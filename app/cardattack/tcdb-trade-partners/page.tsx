import DataPageShell from "@/components/layout/DataPageShell";
import PageIntro from "@/components/layout/PageIntro";
import SectionHeader from "@/components/layout/SectionHeader";
import { buildMetadata } from "@/lib/seo/builders";
import { canonicalFor } from "@/lib/seo/url";
import { listTcdbTradePartnersFromDb } from "@/lib/tcdb-trade-partners-db";
import TcdbTradePartnerListClient from "./_components/TcdbTradePartnerListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = buildMetadata({
  title: "TCDb Trade Partners",
  description:
    "Trade history, card totals, interests, and completed sets for tullyelly TCDb trade partners.",
  canonical: canonicalFor("/cardattack/tcdb-trade-partners"),
  robots: { index: true, follow: true },
});

export default async function Page() {
  const partners = await listTcdbTradePartnersFromDb();
  return (
    <DataPageShell width="wide">
      <PageIntro
        title="TCDb Trade Partners"
        description="The people behind the trades, the cards, and the sets they helped complete."
      />
      <section className="space-y-4" aria-labelledby="trade-partners-heading">
        <SectionHeader
          id="trade-partners-heading"
          eyebrow="cardattack directory"
          title="Trade Partners"
          description="Search the community behind each exchange and review the latest trade activity."
        />
        <TcdbTradePartnerListClient rows={partners} />
      </section>
    </DataPageShell>
  );
}
