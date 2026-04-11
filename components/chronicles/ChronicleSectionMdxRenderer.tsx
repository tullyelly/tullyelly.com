import type { MDXComponents } from "mdx/types";

import TcdbSnapshot, {
  type TcdbSnapshotProps,
} from "@/components/mdx/TcdbSnapshot";
import { MdxRenderer } from "@/components/mdx-renderer";

type ChronicleSectionMdxRendererProps = {
  code: string;
  postDate: string;
  components?: MDXComponents;
};

type BoundTcdbSnapshotProps = Pick<TcdbSnapshotProps, "tag">;

export function ChronicleSectionMdxRenderer({
  code,
  postDate,
  components,
}: ChronicleSectionMdxRendererProps) {
  function BoundTcdbSnapshot({ tag }: BoundTcdbSnapshotProps) {
    return <TcdbSnapshot tag={tag} snapshotDate={postDate} />;
  }

  return (
    <MdxRenderer
      code={code}
      components={{
        ...(components ?? {}),
        TcdbSnapshot: BoundTcdbSnapshot,
      }}
    />
  );
}
