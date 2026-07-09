import Link from "next/link";
import type { ComponentProps } from "react";

import { ChronicleSectionMdxRenderer } from "@/components/chronicles/ChronicleSectionMdxRenderer";
import ReleaseSection from "@/components/mdx/ReleaseSection";
import { fmtDate } from "@/lib/datetime";
import { compileMdxToCode } from "@/lib/mdx/compile";
import { createNextRainbowColour } from "@/lib/release-section-colours";
import type { TournamentSection } from "@/lib/volleyball-tournaments";

type VolleyballTournamentSectionsProps = {
  sections: TournamentSection[];
};

type RenderableSection = TournamentSection & { code: string };
type RenderableSectionEntry = {
  section: RenderableSection;
  key: string;
};
type RenderableTournamentDay = {
  tournamentDate: string;
  dayNumber: number;
  anchorId: string;
  key: string;
  entries: RenderableSectionEntry[];
  posts: Array<Pick<RenderableSection, "postTitle" | "postUrl">>;
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

const getTournamentDayAnchorId = (tournamentDate: string): string => {
  const suffix = tournamentDate.replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `day-${suffix || "unknown"}`;
};

const getUniquePostsForDay = (
  entries: RenderableSectionEntry[],
): RenderableTournamentDay["posts"] => {
  const byUrl = new Map<
    string,
    Pick<RenderableSection, "postTitle" | "postUrl">
  >();

  for (const entry of entries) {
    byUrl.set(entry.section.postUrl, {
      postTitle: entry.section.postTitle,
      postUrl: entry.section.postUrl,
    });
  }

  return Array.from(byUrl.values());
};

function OriginalPostLinks({
  posts,
}: {
  posts: RenderableTournamentDay["posts"];
}) {
  if (posts.length === 1) {
    const post = posts[0];
    return post ? (
      <Link href={post.postUrl} className="link-blue text-base">
        (original post)
      </Link>
    ) : null;
  }

  return (
    <span className="text-base font-normal text-muted-foreground">
      {" original posts: "}
      {posts.map((post, index) => (
        <span key={post.postUrl}>
          {index > 0 ? ", " : null}
          <Link href={post.postUrl} className="link-blue">
            {post.postTitle}
          </Link>
        </span>
      ))}
    </span>
  );
}

export default async function VolleyballTournamentSections({
  sections,
}: VolleyballTournamentSectionsProps) {
  const compiledSections: RenderableSection[] = await Promise.all(
    sections.map(async (section) => ({
      ...section,
      code: await compileMdxToCode(forceReleaseSectionDividerOff(section.mdx)),
    })),
  );

  const sectionEntries: RenderableSectionEntry[] = [];
  const seenByPost = new Map<string, number>();

  for (const section of compiledSections) {
    const baseKey = `${section.postSlug}-${section.tournamentDate}-${section.postUrl}`;
    const next = (seenByPost.get(baseKey) ?? 0) + 1;
    seenByPost.set(baseKey, next);

    sectionEntries.push({
      section,
      key: `${baseKey}-${next}`,
    });
  }

  const entriesByDate = new Map<string, RenderableSectionEntry[]>();
  for (const entry of sectionEntries) {
    const entries = entriesByDate.get(entry.section.tournamentDate) ?? [];
    entries.push(entry);
    entriesByDate.set(entry.section.tournamentDate, entries);
  }

  const tournamentDays: RenderableTournamentDay[] = Array.from(
    entriesByDate.entries(),
  ).map(([tournamentDate, entries], index) => ({
    tournamentDate,
    dayNumber: index + 1,
    anchorId: getTournamentDayAnchorId(tournamentDate),
    key: `day-${tournamentDate}-${index + 1}`,
    entries,
    posts: getUniquePostsForDay(entries),
  }));

  const hasMultipleDays = tournamentDays.length > 1;
  const totalReleaseSections = sections.reduce(
    (total, section) => total + countReleaseSections(section.mdx),
    0,
  );
  const nextRainbowColour = createNextRainbowColour(totalReleaseSections);

  function RainbowReleaseSection(props: ReleaseSectionProps) {
    return <ReleaseSection {...props} rainbowColour={nextRainbowColour()} />;
  }

  return (
    <div className="space-y-10">
      {hasMultipleDays ? (
        <div className="flex flex-wrap gap-3 text-sm">
          {tournamentDays.map((day) => (
            <Link
              key={`${day.key}-jump`}
              href={`#${day.anchorId}`}
              className="link-blue"
            >
              {`Jump to ${fmtDate(day.tournamentDate)} (Day ${day.dayNumber})`}
            </Link>
          ))}
        </div>
      ) : null}

      {tournamentDays.map((day) => (
        <section key={day.key} id={day.anchorId} className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold leading-tight">
            {fmtDate(day.tournamentDate)}: Day {day.dayNumber}{" "}
            <OriginalPostLinks posts={day.posts} />
          </h2>
          <div className="space-y-8">
            {day.entries.map(({ section, key }) => (
              <ChronicleSectionMdxRenderer
                key={key}
                code={section.code}
                postDate={section.postDate}
                components={{ ReleaseSection: RainbowReleaseSection }}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
