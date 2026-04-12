import type { ComponentProps } from "react";

import { ChronicleSectionMdxRenderer } from "@/components/chronicles/ChronicleSectionMdxRenderer";
import ReleaseSection from "@/components/mdx/ReleaseSection";
import { createNextRainbowColour } from "@/lib/release-section-colours";

type ChronicleMdxRendererProps = {
  code: string;
  postDate: string;
  source: string;
};

const countReleaseSections = (source: string): number =>
  source.match(/<ReleaseSection\b/g)?.length ?? 0;

type ReleaseSectionProps = ComponentProps<typeof ReleaseSection>;

/**
 * Chronicle-specific MDX wrapper that enables per-page rainbow assignment for
 * ReleaseSection blocks and date-bound MDX helpers without changing other MDX
 * component behavior.
 */
export function ChronicleMdxRenderer({
  code,
  postDate,
  source,
}: ChronicleMdxRendererProps) {
  const totalSections = countReleaseSections(source);
  const nextRainbowColour = createNextRainbowColour(totalSections);

  function RainbowReleaseSection(props: ReleaseSectionProps) {
    return <ReleaseSection {...props} rainbowColour={nextRainbowColour()} />;
  }

  return (
    <ChronicleSectionMdxRenderer
      code={code}
      postDate={postDate}
      components={{
        ReleaseSection: RainbowReleaseSection,
      }}
    />
  );
}
