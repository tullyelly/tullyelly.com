import type { ComponentProps } from "react";

import optimusImagesManifest from "@/lib/images/optimus-images-manifest.json";
import { resolveChronicleImagePath } from "@/lib/images/resolve-chronicle-image-path";
import { MdxImage } from "@/mdx-components";

const optimusImageUrls = new Set(optimusImagesManifest.urls);

export type ChronicleImageProps = ComponentProps<typeof MdxImage> & {
  chronicleSlug: string;
};

export function resolveChronicleImageSource(
  chronicleSlug: string,
  src: string,
): string | null {
  try {
    const resolved = resolveChronicleImagePath(chronicleSlug, src);
    if (!resolved || resolved.startsWith("#") || resolved.startsWith("?")) {
      return null;
    }
    if (resolved.startsWith("/images/optimus/")) {
      return optimusImageUrls.has(resolved) ? resolved : null;
    }
    return resolved;
  } catch {
    return null;
  }
}

export default function ChronicleImage({
  chronicleSlug,
  src,
  alt,
  ...props
}: ChronicleImageProps) {
  const resolvedSrc =
    typeof src === "string"
      ? resolveChronicleImageSource(chronicleSlug, src)
      : src;

  if (!resolvedSrc) {
    return (
      <span
        role="img"
        aria-label={alt || "Chronicle image unavailable"}
        className="mx-auto block w-full max-w-[520px] rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground"
      >
        Image unavailable{alt ? `: ${alt}` : ""}. Please contact the site
        administrator.
      </span>
    );
  }

  return <MdxImage {...props} alt={alt ?? ""} src={resolvedSrc} />;
}
