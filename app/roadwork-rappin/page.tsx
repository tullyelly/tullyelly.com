import React from "react"
import {
  Card,
  CardGrid,
  type CardItem,
  mapDomainToCardItem,
} from "@ui"
import { Badge } from "@/app/ui/Badge"
import { getBadgeClass } from "@/app/ui/badge-maps"

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
    images: [
      {
        url: "/images/optimized/roadwork rappin.jpg",
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
    title: "Aesop Rock — Roadwork Rappin’",
    description:
      "Aesop Rock’s Roadwork Rappin’. Build a road where there isn't a road!",
    images: [
      {
        url: "/images/optimized/roadwork rappin.jpg",
        alt: "Roadwork Rappin’ cover art",
      },
    ],
  },
}

type Album = {
  title: string
  year: number
  note: string
}

const albums: Album[] = [
  { title: "Labor Days", year: 2001, note: "Breakthrough album, socially sharp and lyrically dense." },
  { title: "None Shall Pass", year: 2007, note: "Critically acclaimed; balances abstract wordplay with vivid storytelling." },
  { title: "Skelethon", year: 2012, note: "Darker, self-produced record showcasing his full creative control." },
  { title: "The Impossible Kid", year: 2016, note: "Personal, playful, and a highly accessible entry point." },
  { title: "Spirit World Field Guide", year: 2020, note: "Conceptual journey through a surreal, otherworldly manual." },
  { title: "Garbology (with Blockhead)", year: 2021, note: "Return to form with a longtime collaborator." },
  {
    title: "Black Hole Superette",
    year: 2024,
    note: "Latest release, expanding his signature style with fresh energy.",
  },
]

const items: CardItem[] = mapDomainToCardItem(albums, (a) => ({
  id: a.title,
  title: a.title,
  meta: a.year,
  description: a.note,
}))

const isFav = (item: CardItem) => item.title === "Spirit World Field Guide"

export default function Page() {
  return (
    <main className="px-4 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl py-10 space-y-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Roadwork Rappin’</h1>
          <p className="mt-2 text-sm text-fg/60">
            Welcome to my newest experiment. Please excuse any bugs or lack of polish. Early days.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Parental Discretion Advised</h2>
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
            <figcaption className="text-xs text-fg/60">
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
            <CardGrid>
              {items.map((item) => (
                <Card key={item.id} className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold italic">{item.title}</h4>
                    {item.meta && (
                      <Badge className={getBadgeClass('archived')}>{item.meta}</Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-2 text-sm text-fg/80 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  {isFav(item) && (
                    <Badge
                      className={`${getBadgeClass('classic')} absolute bottom-2 right-2`}
                    >
                      unclejimmy classic
                    </Badge>
                  )}
                </Card>
              ))}
            </CardGrid>
          </div>
        </section>
      </article>
    </main>
  )
}
