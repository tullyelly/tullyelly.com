import { createRequire } from "module";

const require = createRequire(import.meta.url);
const jiti = require("jiti")(import.meta.url, {
  alias: {
    "server-only": require.resolve("./server-only-shim.cjs"),
  },
});

const { extractPlaylistAlbums } = jiti("../lib/youtubeMusic.ts");

const mockDetail = {
  tracks: [
    {
      album: { name: "Future Nostalgia" },
      artist: { name: "Dua Lipa" },
    },
    {
      album: { title: "Discovery" },
      artist: { title: "Daft Punk" },
    },
    {
      album: "Future Nostalgia",
      artist: "Dua Lipa",
    },
    {
      album: { name: "Collab Tape" },
      artists: [{ name: "Artist One" }, { name: "Artist Two" }],
    },
    {
      album: { name: "Random Access Memories" },
      artists: [{ name: "Daft Punk" }],
    },
  ],
};

const albums = extractPlaylistAlbums(mockDetail);

console.log("Extracted albums:", albums);
