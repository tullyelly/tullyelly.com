import type ReleaseSection from "@/components/mdx/ReleaseSection";

declare module "mdx/types" {
  interface MDXComponents {
    ReleaseSection: typeof ReleaseSection;
  }
}
