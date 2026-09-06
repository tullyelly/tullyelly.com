import Link from "next/link";
import { Card } from "@ui";
import { fmtDate } from "@/lib/datetime";
import type { TcdbTradePartnerSummary } from "@/lib/tcdb-trade-partners-db";

export default function TradePartnerRelations({
  partners,
}: {
  partners: TcdbTradePartnerSummary[];
}) {
  if (partners.length === 0) return null;
  return (
    <Card
      as="section"
      className="border-[color:var(--trade-border)] bg-[color:var(--trade-off-white)]"
    >
      <h2 className="text-xl font-semibold">Trade Partners</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {partners.map((partner) => (
          <li
            key={partner.id}
            className="rounded-xl border border-[color:var(--trade-border)] bg-white p-3"
          >
            <Link
              className="link-blue font-semibold"
              href={`/cardattack/tcdb-trade-partners/${partner.id}`}
            >
              {partner.tcdbUsername}
              {partner.name ? ` (${partner.name})` : ""}
            </Link>
            {partner.cityState || partner.country ? (
              <p className="text-xs text-muted-foreground">
                {[partner.cityState, partner.country]
                  .filter(Boolean)
                  .join("; ")}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-muted-foreground">
              {partner.tradeCount} trades; {partner.totalCardsExchanged} cards
              {partner.latestTradeDate
                ? `; latest ${fmtDate(partner.latestTradeDate)}`
                : ""}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
