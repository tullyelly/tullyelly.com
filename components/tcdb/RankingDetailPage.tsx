import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@ui";
import FullBleedPage from "@/components/layout/FullBleedPage";
import TrendPill from "@/components/tcdb/TrendPill";
import { fmtDate } from "@/lib/datetime";
import { tcdbTradePageThemeVars } from "@/lib/tcdb-theme";

type RankingDetailField = {
  label: string;
  value: ReactNode;
};

type RankingDetailFieldGroup = {
  title?: string;
  fields: RankingDetailField[];
};

type RankingDetailPageProps = {
  title: string;
  eyebrow: string;
  fields?: RankingDetailField[];
  fieldGroups?: RankingDetailFieldGroup[];
  listHref?: string;
  listLabel?: string;
  topHref?: string;
  topLabel?: string;
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
  title,
  eyebrow,
  fields,
  fieldGroups,
  listHref,
  listLabel,
  topHref = "/cardattack/homies",
  topLabel = "Back to homies",
}: RankingDetailPageProps) {
  const groups =
    fieldGroups && fieldGroups.length > 0
      ? fieldGroups
      : [{ fields: fields ?? [] }];
  const listLink =
    listHref && listLabel ? { href: listHref, label: listLabel } : null;

  return (
    <FullBleedPage articleClassName="md:max-w-[76rem] xl:max-w-[82rem]">
      <div
        className="space-y-8 px-1 py-6 md:px-2 md:py-8"
        style={tcdbTradePageThemeVars}
      >
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--trade-rust)_0%,var(--trade-rust-deep)_100%)] text-[color:var(--trade-off-white)] shadow-sm">
          <div className="relative min-h-[9rem] px-4 py-4 md:min-h-[10rem] md:px-6 md:py-6">
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
              <Link href={topHref} className={topLinkClassName}>
                {topLabel}
              </Link>
              {listLink ? (
                <Link
                  href={listLink.href}
                  className={`${topLinkClassName} whitespace-nowrap`}
                >
                  {listLink.label}
                </Link>
              ) : null}
            </div>
            <div className="mx-auto mt-5 flex max-w-[48rem] flex-col items-center justify-center gap-2 text-center md:absolute md:inset-0 md:mt-0 md:px-48">
              <p className="text-xs font-semibold uppercase text-white/72">
                {eyebrow}
              </p>
              <h1 className="text-[1.45rem] font-bold leading-none md:text-[1.8rem]">
                {title}
              </h1>
            </div>
          </div>
        </section>

        <div className="space-y-5">
          {groups.map((group, index) => (
            <Card
              as="section"
              key={group.title ?? index}
              className="border-[color:var(--trade-border)] bg-[color:var(--trade-off-white)]"
            >
              {group.title ? (
                <h2 className="mb-3 text-xl font-semibold text-[color:var(--trade-charcoal)]">
                  {group.title}
                </h2>
              ) : null}
              <dl className="grid gap-px overflow-hidden rounded-xl border border-[color:var(--trade-border)] bg-[color:var(--trade-border)] sm:grid-cols-2 xl:grid-cols-5">
                {group.fields.map((field) => (
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
          ))}
        </div>
      </div>
    </FullBleedPage>
  );
}
