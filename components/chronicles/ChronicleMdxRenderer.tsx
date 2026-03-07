import type { ComponentProps } from "react";

import ReleaseSection from "@/components/mdx/ReleaseSection";
import { MdxRenderer } from "@/components/mdx-renderer";
import {
  ReleaseSectionColoursProvider,
  useNextRainbowColour,
} from "@/components/providers/ReleaseSectionColoursProvider";

type ChronicleMdxRendererProps = {
  code: string;
  source: string;
};

const countReleaseSections = (source: string): number =>
  source.match(/<ReleaseSection\b/g)?.length ?? 0;

type ReleaseSectionProps = ComponentProps<typeof ReleaseSection>;

function RainbowReleaseSection(props: ReleaseSectionProps) {
  const rainbowColour = useNextRainbowColour();
  return <ReleaseSection {...props} rainbowColour={rainbowColour} />;
}

/**
 * Chronicle-specific MDX wrapper that enables per-page rainbow assignment for
 * ReleaseSection blocks without changing other MDX component behavior.
 */
export function ChronicleMdxRenderer({ code, source }: ChronicleMdxRendererProps) {
  const totalSections = countReleaseSections(source);

  return (
    <ReleaseSectionColoursProvider totalSections={totalSections}>
      <MdxRenderer code={code} components={{ ReleaseSection: RainbowReleaseSection }} />
    </ReleaseSectionColoursProvider>
  );
}
