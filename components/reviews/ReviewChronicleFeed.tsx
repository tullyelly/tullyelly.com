import Link from "next/link";
import type { ComponentProps } from "react";

import ReleaseSection from "@/components/mdx/ReleaseSection";
import { MdxRenderer } from "@/components/mdx-renderer";
import { fmtDate } from "@/lib/datetime";
import { compileMdxToCode } from "@/lib/mdx/compile";
import { createNextRainbowColour } from "@/lib/release-section-colours";
import type { ReviewSection } from "@/lib/review-content";

type ReviewChronicleFeedProps = {
  sections: ReviewSection[];
  entryLabel: string;
  emptyMessage: string;
};

type RenderableSection = ReviewSection & { code: string };
type FeedEntry = {
  section: RenderableSection;
  anchorId: string;
  key: string;
  ordinal: number;
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

export default async function ReviewChronicleFeed({
  sections,
  entryLabel,
  emptyMessage,
}: ReviewChronicleFeedProps) {
  const compiledSections: RenderableSection[] = await Promise.all(
    sections.map(async (section) => ({
      ...section,
      code: await compileMdxToCode(forceReleaseSectionDividerOff(section.mdx)),
    })),
  );

  if (compiledSections.length === 0) {
    return (
      <p className="text-sm leading-6 text-[color:var(--review-ink)]/80">
        {emptyMessage}
      </p>
    );
  }

  const entries: FeedEntry[] = [];
  const seenByPost = new Map<string, number>();

  for (const [index, section] of compiledSections.entries()) {
    const baseKey = `${section.postSlug}-${section.postDate}-${section.postUrl}`;
    const next = (seenByPost.get(baseKey) ?? 0) + 1;
    seenByPost.set(baseKey, next);

    entries.push({
      section,
      anchorId: `${entryLabel.toLowerCase()}-${section.postSlug}-${next}`,
      key: `${baseKey}-${next}`,
      ordinal: index + 1,
    });
  }

  const totalReleaseSections = sections.reduce(
    (total, section) => total + countReleaseSections(section.mdx),
    0,
  );
  const nextRainbowColour = createNextRainbowColour(totalReleaseSections);

  function RainbowReleaseSection(props: ReleaseSectionProps) {
    return <ReleaseSection {...props} rainbowColour={nextRainbowColour()} />;
  }

  return (
    <div className="space-y-0">
      {entries.length > 1 ? (
        <nav
          aria-label={`${entryLabel} jump links`}
          className="mb-6 flex flex-wrap gap-3"
        >
          {entries.map((entry) => (
            <Link
              key={`${entry.key}-jump`}
              href={`#${entry.anchorId}`}
              className="inline-flex min-h-[2.25rem] items-center rounded-full border border-[color:var(--review-border)] bg-[color:var(--review-accent-soft)] px-3 py-1 text-sm font-semibold text-[color:var(--review-ink)] transition hover:bg-[color:var(--review-accent-wash)]"
            >
              {`${entryLabel} ${entry.ordinal}`}
            </Link>
          ))}
        </nav>
      ) : null}

      {entries.map((entry, index) => (
        <div key={entry.key} className="space-y-0">
          {index > 0 ? (
            <div
              aria-hidden="true"
              className="my-8 h-[4px] w-full rounded bg-[color:var(--review-accent)]"
            />
          ) : null}

          <article id={entry.anchorId} className="space-y-5">
            <header className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <time
                  dateTime={entry.section.postDate}
                  className="block text-lg font-semibold leading-tight text-[color:var(--review-ink)] md:text-xl"
                >
                  {fmtDate(entry.section.postDate, "America/Chicago", "long")}
                </time>
                <Link
                  href={entry.section.postUrl}
                  className="mt-2 inline-flex items-center text-sm font-medium text-[color:var(--review-link)] transition hover:text-[color:var(--review-link-hover)]"
                >
                  {`Original Chronicle: ${entry.section.postTitle}`}
                </Link>
              </div>

              <span className="inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--review-accent)] px-3 py-1 text-sm font-semibold text-[color:var(--review-pill-fg)] shadow-sm">
                {`${entryLabel} ${entry.ordinal}`}
              </span>
            </header>

            <div className="rounded-[28px] border border-[color:var(--review-border)] bg-[color:var(--review-surface)] px-4 py-4 shadow-sm md:px-5 md:py-5">
              <MdxRenderer
                code={entry.section.code}
                components={{ ReleaseSection: RainbowReleaseSection }}
              />
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}
