import type { MDXComponents } from "mdx/types";

import ClanSnapshot, {
  type ClanSnapshotProps,
} from "@/components/mdx/ClanSnapshot";
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
type BoundClanSnapshotProps = Pick<ClanSnapshotProps, "tag" | "sport">;
type BoundTcdbSnapshotProps = Pick<TcdbSnapshotProps, "tag">;

export function ChronicleSectionMdxRenderer({
  code,
  postDate,
  components,
}: ChronicleSectionMdxRendererProps) {
  function BoundSetCollector({ set }: BoundSetCollectorProps) {
    return <SetCollector set={set} snapshotDate={postDate} />;
  }

  function BoundClanSnapshot({ tag, sport }: BoundClanSnapshotProps) {
    return <ClanSnapshot tag={tag} sport={sport} snapshotDate={postDate} />;
  }

  function BoundTcdbSnapshot({ tag }: BoundTcdbSnapshotProps) {
    return <TcdbSnapshot tag={tag} snapshotDate={postDate} />;
  }

  return (
    <MdxRenderer
      code={code}
      components={{
        ...(components ?? {}),
        ClanSnapshot: BoundClanSnapshot,
        SetCollector: BoundSetCollector,
        TcdbSnapshot: BoundTcdbSnapshot,
      }}
    />
  );
}
