import type { MDXComponents } from "mdx/types";

import SetCollector, {
  type SetCollectorProps,
} from "@/components/mdx/SetCollector";
import TcdbSnapshot, {
  type TcdbSnapshotProps,
} from "@/components/mdx/TcdbSnapshot";
import { MdxRenderer } from "@/components/mdx-renderer";

type ChronicleSectionMdxRendererProps = {
  code: string;
  postDate: string;
  components?: MDXComponents;
};

type BoundSetCollectorProps = Pick<SetCollectorProps, "set">;
type BoundTcdbSnapshotProps = Pick<TcdbSnapshotProps, "tag">;

export function ChronicleSectionMdxRenderer({
  code,
  postDate,
  components,
}: ChronicleSectionMdxRendererProps) {
  function BoundSetCollector({ set }: BoundSetCollectorProps) {
    return <SetCollector set={set} snapshotDate={postDate} />;
  }

  function BoundTcdbSnapshot({ tag }: BoundTcdbSnapshotProps) {
    return <TcdbSnapshot tag={tag} snapshotDate={postDate} />;
  }

  return (
    <MdxRenderer
      code={code}
      components={{
        ...(components ?? {}),
        SetCollector: BoundSetCollector,
        TcdbSnapshot: BoundTcdbSnapshot,
      }}
    />
  );
}
