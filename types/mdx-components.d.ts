import type { CodePanel } from "@/components/mdx/code-panel";
import type ReleaseSection from "@/components/mdx/ReleaseSection";
import type YouTubeMusicPlaylist, {
  YouTubeMusicPlaylistProps,
} from "@/components/mdx/YouTubeMusicPlaylist";
import type YouTubeVideo from "@/components/mdx/YouTubeVideo";

declare module "mdx/types" {
  interface MDXComponents {
    CodePanel: typeof CodePanel;
    ReleaseSection: typeof ReleaseSection;
    YouTubeMusicPlaylist: (
      props: YouTubeMusicPlaylistProps,
    ) => ReturnType<typeof YouTubeMusicPlaylist>;
    YouTubeVideo: (props: {
      id: string;
      orientation?: "landscape" | "portrait";
      playlist?: string;
      loop?: boolean;
      className?: string;
    }) => ReturnType<typeof YouTubeVideo>;
  }
}
