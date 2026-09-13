import type { CSSProperties, ReactNode } from "react";

import FullBleedPage from "./FullBleedPage";
import ProductionPageLink from "./ProductionPageLink";
import SectionHeader from "./SectionHeader";
import { Stat, StatGrid } from "@/components/ui/StatGrid";

type CollectionStat = {
  label: string;
  value: ReactNode;
};

type CollectionDirectoryPageProps = {
  children: ReactNode;
  heroEyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  stats: CollectionStat[];
  sectionId: string;
  sectionEyebrow?: ReactNode;
  sectionTitle: ReactNode;
  sectionDescription?: ReactNode;
  pageThemeStyle?: CSSProperties;
  theme: {
    accent: string;
    accentDeep: string;
    foreground: string;
    ink: string;
    sectionAccent: string;
  };
};

export default function CollectionDirectoryPage({
  children,
  heroEyebrow,
  title,
  description,
  stats,
  sectionId,
  sectionEyebrow,
  sectionTitle,
  sectionDescription,
  pageThemeStyle,
  theme,
}: CollectionDirectoryPageProps) {
  const resolvedThemeStyle: CSSProperties = {
    ...pageThemeStyle,
    ["--collection-accent" as string]: theme.accent,
    ["--collection-accent-deep" as string]: theme.accentDeep,
    ["--collection-foreground" as string]: theme.foreground,
    ["--collection-ink" as string]: theme.ink,
    ["--collection-section-accent" as string]: theme.sectionAccent,
  };

  return (
    <FullBleedPage width="wide">
      <div
        className="space-y-8 px-1 py-6 md:px-2 md:py-8"
        style={resolvedThemeStyle}
      >
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--collection-accent)_0%,var(--collection-accent-deep)_100%)] text-[color:var(--collection-foreground)] shadow-sm">
          <div className="space-y-6 px-4 py-5 md:px-6 md:py-6">
            <div className="space-y-3">
              <p className="!m-0 text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
                {heroEyebrow}
              </p>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="!m-0 text-[1.9rem] font-bold leading-none md:text-[2.35rem]">
                    {title}
                  </h1>
                  <ProductionPageLink className="border-white/30 text-white/80 hover:bg-white/10 hover:text-white" />
                </div>
                <p className="!m-0 max-w-3xl text-[15px] leading-7 text-white/88 md:text-[17px]">
                  {description}
                </p>
              </div>
            </div>

            <StatGrid columns={3} variant="hero">
              {stats.map((stat) => (
                <Stat
                  key={stat.label}
                  variant="hero"
                  label={stat.label}
                  value={stat.value}
                />
              ))}
            </StatGrid>
          </div>
        </section>

        <section aria-labelledby={sectionId} className="space-y-5">
          <SectionHeader
            id={sectionId}
            eyebrow={sectionEyebrow}
            title={sectionTitle}
            description={sectionDescription}
            eyebrowClassName="text-[color:var(--collection-section-accent)]/70"
            titleClassName="text-[color:var(--collection-ink)]"
          />
          {children}
        </section>
      </div>
    </FullBleedPage>
  );
}
