import TagLink from "@/components/tags/TagLink";
import type { TagLinkMetadata } from "@/lib/tags";

export type PersonTagProps = {
  tag: string;
  displayName?: string;
  /** @deprecated Authored destinations do not override dojo.tags.href. */
  href?: string;
  metadata?: TagLinkMetadata;
};

/**
 * Highlights a person or concept in MDX and implicitly tags the chronicle.
 */
export default function PersonTag({
  displayName,
  metadata,
  tag,
}: PersonTagProps) {
  return (
    <TagLink
      tag={tag}
      metadata={metadata}
      className="font-bold italic !text-[var(--person-tag-color,var(--blue))] !no-underline hover:!bg-[var(--person-tag-hover-bg,var(--blue))] hover:!text-[var(--person-tag-hover-color,var(--white))] hover:!no-underline"
      data-person-tag={tag}
      prefetch={false}
    >
      {displayName ?? tag}
    </TagLink>
  );
}
