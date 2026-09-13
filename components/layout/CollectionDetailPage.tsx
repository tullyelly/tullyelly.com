import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

import { Stat, StatGrid } from "@/components/ui/StatGrid";
import FullBleedPage from "./FullBleedPage";
import SectionHeader from "./SectionHeader";

type CollectionDetailStat = {
  label: string;
  value: ReactNode;
  valueClassName?: string;
};

type CollectionDetailPageProps = {
  children: ReactNode;
  backHref: string;
  backLabel: string;
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  stats: CollectionDetailStat[];
  statColumns?: 3 | 4 | 5;
  sectionId: string;
  sectionTitle: ReactNode;
  sectionDescription?: ReactNode;
  pageThemeStyle?: CSSProperties;
  theme: {
    accent: string;
    accentDeep: string;
    foreground: string;
    ink: string;
    link: string;
    linkHover: string;
    accentSoft: string;
  };
};

export default function CollectionDetailPage({
  children,
  backHref,
  backLabel,
  eyebrow,
  title,
  subtitle,
  stats,
  statColumns = 3,
  sectionId,
  sectionTitle,
  sectionDescription,
  pageThemeStyle,
  theme,
}: CollectionDetailPageProps) {
  const resolvedThemeStyle: CSSProperties = {
    ...pageThemeStyle,
    ["--collection-detail-accent" as string]: theme.accent,
    ["--collection-detail-accent-deep" as string]: theme.accentDeep,
    ["--collection-detail-foreground" as string]: theme.foreground,
    ["--collection-detail-ink" as string]: theme.ink,
    ["--collection-detail-link" as string]: theme.link,
    ["--collection-detail-link-hover" as string]: theme.linkHover,
    ["--collection-detail-accent-soft" as string]: theme.accentSoft,
  };
  const backLinkClassName =
    "inline-flex items-center rounded-full border border-white bg-white px-3 py-1.5 text-sm font-semibold leading-snug text-[color:var(--collection-detail-link)] shadow-sm transition hover:bg-[color:var(--collection-detail-accent-soft)] hover:text-[color:var(--collection-detail-link-hover)]";

  return (
    <FullBleedPage width="wide">
      <div
        className="space-y-8 px-1 py-6 md:px-2 md:py-8"
        style={resolvedThemeStyle}
      >
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--collection-detail-accent)_0%,var(--collection-detail-accent-deep)_100%)] text-[color:var(--collection-detail-foreground)] shadow-sm">
          <div className="space-y-4 px-4 py-4 md:space-y-6 md:px-6 md:py-6">
            <div className="space-y-2 md:grid md:grid-cols-[max-content_minmax(0,1fr)_max-content] md:items-center md:gap-x-4 md:space-y-0">
              <Link href={backHref} className={backLinkClassName}>
                {`← ${backLabel}`}
              </Link>
              <div className="min-w-0 space-y-2 md:px-4 md:text-center">
                <p className="!m-0 text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
                  {eyebrow}
                </p>
                <div className="space-y-1">
                  <h1 className="!m-0 text-[1.45rem] font-bold leading-none md:text-[1.8rem]">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="!m-0 text-sm leading-6 text-white/82">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
              <span
                aria-hidden="true"
                className={`${backLinkClassName} invisible hidden whitespace-nowrap md:inline-flex`}
              >
                {`← ${backLabel}`}
              </span>
            </div>

            <StatGrid columns={statColumns} variant="hero">
              {stats.map((stat) => (
                <Stat
                  key={stat.label}
                  variant="hero"
                  label={stat.label}
                  value={stat.value}
                  valueClassName={
                    stat.valueClassName ?? "flex min-h-9 items-center"
                  }
                />
              ))}
            </StatGrid>
          </div>
        </section>

        <section aria-labelledby={sectionId} className="space-y-5">
          <SectionHeader
            id={sectionId}
            eyebrow={eyebrow}
            title={sectionTitle}
            description={sectionDescription}
            eyebrowClassName="text-[color:var(--collection-detail-link)]/70"
            titleClassName="text-[color:var(--collection-detail-ink)]"
            descriptionClassName="text-[color:var(--collection-detail-ink)]/80"
          />
          {children}
        </section>
      </div>
    </FullBleedPage>
  );
}
