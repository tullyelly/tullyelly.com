import type ReleaseSection from "@/components/mdx/ReleaseSection";
import type YouTubeMusicPlaylist, {
  YouTubeMusicPlaylistProps,
} from "@/components/mdx/YouTubeMusicPlaylist";

declare module "mdx/types" {
  interface MDXComponents {
    ReleaseSection: typeof ReleaseSection;
    YouTubeMusicPlaylist: (
      props: YouTubeMusicPlaylistProps,
    ) => ReturnType<typeof YouTubeMusicPlaylist>;
  }
}
