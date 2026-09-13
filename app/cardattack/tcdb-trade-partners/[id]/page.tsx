import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@ui";
import FullBleedPage from "@/components/layout/FullBleedPage";
import { fmtDate } from "@/lib/datetime";
import { buildMetadata } from "@/lib/seo/builders";
import { canonicalFor } from "@/lib/seo/url";
import { getTcdbProfileUrl } from "@/lib/tcdb-trades";
import { getRelatedTradePartnerChronicles } from "@/lib/tcdb-trade-partner-content";
import {
  getTcdbTradePartnerFromDb,
  listClansForTradePartnerFromDb,
  listContentTagsForTradePartnerFromDb,
  listHomiesForTradePartnerFromDb,
  listSetCollectorImpactForTradePartnerFromDb,
  listTagsForTradePartnerFromDb,
  listTcdbTradesForPartnerFromDb,
} from "@/lib/tcdb-trade-partners-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
type Props = { params: Promise<{ id: string }> };
const parseId = (value: string) => (/^\d+$/.test(value) ? Number(value) : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  const partner = id === null ? null : await getTcdbTradePartnerFromDb(id);
  if (!partner)
    return buildMetadata({
      title: "Trade partner not found",
      description: "The requested TCDb trade partner could not be located.",
      canonical: canonicalFor(`/cardattack/tcdb-trade-partners/${rawId}`),
      robots: { index: false, follow: false },
    });
  return buildMetadata({
    title: `${partner.tcdbUsername}; TCDb Trade Partner`,
    description: `${partner.name ? `${partner.name}; ` : ""}TCDb trade history and collecting connections for ${partner.tcdbUsername}.`,
    canonical: canonicalFor(`/cardattack/tcdb-trade-partners/${partner.id}`),
    robots: { index: true, follow: true },
  });
}

export default async function Page({ params }: Props) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) notFound();
  const [partner, trades, homies, clans, tags, contentTags, sets] =
    await Promise.all([
      getTcdbTradePartnerFromDb(id),
      listTcdbTradesForPartnerFromDb(id),
      listHomiesForTradePartnerFromDb(id),
      listClansForTradePartnerFromDb(id),
      listTagsForTradePartnerFromDb(id),
      listContentTagsForTradePartnerFromDb(id),
      listSetCollectorImpactForTradePartnerFromDb(id),
    ]);
  if (!partner) notFound();
  const chronicles = getRelatedTradePartnerChronicles(
    trades.map((trade) => trade.tradeId),
    contentTags,
  );
  return (
    <FullBleedPage width="wide">
      <div className="space-y-6 py-6">
        <Card as="section">
          <Link
            href="/cardattack/tcdb-trade-partners"
            className="link-blue text-sm"
          >
            ← Back to trade partners
          </Link>
          <h1 className="mt-3 text-3xl font-bold">{partner.tcdbUsername}</h1>
          {partner.name ? <p className="text-lg">{partner.name}</p> : null}
          <p className="text-muted-foreground">
            {[partner.cityState, partner.country].filter(Boolean).join("; ")}
          </p>
          <a
            className="link-blue mt-2 inline-block"
            href={getTcdbProfileUrl(partner.tcdbUsername)}
            target="_blank"
            rel="noopener noreferrer"
          >
            View {partner.tcdbUsername} on TCDb (external site)
          </a>
          <dl className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Trades", partner.tradeCount],
              ["Sent", partner.cardsSent],
              ["Received", partner.cardsReceived],
              ["Total", partner.totalCardsExchanged],
              [
                "First trade",
                partner.firstTradeDate
                  ? fmtDate(partner.firstTradeDate)
                  : "Not available",
              ],
              [
                "Latest trade",
                partner.latestTradeDate
                  ? fmtDate(partner.latestTradeDate)
                  : "Not available",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase text-muted-foreground">
                  {label}
                </dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card as="section">
          <h2 className="text-2xl font-semibold">Trades</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {trades.map((trade) => (
              <li key={trade.tradeId} className="rounded-lg border p-3">
                <Link
                  className="link-blue font-medium"
                  href={`/cardattack/tcdb-trades/${trade.tradeId}`}
                >
                  Trade {trade.tradeId}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {trade.status}; {trade.sent ?? 0} sent; {trade.received ?? 0}{" "}
                  received
                </p>
              </li>
            ))}
          </ul>
        </Card>
        {homies.length || clans.length || tags.length ? (
          <Card as="section">
            <h2 className="text-2xl font-semibold">Interests</h2>
            <div className="mt-3 grid gap-5 md:grid-cols-3">
              <div>
                <h3 className="font-semibold">Homies</h3>
                {homies.map((homie) => (
                  <Link
                    key={homie.id}
                    className="link-blue mr-3 inline-block"
                    href={`/cardattack/homies/${homie.tagSlug ?? homie.id}`}
                  >
                    {homie.name}
                  </Link>
                ))}
              </div>
              <div>
                <h3 className="font-semibold">Clans</h3>
                {clans.map((clan) => (
                  <Link
                    key={clan.id}
                    className="link-blue mr-3 inline-block"
                    href={`/cardattack/clans/${clan.slug}`}
                  >
                    {clan.name}
                  </Link>
                ))}
              </div>
              <div>
                <h3 className="font-semibold">Tags</h3>
                {tags.map((tag) => (
                  <span
                    key={`${tag.tagType}-${tag.id}`}
                    className="mr-2 inline-block text-sm"
                  >
                    <span className="text-muted-foreground">
                      {tag.tagType}:
                    </span>{" "}
                    {tag.href ? (
                      <Link className="link-blue" href={tag.href}>
                        {tag.displayName}
                      </Link>
                    ) : (
                      tag.displayName
                    )}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ) : null}
        {sets.length ? (
          <Card as="section">
            <h2 className="text-2xl font-semibold">Set Collector Impact</h2>
            <ul className="mt-3 space-y-2">
              {sets.map((set) => (
                <li key={set.setId}>
                  <Link
                    className="link-blue font-medium"
                    href={`/cardattack/set-collector/${set.setSlug}`}
                  >
                    {set.setName}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    ; {set.cardsOwned}/{set.totalCards} cards on{" "}
                    {fmtDate(set.snapshotDate)} via{" "}
                    <Link
                      className="link-blue"
                      href={`/cardattack/tcdb-trades/${set.tradeId}`}
                    >
                      trade {set.tradeId}
                    </Link>
                    {set.completed ? "; Hall of Fame" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        {chronicles.length ? (
          <Card as="section">
            <h2 className="text-2xl font-semibold">Related Chronicles</h2>
            <ul className="mt-3 space-y-3">
              {chronicles.map((post) => (
                <li key={post.slug}>
                  <Link className="link-blue font-medium" href={post.url}>
                    {post.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {fmtDate(post.date)}; related by {post.reasons.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </FullBleedPage>
  );
}
