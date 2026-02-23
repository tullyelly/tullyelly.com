import Link from "next/link";

import { MdxRenderer } from "@/components/mdx-renderer";
import { fmtDate } from "@/lib/datetime";
import { compileMdxToCode } from "@/lib/mdx/compile";
import type { TableSchemaSection } from "@/lib/table-schema";

type TableSchemaSectionsProps = {
  sections: TableSchemaSection[];
};

type RenderableSection = TableSchemaSection & { code: string };
type RenderableSectionEntry = {
  section: RenderableSection;
  anchorId: string;
  key: string;
};

const DIVIDER_PROP_PATTERN = /\sdivider\s*=\s*(\{[^}]*\}|"[^"]*"|'[^']*')/;

const forceReleaseSectionDividerOff = (source: string): string =>
  source.replace(/<ReleaseSection\b([^>]*)>/g, (_match, attrs: string) => {
    const updatedAttrs = DIVIDER_PROP_PATTERN.test(attrs)
      ? attrs.replace(DIVIDER_PROP_PATTERN, " divider={false}")
      : `${attrs} divider={false}`;

    return `<ReleaseSection${updatedAttrs}>`;
  });

export default async function TableSchemaSections({
  sections,
}: TableSchemaSectionsProps) {
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
      anchorId: `visit-${section.postSlug}-${next}`,
      key: `${baseKey}-${next}`,
    });
  }

  const hasMultipleSections = compiledSections.length > 1;

  return (
    <div className="space-y-10">
      {hasMultipleSections ? (
        <div className="flex flex-wrap gap-3 text-sm">
          {sectionEntries.map(({ anchorId, key }, index) => (
            <Link
              key={`${key}-jump`}
              href={`#${anchorId}`}
              className="link-blue"
            >
              {`Jump to Visit ${index + 1}`}
            </Link>
          ))}
        </div>
      ) : null}

      {sectionEntries.map(({ section, anchorId, key }, index) => (
        <section key={key} id={anchorId} className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold leading-tight">
            {fmtDate(section.postDate)}: Visit {index + 1}{" "}
            <Link href={section.postUrl} className="link-blue text-base">
              (original post)
            </Link>
          </h2>
          <MdxRenderer code={section.code} />
        </section>
      ))}
    </div>
  );
}
