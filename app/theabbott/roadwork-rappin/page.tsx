import YouTubeVideo from "@/components/mdx/YouTubeVideo";
import LegacyPostDate from "@/components/layout/LegacyPostDate";
import ArtistAlbumGrid, {
  type ArtistAlbum,
} from "@/components/theabbott/ArtistAlbumGrid";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

export const metadata = {
  title: "Roadwork Rappin’ by Aesop Rock | tullyelly",
  description:
    "Explore 'Roadwork Rappin’' by Aesop Rock;  a defining track in indie hip-hop and underground rap. This page features the music video, context, and supporting content for fans of hip-hop, rap, and experimental lyricism.",
  alternates: { canonical: canonicalUrl("theabbott/roadwork-rappin") },
  openGraph: {
    title: "Aesop Rock; Roadwork Rappin’",
    description:
      "Hip-hop, rap, and indie music fans can dive into Aesop Rock’s 'Roadwork Rappin’' with video and context on this page.",
    url: "/theabbott/roadwork-rappin",
    images: [
      {
        url: "/images/optimus/roadwork rappin.webp",
        alt: "Roadwork Rappin’ cover art",
      },
    ],
    type: "music.song",
    music: {
      musician: "Aesop Rock",
      genre: ["Hip-Hop", "Rap", "Indie Hip-Hop", "Underground Rap"],
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "Aesop Rock; Roadwork Rappin’",
    description:
      "Aesop Rock’s Roadwork Rappin’. Build a road where there isn't a road!",
    images: [
      {
        url: "/images/optimus/roadwork rappin.webp",
        alt: "Roadwork Rappin’ cover art",
      },
    ],
  },
};

const albums: ArtistAlbum[] = [
  {
    title: "Labor Days",
    year: 2001,
    note: "Breakthrough album, socially sharp and lyrically dense.",
  },
  {
    title: "None Shall Pass",
    year: 2007,
    note: "Critically acclaimed; balances abstract wordplay with vivid storytelling.",
  },
  {
    title: "Skelethon",
    year: 2012,
    note: "Darker, self-produced record showcasing his full creative control.",
  },
  {
    title: "The Impossible Kid",
    year: 2016,
    note: "Personal, playful, and a highly accessible entry point.",
  },
  {
    title: "Spirit World Field Guide",
    year: 2020,
    note: "Conceptual journey through a surreal, otherworldly manual.",
  },
  {
    title: "Garbology (with Blockhead)",
    year: 2021,
    note: "Return to form with a longtime collaborator.",
  },
  {
    title: "Black Hole Superette",
    year: 2024,
    note: "Latest release, expanding his signature style with fresh energy.",
  },
];

export default function Page() {
  return (
    <article className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
          Roadwork Rappin’
        </h1>
        <LegacyPostDate date="2025-08-19">August 19, 2025</LegacyPostDate>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          Welcome to my newest experiment. Please excuse any bugs or lack of
          polish. Early days.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          Parental Discretion Advised
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Expect me to be converting between 3–5 children into fans of Aesop
          Rock utilizing this song. We&rsquo;ll keep it clean, promise. 😉
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          The video will loop itself to keep them out of the almighty algorithm
          as long as possible. Long live the algorithm!
        </p>
      </section>

      <section aria-labelledby="video-title" className="space-y-3">
        <h2
          id="video-title"
          className="text-xl md:text-2xl font-semibold leading-snug"
        >
          Roadwork Rappin’ Video
        </h2>
        <YouTubeVideo
          id="jRHqjDnEFiE"
          loop
          artist="Aesop Rock"
          song="Roadwork Rappin’"
          album="Black Hole Superette"
        />
      </section>

      <section className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-xl md:text-2xl font-semibold leading-snug">
            Aesop Rock Bio
          </h2>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            Aesop Rock (Ian Bavitz) is a New York–born rapper and producer
            celebrated for his dense, surreal lyricism and lasting influence on
            underground hip-hop. What makes him truly stand out is his
            vocabulary: studies show he’s used more unique words across his
            career than any other major rapper, a linguistic range so vast it
            even rivals Shakespeare. That love of language defines his style;
            songs that unfold like puzzles, packed with imagery and ideas that
            reward repeated listens.
          </p>
        </header>

        <ArtistAlbumGrid
          albums={albums}
          classicTitle="Spirit World Field Guide"
        />
      </section>
    </article>
  );
}
