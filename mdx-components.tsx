import * as React from "react";
import Image from "next/image";
import type { MDXComponents } from "mdx/types";
import { cn } from "@/lib/utils";

const bodyText =
  "text-[16px] md:text-[18px] leading-relaxed text-muted-foreground";
const headingBase = "font-semibold leading-snug text-ink";

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
      className={cn(bodyText, "mt-4 first:mt-0 last:mb-0", className)}
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
        "mt-4 list-disc space-y-2 pl-5 marker:text-[var(--blue)]",
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

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ...components,
  };
}

export const mdxComponents: MDXComponents = defaultComponents;
