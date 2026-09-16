import Link from "next/link";
import type { ComponentProps, CSSProperties } from "react";

import { ChronicleSectionMdxRenderer } from "@/components/chronicles/ChronicleSectionMdxRenderer";
import ReleaseSection from "@/components/mdx/ReleaseSection";
import { fmtDate } from "@/lib/datetime";
import { compileMdxToCode } from "@/lib/mdx/compile";
import { createNextRainbowColour } from "@/lib/release-section-colours";

type FeedSection = {
  postSlug: string;
  postDate: string;
  mdx: string;
  sectionOrdinal: number;
};
type SourcePost = { slug: string; url: string; date: string; title?: string };
type FeedDay = {
  visitDate: string;
  sections: FeedSection[];
  sourcePosts: SourcePost[];
};

export type CollectionChronicleFeedTheme = {
  accent: string;
  border: string;
  ink: string;
  link: string;
  linkHover: string;
  pillForeground: string;
  surface: string;
};

type CollectionChronicleFeedProps<TDay extends FeedDay> = {
  days: TDay[];
  entryLabel: string;
  emptyMessage: string;
  missingContentMessage: string;
  theme: CollectionChronicleFeedTheme;
};

type RenderableDay<TDay extends FeedDay> = Omit<TDay, "sections"> & {
  sections: Array<TDay["sections"][number] & { code: string }>;
};

const DIVIDER_PROP_PATTERN = /\sdivider\s*=\s*(\{[^}]*\}|"[^"]*"|'[^']*')/;
const RELEASE_SECTION_PATTERN = /<ReleaseSection\b/g;
const forceReleaseSectionDividerOff = (source: string): string =>
  source.replace(/<ReleaseSection\b([^>]*)>/g, (_match, attrs: string) => {
    const updatedAttrs = DIVIDER_PROP_PATTERN.test(attrs)
      ? attrs.replace(DIVIDER_PROP_PATTERN, " divider={false}")
      : `${attrs} divider={false}`;
    return `<ReleaseSection${updatedAttrs}>`;
  });
type ReleaseSectionProps = ComponentProps<typeof ReleaseSection>;
const countReleaseSections = (source: string): number =>
  source.match(RELEASE_SECTION_PATTERN)?.length ?? 0;
const toTimestamp = (value: string): number => {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};
const getSourcePostLabel = (post: SourcePost): string =>
  post.title ?? fmtDate(post.date);

export default async function CollectionChronicleFeed<TDay extends FeedDay>({
  days,
  entryLabel,
  emptyMessage,
  missingContentMessage,
  theme,
}: CollectionChronicleFeedProps<TDay>) {
  const sortedDays = [...days].sort(
    (a, b) => toTimestamp(a.visitDate) - toTimestamp(b.visitDate),
  );
  const renderableDays: Array<RenderableDay<TDay>> = await Promise.all(
    sortedDays.map(async (day) => ({
      ...day,
      sections: await Promise.all(
        day.sections.map(async (section) => ({
          ...section,
          code: await compileMdxToCode(
            forceReleaseSectionDividerOff(section.mdx),
          ),
        })),
      ),
    })),
  );
  const themeStyle: CSSProperties = {
    ["--collection-feed-accent" as string]: theme.accent,
    ["--collection-feed-border" as string]: theme.border,
    ["--collection-feed-ink" as string]: theme.ink,
    ["--collection-feed-link" as string]: theme.link,
    ["--collection-feed-link-hover" as string]: theme.linkHover,
    ["--collection-feed-pill-fg" as string]: theme.pillForeground,
    ["--collection-feed-surface" as string]: theme.surface,
  };

  if (renderableDays.length === 0) {
    return (
      <p
        className="text-sm leading-6 text-[color:var(--collection-feed-ink)]/80"
        style={themeStyle}
      >
        {emptyMessage}
      </p>
    );
  }

  const totalReleaseSections = days.reduce(
    (total, day) =>
      total +
      day.sections.reduce(
        (dayTotal, section) => dayTotal + countReleaseSections(section.mdx),
        0,
      ),
    0,
  );
  const nextRainbowColour = createNextRainbowColour(totalReleaseSections);
  function RainbowReleaseSection(props: ReleaseSectionProps) {
    return <ReleaseSection {...props} rainbowColour={nextRainbowColour()} />;
  }

  return (
    <div className="space-y-0" style={themeStyle}>
      {renderableDays.map((day, dayIndex) => (
        <div key={day.visitDate} className="space-y-0">
          {dayIndex > 0 ? (
            <div
              aria-hidden="true"
              className="my-8 h-[4px] w-full rounded bg-[color:var(--collection-feed-accent)]"
            />
          ) : null}
          <article
            aria-label={`${entryLabel}: ${fmtDate(day.visitDate)}`}
            className="space-y-5"
          >
            <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                <div className="inline-flex min-h-[2.25rem] items-center whitespace-nowrap text-sm font-semibold leading-none text-[color:var(--collection-feed-ink)]">
                  <time dateTime={day.visitDate} className="relative top-px">
                    {fmtDate(day.visitDate, "America/Chicago", "long")}
                  </time>
                </div>
                {day.sourcePosts.length > 0 ? (
                  <nav
                    aria-label={`${fmtDate(day.visitDate)} source posts`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
                  >
                    {day.sourcePosts.map((post) => (
                      <Link
                        key={`${day.visitDate}-${post.slug}`}
                        href={post.url}
                        className="inline-flex min-h-[2.25rem] items-center whitespace-nowrap font-medium leading-none text-[color:var(--collection-feed-link)] transition hover:text-[color:var(--collection-feed-link-hover)]"
                      >
                        {`Chronicle: ${getSourcePostLabel(post)}`}
                      </Link>
                    ))}
                  </nav>
                ) : null}
              </div>
              <span className="ml-auto inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--collection-feed-accent)] px-3 py-1 text-sm font-semibold text-[color:var(--collection-feed-pill-fg)] shadow-sm">{`${entryLabel} ${dayIndex + 1}`}</span>
            </header>
            <div className="rounded-[28px] border border-[color:var(--collection-feed-border)] bg-[color:var(--collection-feed-surface)] px-4 py-4 shadow-sm md:px-5 md:py-5">
              <div className="space-y-8">
                {day.sections.length > 0 ? (
                  day.sections.map((section, sectionIndex) => (
                    <div
                      key={`${day.visitDate}-${section.postSlug}-${section.sectionOrdinal}`}
                      className={
                        sectionIndex > 0
                          ? "border-t border-[color:var(--collection-feed-border)] pt-8"
                          : ""
                      }
                    >
                      <ChronicleSectionMdxRenderer
                        code={section.code}
                        chronicleSlug={section.postSlug}
                        postDate={section.postDate}
                        components={{ ReleaseSection: RainbowReleaseSection }}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-[color:var(--collection-feed-ink)]/80">
                    {missingContentMessage}
                  </p>
                )}
              </div>
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}
