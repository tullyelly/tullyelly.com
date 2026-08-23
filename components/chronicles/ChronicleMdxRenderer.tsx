import type { ComponentProps } from "react";

import { ChronicleSectionMdxRenderer } from "@/components/chronicles/ChronicleSectionMdxRenderer";
import PersonTag from "@/components/mdx/PersonTag";
import ReleaseSection from "@/components/mdx/ReleaseSection";
import FolderImageCarousel from "@/components/media/FolderImageCarousel.server";
import {
  resolveChronicleCarouselFolder,
  resolveChronicleImagePath,
} from "@/lib/images/resolve-chronicle-image-path";
import { createNextOriginalReleaseSection } from "@/lib/release-section-colours";
import type { TagMetadata } from "@/lib/tags-server";
import { normalizeTagSlug } from "@/lib/tags";
import { MdxImage } from "@/mdx-components";

type ChronicleMdxRendererProps = {
  code: string;
  slug: string;
  postDate: string;
  source: string;
  tagMetadataBySlug?: ReadonlyMap<string, TagMetadata>;
};

const countReleaseSections = (source: string): number =>
  source.match(/<ReleaseSection\b/g)?.length ?? 0;

type ReleaseSectionProps = ComponentProps<typeof ReleaseSection>;
type PersonTagProps = ComponentProps<typeof PersonTag>;
type ChronicleImageProps = ComponentProps<typeof MdxImage>;
type ChronicleCarouselProps = Omit<
  ComponentProps<typeof FolderImageCarousel>,
  "folder"
> & {
  folder?: string;
};

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
    if (props.href) return <PersonTag {...props} />;

    const metadata = tagMetadataBySlug?.get(normalizeTagSlug(props.tag));
    return <PersonTag {...props} href={metadata?.href ?? undefined} />;
  }

  function ChronicleImage({ src, ...props }: ChronicleImageProps) {
    const resolvedSrc =
      typeof src === "string" ? resolveChronicleImagePath(slug, src) : src;
    return <MdxImage {...props} src={resolvedSrc} />;
  }

  function ChronicleFolderImageCarousel({
    folder,
    ...props
  }: ChronicleCarouselProps) {
    return (
      <FolderImageCarousel
        {...props}
        folder={resolveChronicleCarouselFolder(slug, folder)}
      />
    );
  }

  return (
    <ChronicleSectionMdxRenderer
      code={code}
      postDate={postDate}
      tagMetadataBySlug={tagMetadataBySlug}
      components={{
        img: ChronicleImage,
        FolderImageCarousel: ChronicleFolderImageCarousel,
        PersonTag: RoutedPersonTag,
        ReleaseSection: RainbowReleaseSection,
      }}
    />
  );
}
