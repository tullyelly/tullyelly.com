import Link from "next/link";
import { Card } from "@ui";
import FullBleedPage from "@/components/layout/FullBleedPage";
import PageIntro from "@/components/layout/PageIntro";
import { Table, TBody, THead } from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";
import { buildMetadata } from "@/lib/seo/builders";
import { canonicalFor } from "@/lib/seo/url";
import { listTcdbTradePartnersFromDb } from "@/lib/tcdb-trade-partners-db";

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
    <FullBleedPage articleClassName="md:max-w-[82rem]">
      <Card
        as="section"
        className="space-y-6 border-0 px-1 pb-6 pt-0 shadow-none md:px-8"
      >
        <PageIntro title="TCDb Trade Partners">
          <p className="text-muted-foreground">
            The people behind the trades, the cards, and the sets they helped
            complete.
          </p>
        </PageIntro>
        <Table variant="bucks" aria-label="TCDb trade partners">
          <THead variant="bucks">
            <th>Partner</th>
            <th>Name and location</th>
            <th>Trades</th>
            <th>Sent</th>
            <th>Received</th>
            <th>Total</th>
            <th>Latest trade</th>
            <th>Hall of Fame</th>
          </THead>
          <TBody>
            {partners.map((partner) => (
              <tr key={partner.id}>
                <td>
                  <Link
                    className="link-blue font-medium"
                    href={`/cardattack/tcdb-trade-partners/${partner.id}`}
                  >
                    {partner.tcdbUsername}
                  </Link>
                </td>
                <td>
                  <div>{partner.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {[partner.cityState, partner.country]
                      .filter(Boolean)
                      .join("; ") || "Not listed"}
                  </div>
                </td>
                <td className="tabular-nums">{partner.tradeCount}</td>
                <td className="tabular-nums">{partner.cardsSent}</td>
                <td className="tabular-nums">{partner.cardsReceived}</td>
                <td className="tabular-nums">{partner.totalCardsExchanged}</td>
                <td>
                  {partner.latestTradeDate ? (
                    <time dateTime={partner.latestTradeDate}>
                      {fmtDate(partner.latestTradeDate)}
                    </time>
                  ) : (
                    "Not available"
                  )}
                </td>
                <td className="tabular-nums">
                  {partner.hallOfFameCount || ""}
                </td>
              </tr>
            ))}
            {partners.length === 0 ? (
              <tr>
                <td colSpan={8}>No trade partners are available yet.</td>
              </tr>
            ) : null}
          </TBody>
        </Table>
      </Card>
    </FullBleedPage>
  );
}
