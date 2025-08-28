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
  title: "Heels Have Eyes by Westside Gunn | tullyelly",
  description:
    "Explore &apos;Heels Have Eyes&apos; by Westside Gunn &mdash; a gritty yet artful entry in modern underground hip-hop. This page features the video, context, and supporting content for fans of rap and experimental lyricism.",
  alternates: { canonical: "/heels-have-eyes" },
  openGraph: {
    title: "Westside Gunn &mdash; Heels Have Eyes",
    description:
      "Hip-hop and rap fans can dive into Westside Gunn&apos;s &apos;Heels Have Eyes&apos; with video and context on this page.",
    url: "/heels-have-eyes",
    type: "music.song",
    images: [
      {
        url: "/images/optimized/HEELS HAVE EYES.jpg",
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
        url: "/images/optimized/HEELS HAVE EYES.jpg",
        alt: "HEELS HAVE EYES cover art",
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
  { title: "FLYGOD", year: 2016, note: "His breakout, blending raw Buffalo grit with his emerging taste for artful extravagance." },
  { title: "Supreme Blientele", year: 2018, note: "A milestone record, full of cinematic beats and sharp, painterly verses." },
  { title: "Pray for Paris", year: 2020, note: "A fan favorite that perfectly fuses fashion, art, and grimy rap, recorded after Gunn&apos;s trip to Paris Fashion Week." },
  { title: "Hitler Wears Hermes 8: Sincerely, Adolf", year: 2021, note: "Grand finale to his signature series, showing his range from ruthless to reflective." },
  { title: "Peace \"Fly\" God", year: 2022, note: "A raw, minimal experiment produced in just two days, spotlighting Gunn&apos;s instinctive artistry." },
  { title: "And Then You Pray for Me", year: 2023, note: "Intended as his retirement album, a sprawling, ornate statement piece." },
  { title: "HEELS HAVE EYES", year: 2024, note: "Wrestling-inspired and concept-heavy, a bold continuation of his storytelling." },
]

const items: CardItem[] = mapDomainToCardItem(albums, (a) => ({
  id: a.title,
  title: a.title,
  meta: a.year,
  description: a.note,
}))

const isFav = (item: CardItem) => item.title === "HEELS HAVE EYES"

export default function Page() {
  return (
    <main className="px-4 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl py-10 space-y-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Heels Have Eyes</h1>
          <p className="mt-2 text-sm text-fg/60">
            Welcome to my newest experiment. Please excuse any bugs or lack of polish. Early days.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Parental Discretion Advised</h2>
          <p className="leading-relaxed">
            There&apos;s been a ton of new albums to explore this summer (tyler, clipse, jid, freddie gibbs, ghostface, raekwon, etc..) and the one EP I keep returning to more than any other album is HEELS HAVE EYES by Westside Gunn. He&apos;s shown up here and there in the almighty algorithm, but I&apos;ve never done a deep dive until now.
          </p>
          <p className="leading-relaxed">
            Well, I&apos;m hooked and DAVEY BOY SMITH is the beat of the year for me so far. A simple piano loop will get me every time. Shouts to Denny LaFlare.
          </p>          
          <p className="leading-relaxed">
            Anywho, FLYGOD told me to put this up on my kid&apos;s wall. Consider it done, king.
          </p>
        </section>

        <section aria-labelledby="video-title" className="space-y-3">
          <h2 id="video-title" className="text-xl font-semibold">DAVEY BOY SMITH Video</h2>
          <figure className="space-y-2">
            <div className="yt-wrapper-bucks">
              <iframe
                src="https://www.youtube-nocookie.com/embed/-mnJEnjyaY4?si=LMJt5-8BmEL4cFlQ"
                title="Westside Gunn &mdash; DAVEY BOY SMITH music video"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <figcaption className="text-xs text-fg/60">
              Embedded via YouTube&apos;s privacy-enhanced player.
            </figcaption>
          </figure>
        </section>

        <section className="space-y-6">
          <header className="space-y-1">
            <h2 className="text-xl font-semibold">Westside Gunn Bio</h2>
            <p className="leading-relaxed">
              Westside Gunn (Alvin Worthy) is a Buffalo-born rapper, curator, and co-founder of the influential Griselda collective. His music fuses gritty street narratives with a flair for high fashion, fine art, and wrestling references, turning raw street rap into something operatic and luxurious. What makes him stand out is his ear for aesthetics: ad-libs delivered like brushstrokes, beats that sound like gallery pieces, and an instinct for curation that has reshaped modern underground hip-hop. Gunn isn&apos;t just rapping; he&apos;s directing an entire scene.
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
