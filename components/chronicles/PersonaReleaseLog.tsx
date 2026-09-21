import Link from "next/link";
import type { ComponentProps } from "react";

import { ChronicleSectionMdxRenderer } from "@/components/chronicles/ChronicleSectionMdxRenderer";
import PersonTag from "@/components/mdx/PersonTag";
import ReleaseSection from "@/components/mdx/ReleaseSection";
import YouTubeVideo from "@/components/mdx/YouTubeVideo";
import type { AlterEgoReleaseEntry } from "@/lib/alter-ego-release-content";
import { fmtDate } from "@/lib/datetime";
import { compileMdxToCode } from "@/lib/mdx/compile";
import { getOriginalReleaseSectionColour } from "@/lib/release-section-colours";
import { normalizeTagSlug } from "@/lib/tags";
import type { TagMetadata } from "@/lib/tags-server";
import { getReleaseSectionHref } from "@/lib/release-section-anchor";
import { resolveIdentityHref } from "@/lib/identity";

type ReleaseProps = ComponentProps<typeof ReleaseSection>;
type PersonTagProps = ComponentProps<typeof PersonTag>;
type YouTubeVideoProps = ComponentProps<typeof YouTubeVideo>;

export async function PersonaReleaseLogEntry({
  entry,
  tagMetadataBySlug,
}: {
  entry: AlterEgoReleaseEntry;
  tagMetadataBySlug: ReadonlyMap<string, TagMetadata>;
}) {
  const code = await compileMdxToCode(entry.mdx);
  const rainbowColour = getOriginalReleaseSectionColour(
    entry.sectionOrdinal,
    entry.totalSections,
    entry.sourceColourKey,
  );

  function OriginalReleaseSection(props: ReleaseProps) {
    return <ReleaseSection {...props} rainbowColour={rainbowColour} />;
  }

  function RoutedPersonTag(props: PersonTagProps) {
    if (props.href) return <PersonTag {...props} />;
    return (
      <PersonTag
        {...props}
        href={(() => {
          const metadata = tagMetadataBySlug.get(normalizeTagSlug(props.tag));
          if (!metadata) return undefined;
          if (
            entry.alterEgo === "cardattack" ||
            entry.alterEgo === "theabbott" ||
            entry.alterEgo === "unclejimmy"
          ) {
            return (
              resolveIdentityHref(
                metadata.meta,
                entry.alterEgo,
                metadata.href,
              ) ?? undefined
            );
          }
          return metadata.href ?? undefined;
        })()}
      />
    );
  }

  function TaggedYouTubeVideo(props: YouTubeVideoProps) {
    if (!props.tag) return <YouTubeVideo {...props} />;
    const metadata = tagMetadataBySlug.get(normalizeTagSlug(props.tag));
    return (
      <YouTubeVideo
        {...props}
        displayName={metadata?.displayName}
        href={metadata?.href ?? undefined}
      />
    );
  }

  return (
    <article className="space-y-4">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border/70 pb-3">
        <time
          className="text-sm text-muted-foreground"
          dateTime={entry.postDate}
        >
          {fmtDate(entry.postDate)}
        </time>
        <h2 className="font-semibold">
          <Link
            href={getReleaseSectionHref(entry.postUrl, entry.sectionOrdinal)}
            className="link-blue"
          >
            {entry.postTitle}
          </Link>
        </h2>
        <span className="text-xs text-muted-foreground">
          section {entry.sectionOrdinal} of {entry.totalSections}
        </span>
      </header>
      <ChronicleSectionMdxRenderer
        code={code}
        chronicleSlug={entry.postSlug}
        postDate={entry.postDate}
        tagMetadataBySlug={tagMetadataBySlug}
        components={{
          PersonTag: RoutedPersonTag,
          ReleaseSection: OriginalReleaseSection,
          YouTubeVideo: TaggedYouTubeVideo,
        }}
      />
    </article>
  );
}
