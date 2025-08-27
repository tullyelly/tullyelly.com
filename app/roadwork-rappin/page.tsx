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
            Aesop Rock’s track “Roadwork Rappin’” stands as a hallmark of indie hip-hop and underground rap, blending sharp lyricism with distinct production.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">About the Track</h2>
          <p>
            “Roadwork Rappin’” showcases Aesop Rock’s unique approach to hip-hop and rap. This section provides context for the song’s place within his catalog and the broader landscape of underground music.
          </p>
        </section>

        <section aria-labelledby="video-title" className="space-y-4">
          <h2 id="video-title" className="text-xl font-semibold">Roadwork Rappin’ Video</h2>
          <div className="yt-wrapper-bucks">
            <iframe
              src="https://www.youtube-nocookie.com/embed/jRHqjDnEFiE?si=-aVzrmGAmDuJ0PL0&loop=1&playlist=jRHqjDnEFiE"
              title="Aesop Rock — Roadwork Rappin’ music video"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <p className="text-sm text-neutral-500">
            Embedded directly from YouTube using the privacy-enhanced player.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Notes</h2>
          <p>
            Aesop Rock remains a central figure in indie and underground hip-hop. This page highlights “Roadwork Rappin’” as both a work of art and a testament to the genre’s creativity and resilience.
          </p>
        </section>
      </article>
    </main>
  );
}
