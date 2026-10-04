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
import { ScrollAmendment } from "@/components/scrolls/ScrollAmendment";
import { parseDateish } from "@/lib/datetime";
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

  function BoundScrollAmendment(props: ComponentProps<typeof ScrollAmendment>) {
    // Contentlayer serializes frontmatter calendar dates as ISO timestamps.
    // Anchor their date portion at noon UTC, preserving the authored day in Chicago.
    const calendarDate = postDate
      .trim()
      .match(/^(\d{4}-\d{2}-\d{2})(?:T|$)/)?.[1];
    const parsed = calendarDate ? parseDateish(calendarDate) : null;
    const parts = parsed
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Chicago",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).formatToParts(parsed)
      : [];
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((value) => value.type === type)?.value;
    const inheritedDate =
      parsed &&
      calendarDate === `${part("year")}-${part("month")}-${part("day")}`
        ? calendarDate
        : undefined;
    return (
      <ScrollAmendment {...props} date={props.date?.trim() || inheritedDate} />
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
        ScrollAmendment: BoundScrollAmendment,
        ClanSnapshot: BoundClanSnapshot,
        SetCollector: BoundSetCollector,
        TcdbSnapshot: BoundTcdbSnapshot,
      }}
    />
  );
}
