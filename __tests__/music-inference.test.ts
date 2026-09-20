import {
  inferChronicleMusicUsagesFromTree,
  type MdxNode,
} from "@/lib/alterEgo";

const attr = (name: string, value: string) => ({
  type: "mdxJsxAttribute",
  name,
  value,
});

describe("Chronicle music inference", () => {
  test("captures videos and playlists with their surrounding alter ego", () => {
    const tree: MdxNode = {
      children: [
        {
          type: "mdxJsxFlowElement",
          name: "ReleaseSection",
          attributes: [attr("alterEgo", "theabbott")],
          children: [
            {
              type: "mdxJsxFlowElement",
              name: "YouTubeVideo",
              attributes: [
                attr("id", "video-1"),
                attr("artist", "Run the Jewels"),
                attr("song", "Legend Has It"),
                attr("album", "RTJ3"),
              ],
            },
            {
              type: "mdxJsxFlowElement",
              name: "YouTubeMusicPlaylist",
              attributes: [
                attr("url", "https://music.youtube.com/playlist?list=PL123"),
                attr("title", "Roadwork"),
              ],
            },
          ],
        },
      ],
    };

    expect(inferChronicleMusicUsagesFromTree(tree)).toEqual([
      {
        type: "video",
        id: "video-1",
        artist: "Run the Jewels",
        artistTag: "run-the-jewels",
        song: "Legend Has It",
        album: "RTJ3",
        alterEgo: "theabbott",
      },
      {
        type: "playlist",
        url: "https://music.youtube.com/playlist?list=PL123",
        title: "Roadwork",
        alterEgo: "theabbott",
      },
    ]);
  });
});
