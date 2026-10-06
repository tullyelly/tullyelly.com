"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  normalizeTagSlug,
  resolveTagHref,
  type TagLinkMetadata,
} from "@/lib/tags";

const TagMetadataContext = createContext<Record<string, TagLinkMetadata>>({});

export function TagMetadataProvider({
  metadata,
  children,
}: {
  metadata: Record<string, TagLinkMetadata>;
  children: ReactNode;
}) {
  return (
    <TagMetadataContext.Provider value={metadata}>
      {children}
    </TagMetadataContext.Provider>
  );
}

export type TagLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  tag: string;
  metadata?: TagLinkMetadata;
};

/** All tag references share this contract, including plain text for disabled tags. */
export default function TagLink({
  tag,
  metadata,
  children,
  className = "underline hover:no-underline text-primary",
  ...props
}: TagLinkProps) {
  const snapshot = useContext(TagMetadataContext);
  const href = resolveTagHref(tag, metadata ?? snapshot[normalizeTagSlug(tag)]);
  if (!href) {
    // Navigation-only attributes must not leak onto the non-clickable label.
    const {
      prefetch,
      replace,
      scroll,
      shallow,
      locale,
      onNavigate,
      ...spanProps
    } = props;
    void prefetch;
    void replace;
    void scroll;
    void shallow;
    void locale;
    void onNavigate;
    return (
      <span {...spanProps} className={className}>
        {children}
      </span>
    );
  }
  return (
    <Link
      {...props}
      className={className}
      href={href}
      prefetch={props.prefetch ?? false}
    >
      {children}
    </Link>
  );
}
