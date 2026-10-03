import type { ComponentProps } from "react";
import type { MDXComponents } from "mdx/types";

import ChronicleImage, {
  type ChronicleImageProps,
} from "@/components/chronicles/ChronicleImage";
import ClanSnapshot, {
  type ClanSnapshotProps,
} from "@/components/mdx/ClanSnapshot";
import SetCollector, {
  type SetCollectorProps,
} from "@/components/mdx/SetCollector";
import TcdbSnapshot, {
  type TcdbSnapshotProps,
} from "@/components/mdx/TcdbSnapshot";
import FolderImageCarousel from "@/components/media/FolderImageCarousel.server";
import { resolveChronicleCarouselFolder } from "@/lib/images/resolve-chronicle-image-path";
import { MdxRenderer } from "@/components/mdx-renderer";
import { normalizeTagSlug } from "@/lib/tags";
import type { TagMetadata } from "@/lib/tags-server";

type ChronicleSectionMdxRendererProps = {
  code: string;
  chronicleSlug?: string;
  postDate: string;
  components?: MDXComponents;
  tagMetadataBySlug?: ReadonlyMap<string, TagMetadata>;
};

type ChronicleCarouselProps = Omit<
  ComponentProps<typeof FolderImageCarousel>,
  "folder"
> & { folder?: string };

type BoundSetCollectorProps = Pick<SetCollectorProps, "set">;
type BoundClanSnapshotProps = Pick<ClanSnapshotProps, "href" | "tag" | "sport">;
type BoundTcdbSnapshotProps = Pick<TcdbSnapshotProps, "tag">;

export function ChronicleSectionMdxRenderer({
  code,
  chronicleSlug,
  postDate,
  components,
  tagMetadataBySlug,
}: ChronicleSectionMdxRendererProps) {
  function BoundChronicleImage(
    props: Omit<ChronicleImageProps, "chronicleSlug">,
  ) {
    if (!chronicleSlug) return null;
    return <ChronicleImage {...props} chronicleSlug={chronicleSlug} />;
  }

  function ChronicleFolderImageCarousel({
    folder,
    ...props
  }: ChronicleCarouselProps) {
    if (!chronicleSlug) return null;
    return (
      <FolderImageCarousel
        {...props}
        folder={resolveChronicleCarouselFolder(chronicleSlug, folder)}
      />
    );
  }

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
        ...(chronicleSlug
          ? { FolderImageCarousel: ChronicleFolderImageCarousel }
          : {}),
        ...(components ?? {}),
        ...(chronicleSlug ? { img: BoundChronicleImage } : {}),
        ClanSnapshot: BoundClanSnapshot,
        SetCollector: BoundSetCollector,
        TcdbSnapshot: BoundTcdbSnapshot,
      }}
    />
  );
}
