import type { CodePanel } from "@/components/mdx/code-panel";
import type ReleaseSection from "@/components/mdx/ReleaseSection";
import type SetCollector from "@/components/mdx/SetCollector";
import type { SetCollectorProps } from "@/components/mdx/SetCollector";
import type YouTubeMusicPlaylist from "@/components/mdx/YouTubeMusicPlaylist";
import type { YouTubeMusicPlaylistProps } from "@/components/mdx/YouTubeMusicPlaylist";
import type YouTubeVideo from "@/components/mdx/YouTubeVideo";
import type { YouTubeVideoProps } from "@/components/mdx/YouTubeVideo";

declare module "mdx/types" {
  interface MDXComponents {
    CodePanel: typeof CodePanel;
    ReleaseSection: typeof ReleaseSection;
    SetCollector: (props: SetCollectorProps) => ReturnType<typeof SetCollector>;
    YouTubeMusicPlaylist: (
      props: YouTubeMusicPlaylistProps,
    ) => ReturnType<typeof YouTubeMusicPlaylist>;
    YouTubeVideo: (props: YouTubeVideoProps) => ReturnType<typeof YouTubeVideo>;
  }
}
