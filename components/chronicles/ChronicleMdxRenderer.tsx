import type { ComponentProps } from "react";

import { ChronicleSectionMdxRenderer } from "@/components/chronicles/ChronicleSectionMdxRenderer";
import PersonTag from "@/components/mdx/PersonTag";
import ReleaseSection from "@/components/mdx/ReleaseSection";
import YouTubeVideo from "@/components/mdx/YouTubeVideo";
import { createNextOriginalReleaseSection } from "@/lib/release-section-colours";
import type { TagMetadata } from "@/lib/tags-server";
import { normalizeTagSlug } from "@/lib/tags";
import { type IdentityContext } from "@/lib/identity";

type ChronicleMdxRendererProps = {
  code: string;
  slug: string;
  postDate: string;
  source: string;
  tagMetadataBySlug?: ReadonlyMap<string, TagMetadata>;
  identityContext?: IdentityContext;
};

const countReleaseSections = (source: string): number =>
  source.match(/<ReleaseSection\b/g)?.length ?? 0;

type ReleaseSectionProps = ComponentProps<typeof ReleaseSection>;
type PersonTagProps = ComponentProps<typeof PersonTag>;
type YouTubeVideoProps = ComponentProps<typeof YouTubeVideo>;
/**
 * Chronicle-specific MDX wrapper that enables per-page rainbow assignment for
 * ReleaseSection blocks and date-bound MDX helpers without changing other MDX
 * component behavior.
 */
export function ChronicleMdxRenderer({
  code,
  slug,
  postDate,
  source,
  tagMetadataBySlug,
}: ChronicleMdxRendererProps) {
  const totalSections = countReleaseSections(source);
  const nextReleaseSection = createNextOriginalReleaseSection(
    totalSections,
    source,
  );

  function RainbowReleaseSection(props: ReleaseSectionProps) {
    const { rainbowColour, sectionOrdinal } = nextReleaseSection();
    return (
      <ReleaseSection
        {...props}
        rainbowColour={rainbowColour}
        sectionOrdinal={sectionOrdinal}
      />
    );
  }

  function RoutedPersonTag(props: PersonTagProps) {
    const metadata = tagMetadataBySlug?.get(normalizeTagSlug(props.tag));
    return <PersonTag {...props} metadata={metadata} />;
  }

  function TaggedYouTubeVideo(props: YouTubeVideoProps) {
    if (!props.tag) return <YouTubeVideo {...props} />;

    const metadata = tagMetadataBySlug?.get(normalizeTagSlug(props.tag));
    return (
      <YouTubeVideo
        {...props}
        displayName={metadata?.displayName}
        metadata={metadata}
      />
    );
  }

  return (
    <ChronicleSectionMdxRenderer
      code={code}
      chronicleSlug={slug}
      postDate={postDate}
      tagMetadataBySlug={tagMetadataBySlug}
      components={{
        PersonTag: RoutedPersonTag,
        ReleaseSection: RainbowReleaseSection,
        YouTubeVideo: TaggedYouTubeVideo,
      }}
    />
  );
}
