import * as React from "react";
import Image from "next/image";
import type { MDXComponents } from "mdx/types";
import LoopedGIF from "@/components/LoopedGIF";
import SmartLink from "@/components/mdx/SmartLink";
import ReleaseSection from "@/components/mdx/ReleaseSection";
import YouTubeMusicPlaylist from "@/components/mdx/YouTubeMusicPlaylist";
import { ScrollAmendment } from "@/components/scrolls/ScrollAmendment";
import { XEmbed } from "@/components/Tweet";
import { cn } from "@/lib/utils";

const bodyText =
  "text-[16px] md:text-[18px] leading-relaxed text-muted-foreground";
const headingBase = "font-semibold leading-snug text-ink";

type CustomMDXComponents = MDXComponents & {
  ReleaseSection: typeof ReleaseSection;
  ScrollAmendment: typeof ScrollAmendment;
  YouTubeMusicPlaylist: typeof YouTubeMusicPlaylist;
};

const defaultComponents = {
  img: ({
    className,
    alt,
    width,
    height,
    ...rest
  }: React.ComponentProps<typeof Image>) => (
    <Image
      alt={alt ?? ""}
      width={width ?? 1200}
      height={height ?? 630}
      className={cn("rounded-xl shadow-sm", className)}
      {...rest}
    />
  ),
  p: ({ className, ...props }: React.ComponentPropsWithoutRef<"p">) => (
    <p
      className={cn(
        bodyText,
        "mt-4 first:mt-0 last:mb-0",
        "[li_&]:mt-0 [li_&+p]:mt-0",
        "[li_&]:inline [li_&+p]:inline",
        "[li_&+p]:before:content-['\\00A0;\\00A0']",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: React.ComponentPropsWithoutRef<"h2">) => (
    <h2
      className={cn(
        headingBase,
        "mt-10 text-2xl md:text-3xl",
        "scroll-mt-24",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: React.ComponentPropsWithoutRef<"h3">) => (
    <h3
      className={cn(
        headingBase,
        "mt-8 text-xl md:text-2xl",
        "scroll-mt-24",
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }: React.ComponentPropsWithoutRef<"ul">) => (
    <ul
      className={cn(
        bodyText,
        "mt-4 list-disc list-outside space-y-2 pl-6 marker:text-[var(--blue)]",
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }: React.ComponentPropsWithoutRef<"li">) => (
    <li
      className={cn(
        "leading-relaxed",
        "[&>p:first-child]:mt-0 [&>p:last-child]:mb-0",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: React.ComponentPropsWithoutRef<"ol">) => (
    <ol
      className={cn(
        bodyText,
        "mt-4 list-decimal space-y-2 pl-5 marker:text-[var(--blue)]",
        className,
      )}
      {...props}
    />
  ),
  blockquote: ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className={cn(
        bodyText,
        "mt-6 border-l-4 border-[var(--blue)] pl-4 italic",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }: React.ComponentPropsWithoutRef<"hr">) => (
    <hr
      className={cn(
        "my-10 h-[4px] w-full rounded border-0 bg-[var(--blue)]",
        className,
      )}
      {...props}
    />
  ),
} satisfies MDXComponents;

export const mdxComponents: CustomMDXComponents = {
  ...defaultComponents,
  a: SmartLink, // override default link
  XEmbed,
  LoopedGIF,
  ReleaseSection,
  ScrollAmendment,
  YouTubeMusicPlaylist,
};

export function useMDXComponents(
  components: MDXComponents,
): CustomMDXComponents {
  return {
    ...mdxComponents,
    ...components,
  };
}
