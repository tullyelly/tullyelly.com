import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@ui";
import FullBleedPage from "@/components/layout/FullBleedPage";
import RankingListNav from "@/components/tcdb/RankingListNav";
import TrendPill from "@/components/tcdb/TrendPill";
import { fmtDate } from "@/lib/datetime";
import { tcdbTradePageThemeVars } from "@/lib/tcdb-theme";

type RankingDetailField = {
  label: string;
  value: ReactNode;
};

type RankingDetailPageProps = {
  current: "homies" | "clans";
  title: string;
  eyebrow: string;
  fields: RankingDetailField[];
  listHref: string;
  listLabel: string;
};

const integerFormatter = new Intl.NumberFormat("en-US");
const signedFormatter = new Intl.NumberFormat("en-US", {
  signDisplay: "always",
});

const topLinkClassName =
  "inline-flex items-center rounded-full border border-white bg-white px-3 py-1.5 text-sm font-semibold leading-snug text-[color:var(--trade-blue)] shadow-sm transition hover:bg-[color:var(--trade-blue-soft)]";
const summaryLabelClassName =
  "text-[0.68rem] font-semibold uppercase leading-tight opacity-75 md:text-[0.72rem] xl:whitespace-nowrap";

export function formatRankingNumber(value: number): string {
  return integerFormatter.format(value);
}

export function formatRankingSigned(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Not available";
  return signedFormatter.format(value);
}

export function formatRankingDate(value: string | null | undefined): string {
  return value ? fmtDate(value, "America/Chicago", "long") : "Not available";
}

export function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}

export function rankingTrendField(trend: "up" | "down" | "flat") {
  return <TrendPill trend={trend} />;
}

export default function RankingDetailPage({
  current,
  title,
  eyebrow,
  fields,
  listHref,
  listLabel,
}: RankingDetailPageProps) {
  return (
    <FullBleedPage articleClassName="md:max-w-[76rem] xl:max-w-[82rem]">
      <div
        className="space-y-8 px-1 py-6 md:px-2 md:py-8"
        style={tcdbTradePageThemeVars}
      >
        <RankingListNav current={current} />

        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--trade-rust)_0%,var(--trade-rust-deep)_100%)] text-[color:var(--trade-off-white)] shadow-sm">
          <div className="space-y-4 px-4 py-4 md:space-y-6 md:px-6 md:py-6">
            <div className="space-y-2 md:grid md:grid-cols-[max-content_minmax(0,1fr)_max-content] md:items-center md:gap-x-4 md:space-y-0">
              <Link
                href="/cardattack/tcdb-rankings"
                className={topLinkClassName}
              >
                Back to rankings
              </Link>
              <div className="min-w-0 space-y-2 md:px-4 md:text-center">
                <p className="text-xs font-semibold uppercase text-white/72">
                  {eyebrow}
                </p>
                <h1 className="text-[1.45rem] font-bold leading-none md:text-[1.8rem]">
                  {title}
                </h1>
              </div>
              <Link
                href={listHref}
                className={`${topLinkClassName} whitespace-nowrap`}
              >
                {listLabel}
              </Link>
            </div>
          </div>
        </section>

        <Card
          as="section"
          className="border-[color:var(--trade-border)] bg-[color:var(--trade-off-white)]"
        >
          <dl className="grid gap-px overflow-hidden rounded-xl border border-[color:var(--trade-border)] bg-[color:var(--trade-border)] sm:grid-cols-2 xl:grid-cols-5">
            {fields.map((field) => (
              <div
                key={field.label}
                className="min-w-0 bg-[color:var(--trade-off-white)] px-3.5 py-3 md:px-4 md:py-3.5"
              >
                <dt className={summaryLabelClassName}>{field.label}</dt>
                <dd className="mt-2 flex min-h-[2.25rem] min-w-0 items-center text-sm font-semibold leading-snug text-[color:var(--trade-charcoal)]">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </FullBleedPage>
  );
}
