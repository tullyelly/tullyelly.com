import Link from "next/link";
import type { ComponentProps } from "react";

import ReleaseSection from "@/components/mdx/ReleaseSection";
import { MdxRenderer } from "@/components/mdx-renderer";
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
  anchorId: string;
  key: string;
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
    const baseKey = `${section.postSlug}-${section.postDate}-${section.postUrl}`;
    const next = (seenByPost.get(baseKey) ?? 0) + 1;
    seenByPost.set(baseKey, next);

    sectionEntries.push({
      section,
      anchorId: `section-${section.postSlug}-${next}`,
      key: `${baseKey}-${next}`,
    });
  }

  const hasMultipleSections = compiledSections.length > 1;
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
      {hasMultipleSections ? (
        <div className="flex flex-wrap gap-3 text-sm">
          {sectionEntries.map(({ section, anchorId, key }, index) => (
            <Link
              key={`${key}-jump`}
              href={`#${anchorId}`}
              className="link-blue"
            >
              {`Jump to ${fmtDate(section.postDate)} (Day ${index + 1})`}
            </Link>
          ))}
        </div>
      ) : null}

      {sectionEntries.map(({ section, anchorId, key }, index) => (
        <section key={key} id={anchorId} className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold leading-tight">
            {fmtDate(section.postDate)}: Day {index + 1}{" "}
            <Link href={section.postUrl} className="link-blue text-base">
              (original post)
            </Link>
          </h2>
          <MdxRenderer
            code={section.code}
            components={{ ReleaseSection: RainbowReleaseSection }}
          />
        </section>
      ))}
    </div>
  );
}
