import type { Route } from "next";
import Link from "next/link";
import { getKnownTagHref } from "@/lib/tags";

export type PersonTagProps = {
  tag: string;
  displayName?: string;
  href?: string;
};

/**
 * Highlights a person or concept in MDX and implicitly tags the chronicle.
 */
export default function PersonTag({ displayName, href, tag }: PersonTagProps) {
  const resolvedHref = href ?? getKnownTagHref(tag);

  return (
    <Link
      href={resolvedHref as Route}
      className="font-bold italic !text-[var(--person-tag-color,var(--blue))] !no-underline hover:!bg-[var(--person-tag-hover-bg,var(--blue))] hover:!text-[var(--person-tag-hover-color,var(--white))] hover:!no-underline"
      data-person-tag={tag}
      prefetch={false}
    >
      {displayName ?? tag}
    </Link>
  );
}
