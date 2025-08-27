import React from 'react';

export const metadata = {
  title: "Roadwork Rappin’ by Aesop Rock | tullyelly",
  description:
    "Explore 'Roadwork Rappin’' by Aesop Rock — a defining track in indie hip-hop and underground rap. This page features the music video, context, and supporting content for fans of hip-hop, rap, and experimental lyricism.",
  alternates: { canonical: "/roadwork-rappin" },
  openGraph: {
    title: "Aesop Rock — Roadwork Rappin’",
    description:
      "Hip-hop, rap, and indie music fans can dive into Aesop Rock’s 'Roadwork Rappin’' with video and context on this page.",
    url: "/roadwork-rappin",
    type: "music.song",
    music: {
      musician: "Aesop Rock",
      genre: ["Hip-Hop", "Rap", "Indie Hip-Hop", "Underground Rap"],
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "Aesop Rock — Roadwork Rappin’",
    description:
      "Aesop Rock’s 'Roadwork Rappin’' with hip-hop and rap context, video embed, and supporting content.",
  },
};

export default function Page() {
  return (
    <main className="px-4 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl py-10 space-y-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Roadwork Rappin’</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Welcome to my newest experiment. Please excuse any bugs or lack of polish. Early days. 
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">To Parents Of Young Children</h2>
          <p>
            "Expect me to be converting between 3-5 children into fans of Aesop Rock utilizing this song. We'll keep it clean, promise. 😉"
          </p>
        </section>

        <section aria-labelledby="video-title" className="space-y-4">
          <h2 id="video-title" className="text-xl font-semibold">Roadwork Rappin’ Video</h2>
          <div className="relative aspect-video overflow-hidden rounded-xl">
            <iframe
              className="absolute inset-0 h-full w-full"
              src="https://www.youtube-nocookie.com/embed/jRHqjDnEFiE?si=-aVzrmGAmDuJ0PL0&loop=1&playlist=jRHqjDnEFiE"
              title="Aesop Rock — Roadwork Rappin’ music video"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Aesop Rock Bio</h2>
          <p>
            <strong>About Aesop Rock</strong>
            <br />
            Aesop Rock (Ian Bavitz) is a New York–born rapper and producer celebrated for his dense, surreal lyricism and lasting influence on underground hip-hop. What makes him truly stand out is his vocabulary: studies show he’s used more unique words across his career than any other major rapper, a linguistic range so vast it even rivals Shakespeare. That love of language defines his style—songs that unfold like puzzles, packed with imagery and ideas that reward repeated listens.
            <br />
            <br />
            <strong>Albums to Explore</strong>
            <br />
            &bull; <em>Labor Days</em> (2001) &mdash; Breakthrough album, socially sharp and lyrically dense.<br />
            &bull; <em>None Shall Pass</em> (2007) &mdash; Critically acclaimed, balancing abstract wordplay with vivid storytelling.<br />
            &bull; <em>Skelethon</em> (2012) &mdash; Darker, self-produced record showcasing his full creative control.<br />
            &bull; <em>The Impossible Kid</em> (2016) &mdash; Personal, playful, and highly accessible entry point.<br />
            &bull; <em>Spirit World Field Guide</em> (2020) &mdash; Conceptual journey through a surreal, otherworldly manual.<br />
            &nbsp;&nbsp;&ndash; <strong>uncle jimmy&rsquo;s favorite</strong><br />
            &bull; <em>Garbology</em> (2021, with Blockhead) &mdash; A return to form with longtime collaborator.<br />
            &bull; <em>Black Hole Superette</em> (2024) &mdash; His most recent release, expanding his signature style with fresh energy.
          </p>

        </section>
      </article>
    </main>
  );
}
