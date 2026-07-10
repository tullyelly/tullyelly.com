import type { ComponentProps } from "react";

import { ChronicleSectionMdxRenderer } from "@/components/chronicles/ChronicleSectionMdxRenderer";
import PersonTag from "@/components/mdx/PersonTag";
import ReleaseSection from "@/components/mdx/ReleaseSection";
import { createNextOriginalReleaseSectionColour } from "@/lib/release-section-colours";
import type { TagMetadata } from "@/lib/tags-server";
import { normalizeTagSlug } from "@/lib/tags";

type ChronicleMdxRendererProps = {
  code: string;
  postDate: string;
  source: string;
  tagMetadataBySlug?: ReadonlyMap<string, TagMetadata>;
};

const countReleaseSections = (source: string): number =>
  source.match(/<ReleaseSection\b/g)?.length ?? 0;

type ReleaseSectionProps = ComponentProps<typeof ReleaseSection>;
type PersonTagProps = ComponentProps<typeof PersonTag>;

/**
 * Chronicle-specific MDX wrapper that enables per-page rainbow assignment for
 * ReleaseSection blocks and date-bound MDX helpers without changing other MDX
 * component behavior.
 */
export function ChronicleMdxRenderer({
  code,
  postDate,
  source,
  tagMetadataBySlug,
}: ChronicleMdxRendererProps) {
  const totalSections = countReleaseSections(source);
  const nextRainbowColour = createNextOriginalReleaseSectionColour(totalSections, source);

  function RainbowReleaseSection(props: ReleaseSectionProps) {
    return <ReleaseSection {...props} rainbowColour={nextRainbowColour()} />;
  }

  function RoutedPersonTag(props: PersonTagProps) {
    if (props.href) return <PersonTag {...props} />;

    const metadata = tagMetadataBySlug?.get(normalizeTagSlug(props.tag));
    return <PersonTag {...props} href={metadata?.href ?? undefined} />;
  }

  return (
    <ChronicleSectionMdxRenderer
      code={code}
      postDate={postDate}
      tagMetadataBySlug={tagMetadataBySlug}
      components={{
        PersonTag: RoutedPersonTag,
        ReleaseSection: RainbowReleaseSection,
      }}
    />
  );
}
