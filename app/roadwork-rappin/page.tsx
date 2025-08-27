import React from "react"

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
}

type Album = {
  title: string
  year: number
  note: string
  favorite?: boolean
}

const albums: Album[] = [
  { title: "Labor Days", year: 2001, note: "Breakthrough album, socially sharp and lyrically dense." },
  { title: "None Shall Pass", year: 2007, note: "Critically acclaimed; balances abstract wordplay with vivid storytelling." },
  { title: "Skelethon", year: 2012, note: "Darker, self-produced record showcasing his full creative control." },
  { title: "The Impossible Kid", year: 2016, note: "Personal, playful, and a highly accessible entry point." },
  { title: "Spirit World Field Guide", year: 2020, note: "Conceptual journey through a surreal, otherworldly manual." },
  { title: "Garbology (with Blockhead)", year: 2021, note: "Return to form with a longtime collaborator.", favorite: true },
  { title: "Black Hole Superette", year: 2024, note: "Latest release, expanding his signature style with fresh energy.", favorite: true },
]

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] font-medium leading-4 text-neutral-700">
      {children}
    </span>
  )
}

// Only change: make the favorite badge appear ONLY for "Spirit World Field Guide"
function FavBadge({ title }: { title: string }) {
  if (title !== "Spirit World Field Guide") return null
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold leading-4 text-emerald-700 ring-1 ring-emerald-600/20">
      uncle jimmy’s favorite
    </span>
  )
}

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
          <h2 className="text-xl font-semibold">Parents Of Young Children</h2>
          <p className="leading-relaxed">
            Expect me to be converting between 3–5 children into fans of Aesop Rock utilizing this song.
            We&rsquo;ll keep it clean, promise. 😉
          </p>
          <p className="leading-relaxed">
            The video will loop itself to keep them out of the almighty algorithm as long as possible.
            Long live the algorithm!
          </p>
        </section>

        <section aria-labelledby="video-title" className="space-y-3">
          <h2 id="video-title" className="text-xl font-semibold">Roadwork Rappin’ Video</h2>
          <figure className="space-y-2">
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
            <figcaption className="text-xs text-neutral-500">
              Embedded via YouTube’s privacy-enhanced player.
            </figcaption>
          </figure>
        </section>

        <section className="space-y-6">
          <header className="space-y-1">
            <h2 className="text-xl font-semibold">Aesop Rock Bio</h2>
            <p className="leading-relaxed">
              Aesop Rock (Ian Bavitz) is a New York–born rapper and producer celebrated for his dense, surreal lyricism and lasting influence on underground hip-hop. What makes him truly stand out is his vocabulary: studies show he’s used more unique words across his career than any other major rapper, a linguistic range so vast it even rivals Shakespeare. That love of language defines his style—songs that unfold like puzzles, packed with imagery and ideas that reward repeated listens.
            </p>
          </header>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Albums to Explore</h3>
            <ul role="list" className="grid gap-3 sm:grid-cols-2">
              {albums.map((a) => (
                <li
                  key={a.title}
                  className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold italic">{a.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge>{a.year}</Badge>
                      {/* Only show favorite badge for Spirit World Field Guide */}
                      <FavBadge title={a.title} />
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">{a.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </article>
    </main>
  )
}