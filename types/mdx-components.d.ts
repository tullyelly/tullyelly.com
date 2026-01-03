import type ReleaseSection from "@/components/mdx/ReleaseSection";
import type YouTubeMusicPlaylist from "@/components/mdx/YouTubeMusicPlaylist";

declare module "mdx/types" {
  interface MDXComponents {
    ReleaseSection: typeof ReleaseSection;
    YouTubeMusicPlaylist: typeof YouTubeMusicPlaylist;
  }
}
