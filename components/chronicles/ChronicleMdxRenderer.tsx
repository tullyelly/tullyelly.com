import type { ComponentProps } from "react";

import ReleaseSection from "@/components/mdx/ReleaseSection";
import { MdxRenderer } from "@/components/mdx-renderer";
import { createNextRainbowColour } from "@/lib/release-section-colours";

type ChronicleMdxRendererProps = {
  code: string;
  source: string;
};

const countReleaseSections = (source: string): number =>
  source.match(/<ReleaseSection\b/g)?.length ?? 0;

type ReleaseSectionProps = ComponentProps<typeof ReleaseSection>;

/**
 * Chronicle-specific MDX wrapper that enables per-page rainbow assignment for
 * ReleaseSection blocks without changing other MDX component behavior.
 */
export function ChronicleMdxRenderer({ code, source }: ChronicleMdxRendererProps) {
  const totalSections = countReleaseSections(source);
  const nextRainbowColour = createNextRainbowColour(totalSections);

  function RainbowReleaseSection(props: ReleaseSectionProps) {
    return <ReleaseSection {...props} rainbowColour={nextRainbowColour()} />;
  }

  return (
    <MdxRenderer
      code={code}
      components={{ ReleaseSection: RainbowReleaseSection }}
    />
  );
}
