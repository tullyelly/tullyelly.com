import YouTubeVideo from "@/components/mdx/YouTubeVideo";
import LegacyPostDate from "@/components/layout/LegacyPostDate";
import ArtistAlbumGrid, {
  type ArtistAlbum,
} from "@/components/theabbott/ArtistAlbumGrid";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

export const metadata = {
  title: "Heels Have Eyes by Westside Gunn | tullyelly",
  description:
    "Explore &apos;Heels Have Eyes&apos; by Westside Gunn &mdash; a gritty yet artful entry in modern underground hip-hop. This page features the video, context, and supporting content for fans of rap and experimental lyricism.",
  alternates: { canonical: canonicalUrl("theabbott/heels-have-eyes") },
  openGraph: {
    title: "Westside Gunn &mdash; Heels Have Eyes",
    description:
      "Hip-hop and rap fans can dive into Westside Gunn&apos;s &apos;Heels Have Eyes&apos; with video and context on this page.",
    url: "/theabbott/heels-have-eyes",
    type: "music.song",
    images: [
      {
        url: "/images/optimus/HEELS HAVE EYES.webp",
        alt: "HEELS HAVE EYES cover art",
      },
    ],
    music: {
      musician: "Westside Gunn",
      genre: ["Hip-Hop", "Rap", "Underground Rap"],
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "Westside Gunn &mdash; Heels Have Eyes",
    description:
      "Westside Gunn's HEELS HAVE EYES takes over unclejimmy's playlist",
    images: [
      {
        url: "/images/optimus/HEELS HAVE EYES.webp",
        alt: "HEELS HAVE EYES cover art",
      },
    ],
  },
};

const albums: ArtistAlbum[] = [
  {
    title: "FLYGOD",
    year: 2016,
    note: "His breakout, blending raw Buffalo grit with his emerging taste for artful extravagance.",
  },
  {
    title: "Supreme Blientele",
    year: 2018,
    note: "A milestone record, full of cinematic beats and sharp, painterly verses.",
  },
  {
    title: "Pray for Paris",
    year: 2020,
    note: "A fan favorite that perfectly fuses fashion, art, and grimy rap, recorded after Gunn&apos;s trip to Paris Fashion Week.",
  },
  {
    title: "Hitler Wears Hermes 8: Sincerely, Adolf",
    year: 2021,
    note: "Grand finale to his signature series, showing his range from ruthless to reflective.",
  },
  {
    title: 'Peace "Fly" God',
    year: 2022,
    note: "A raw, minimal experiment produced in just two days, spotlighting Gunn&apos;s instinctive artistry.",
  },
  {
    title: "And Then You Pray for Me",
    year: 2023,
    note: "Intended as his retirement album, a sprawling, ornate statement piece.",
  },
  {
    title: "HEELS HAVE EYES",
    year: 2024,
    note: "Wrestling-inspired and concept-heavy, a bold continuation of his storytelling.",
  },
];

export default function Page() {
  return (
    <article className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
          Heels Have Eyes
        </h1>
        <LegacyPostDate date="2025-08-27">August 27, 2025</LegacyPostDate>
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
          There&apos;s been a ton of new albums to explore this summer (tyler,
          clipse, jid, freddie gibbs, ghostface, raekwon, etc..) and the one EP
          I keep returning to more than any other album is HEELS HAVE EYES by
          Westside Gunn. He&apos;s shown up here and there in the almighty
          algorithm, but I&apos;ve never done a deep dive until now.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Well, I&apos;m hooked and DAVEY BOY SMITH is the beat of the year for
          me so far. A simple piano loop will get me every time. Shouts to Denny
          LaFlare.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Anywho, FLYGOD told me to put this up on my kid&apos;s wall. Consider
          it done, king.
        </p>
      </section>

      <section aria-labelledby="video-title" className="space-y-3">
        <h2
          id="video-title"
          className="text-xl md:text-2xl font-semibold leading-snug"
        >
          DAVEY BOY SMITH Video
        </h2>
        <YouTubeVideo
          id="-mnJEnjyaY4"
          loop
          artist="Westside Gunn"
          song="DAVEY BOY SMITH"
          album="HEELS HAVE EYES"
        />
      </section>

      <section className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-xl md:text-2xl font-semibold leading-snug">
            Westside Gunn Bio
          </h2>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            Westside Gunn (Alvin Worthy) is a Buffalo-born rapper, curator, and
            co-founder of the influential Griselda collective. His music fuses
            gritty street narratives with a flair for high fashion, fine art,
            and wrestling references, turning raw street rap into something
            operatic and luxurious. What makes him stand out is his ear for
            aesthetics: ad-libs delivered like brushstrokes, beats that sound
            like gallery pieces, and an instinct for curation that has reshaped
            modern underground hip-hop. Gunn isn&apos;t just rapping; he&apos;s
            directing an entire scene.
          </p>
        </header>

        <ArtistAlbumGrid albums={albums} classicTitle="HEELS HAVE EYES" />
      </section>
    </article>
  );
}
