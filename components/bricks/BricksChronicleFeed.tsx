import Link from "next/link";
import type { ComponentProps } from "react";

import { ChronicleSectionMdxRenderer } from "@/components/chronicles/ChronicleSectionMdxRenderer";
import ReleaseSection from "@/components/mdx/ReleaseSection";
import { fmtDate } from "@/lib/datetime";
import { compileMdxToCode } from "@/lib/mdx/compile";
import { createNextRainbowColour } from "@/lib/release-section-colours";
import type { BricksNarrativeDay, BricksSection } from "@/lib/bricks-content";

type BricksChronicleFeedProps = {
  days: BricksNarrativeDay[];
  entryLabel: string;
  emptyMessage: string;
  missingContentMessage: string;
};

type RenderableSection = BricksSection & { code: string };
type RenderableDay = BricksNarrativeDay & {
  compiledSections: RenderableSection[];
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

function getSourcePostLabel(
  post: BricksNarrativeDay["sourcePosts"][number],
): string {
  return post.title ?? fmtDate(post.date);
}

export default async function BricksChronicleFeed({
  days,
  entryLabel,
  emptyMessage,
  missingContentMessage,
}: BricksChronicleFeedProps) {
  const renderableDays: RenderableDay[] = await Promise.all(
    days.map(async (day) => ({
      ...day,
      compiledSections: await Promise.all(
        day.sections.map(async (section) => ({
          ...section,
          code: await compileMdxToCode(
            forceReleaseSectionDividerOff(section.mdx),
          ),
        })),
      ),
    })),
  );

  if (renderableDays.length === 0) {
    return (
      <p className="text-sm leading-6 text-[color:var(--bricks-ink)]/80">
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
    <div className="space-y-0">
      {renderableDays.map((day, dayIndex) => (
        <div key={day.buildDate} className="space-y-0">
          {dayIndex > 0 ? (
            <div
              aria-hidden="true"
              className="my-8 h-[4px] w-full rounded bg-[color:var(--bricks-accent)]"
            />
          ) : null}

          <article
            aria-label={`${entryLabel}: ${fmtDate(day.buildDate)}`}
            className="space-y-5"
          >
            <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                <div className="inline-flex min-h-[2.25rem] items-center whitespace-nowrap text-sm font-semibold leading-none text-[color:var(--bricks-ink)]">
                  <time dateTime={day.buildDate} className="relative top-px">
                    {fmtDate(day.buildDate, "America/Chicago", "long")}
                  </time>
                </div>

                {day.sourcePosts.length > 0 ? (
                  <nav
                    aria-label={`${fmtDate(day.buildDate)} source posts`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
                  >
                    {day.sourcePosts.map((post) => (
                      <Link
                        key={`${day.buildDate}-${post.slug}`}
                        href={post.url}
                        className="inline-flex min-h-[2.25rem] items-center whitespace-nowrap font-medium leading-none text-[color:var(--bricks-link)] transition hover:text-[color:var(--bricks-link-hover)]"
                      >
                        {`Chronicle: ${getSourcePostLabel(post)}`}
                      </Link>
                    ))}
                  </nav>
                ) : null}
              </div>

              <span className="ml-auto inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--bricks-accent)] px-3 py-1 text-sm font-semibold text-[color:var(--bricks-pill-fg)] shadow-sm">
                {`Bags ${day.bags}`}
              </span>
            </header>

            <div className="space-y-8">
              {day.compiledSections.length > 0 ? (
                day.compiledSections.map((section, sectionIndex) => (
                  <div
                    key={`${day.buildDate}-${section.postSlug}-${section.sectionOrdinal}`}
                    className={
                      sectionIndex > 0
                        ? "border-t border-[color:var(--bricks-border)] pt-8"
                        : ""
                    }
                  >
                    <ChronicleSectionMdxRenderer
                      code={section.code}
                      postDate={section.postDate}
                      components={{ ReleaseSection: RainbowReleaseSection }}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-[color:var(--bricks-ink)]/80">
                  {missingContentMessage}
                </p>
              )}
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}
