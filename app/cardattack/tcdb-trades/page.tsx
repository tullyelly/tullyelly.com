import { buildMetadata } from "@/lib/seo/builders";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import DataPageShell from "@/components/layout/DataPageShell";
import PageIntro from "@/components/layout/PageIntro";
import SectionHeader from "@/components/layout/SectionHeader";
import { listTcdbTrades } from "@/lib/tcdb-trades";
import TcdbTradeListClient from "./_components/TcdbTradeListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const trades = await listTcdbTrades();

  return (
    <DataPageShell width="wide">
      <PageIntro
        eyebrow="cardattack"
        title="TCDb Trades"
        description="Thank you to all of my trade partners. A wonderful community."
      />

      <section className="space-y-4">
        <SectionHeader
          title="Trade Ledger"
          eyebrow="cardattack directory"
          description="The full ledger behind the cardboard diplomacy."
        />

        <TcdbTradeListClient rows={trades} />
      </section>
    </DataPageShell>
  );
}

export const metadata = buildMetadata({
  title: "TCDb Trades | tullyelly",
  description: "The cardattack trade ledger and trading partners.",
  canonical: canonicalUrl("cardattack/tcdb-trades"),
});
