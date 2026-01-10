import * as React from "react";
import Image from "next/image";
import type { MDXComponents } from "mdx/types";
import LoopedGIF from "@/components/LoopedGIF";
import { CodePanel } from "@/components/mdx/code-panel";
import SmartLink from "@/components/mdx/SmartLink";
import ReleaseSection from "@/components/mdx/ReleaseSection";
import YouTubeMusicPlaylist from "@/components/mdx/YouTubeMusicPlaylist";
import { ScrollAmendment } from "@/components/scrolls/ScrollAmendment";
import { XEmbed } from "@/components/Tweet";
import { cn } from "@/lib/utils";

const bodyText =
  "text-[16px] md:text-[18px] leading-relaxed text-muted-foreground";
const headingBase = "font-semibold leading-snug text-ink";
const languageClassName = /language-([a-z0-9-]+)/i;
type CodeElementProps = {
  className?: string;
  children?: React.ReactNode;
  title?: string;
  "data-label"?: string;
  "data-filename"?: string;
};

function extractCodeString(children: React.ReactNode): string | null {
  if (typeof children === "string") {
    return children;
  }
  if (Array.isArray(children)) {
    const text = children.filter((child) => typeof child === "string").join("");
    return text.length > 0 ? text : null;
  }
  return null;
}

type CustomMDXComponents = MDXComponents & {
  CodePanel: typeof CodePanel;
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
        "mt-4 list-disc list-outside space-y-2 pl-6 marker:text-[color:var(--mdx-marker-color,var(--blue))]",
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
        "mt-4 list-decimal space-y-2 pl-5 marker:text-[color:var(--mdx-marker-color,var(--blue))]",
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
  pre: ({
    className,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"pre">) => {
    const codeElement =
      React.isValidElement(children) &&
      typeof children.type === "string" &&
      children.type === "code"
        ? (children as React.ReactElement<CodeElementProps>)
        : null;
    const codeString = extractCodeString(codeElement?.props?.children);
    if (!codeElement || !codeString) {
      return (
        <pre className={cn("overflow-x-auto", className)} {...props}>
          {children}
        </pre>
      );
    }

    const codeClassName =
      typeof codeElement.props?.className === "string"
        ? codeElement.props.className
        : "";
    const match = codeClassName.match(languageClassName);
    const language = match?.[1];
    const label =
      typeof codeElement.props?.["data-label"] === "string"
        ? codeElement.props["data-label"]
        : typeof codeElement.props?.["data-filename"] === "string"
          ? codeElement.props["data-filename"]
          : typeof codeElement.props?.title === "string"
            ? codeElement.props.title
            : undefined;

    return (
      <CodePanel
        code={codeString.replace(/\n$/, "")}
        language={language}
        label={label}
        className={className}
      />
    );
  },
  hr: ({
    className,
    style,
    ...props
  }: React.ComponentPropsWithoutRef<"hr">) => (
    <hr
      className={cn("my-10 h-[4px] w-full rounded border-0", className)}
      style={{
        backgroundColor: "var(--mdx-divider-color, var(--blue))",
        ...style,
      }}
      {...props}
    />
  ),
} satisfies MDXComponents;

export const mdxComponents: CustomMDXComponents = {
  ...defaultComponents,
  a: SmartLink, // override default link
  XEmbed,
  LoopedGIF,
  CodePanel,
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
