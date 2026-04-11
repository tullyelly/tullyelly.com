import type { ComponentProps } from "react";

import ReleaseSection from "@/components/mdx/ReleaseSection";
import TcdbSnapshot, {
  type TcdbSnapshotProps,
} from "@/components/mdx/TcdbSnapshot";
import { MdxRenderer } from "@/components/mdx-renderer";
import { createNextRainbowColour } from "@/lib/release-section-colours";

type ChronicleMdxRendererProps = {
  code: string;
  postDate: string;
  source: string;
};

const countReleaseSections = (source: string): number =>
  source.match(/<ReleaseSection\b/g)?.length ?? 0;

type ReleaseSectionProps = ComponentProps<typeof ReleaseSection>;
type BoundTcdbSnapshotProps = Pick<TcdbSnapshotProps, "tag">;

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

  function BoundTcdbSnapshot({ tag }: BoundTcdbSnapshotProps) {
    return <TcdbSnapshot tag={tag} snapshotDate={postDate} />;
  }

  return (
    <MdxRenderer
      code={code}
      components={{
        ReleaseSection: RainbowReleaseSection,
        TcdbSnapshot: BoundTcdbSnapshot,
      }}
    />
  );
}
