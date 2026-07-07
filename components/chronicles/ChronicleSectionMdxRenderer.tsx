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
import { normalizeTagSlug } from "@/lib/tags";
import type { TagMetadata } from "@/lib/tags-server";

type ChronicleSectionMdxRendererProps = {
  code: string;
  postDate: string;
  components?: MDXComponents;
  tagMetadataBySlug?: ReadonlyMap<string, TagMetadata>;
};

type BoundSetCollectorProps = Pick<SetCollectorProps, "set">;
type BoundClanSnapshotProps = Pick<
  ClanSnapshotProps,
  "href" | "tag" | "sport"
>;
type BoundTcdbSnapshotProps = Pick<TcdbSnapshotProps, "tag">;

export function ChronicleSectionMdxRenderer({
  code,
  postDate,
  components,
  tagMetadataBySlug,
}: ChronicleSectionMdxRendererProps) {
  function BoundSetCollector({ set }: BoundSetCollectorProps) {
    return <SetCollector set={set} snapshotDate={postDate} />;
  }

  function BoundClanSnapshot({ href, tag, sport }: BoundClanSnapshotProps) {
    const metadata = tagMetadataBySlug?.get(normalizeTagSlug(tag));
    const metadataHref =
      metadata?.hrefKind === "clan" ? (metadata.href ?? undefined) : undefined;
    const resolvedHref = href ?? metadataHref;

    return (
      <ClanSnapshot
        tag={tag}
        sport={sport}
        snapshotDate={postDate}
        {...(resolvedHref ? { href: resolvedHref } : {})}
      />
    );
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
