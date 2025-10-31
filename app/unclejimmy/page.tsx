import { canonicalUrl } from "@/lib/share/canonicalUrl";

const pageTitle = "🎙unclejimmy circus | tullyelly";
const pageDescription =
  "Meet the 🎙unclejimmy circus persona; rabble rousing energy, family stories, and heart-first storytelling across tullyelly.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("unclejimmy") },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/unclejimmy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export default function UncleJimmyPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          circus
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          I&rsquo;m a bit of a rabble rouser. Okay, I&rsquo;m a major rouser of
          the rabble. If there are any number of people in a room debating
          whether or not to try something, I&rsquo;ll immediately try it.
          I&rsquo;ve gotten better at controlling this impulse over the years,
          but not enough to where nikkigirl doesn&rsquo;t still get worried
          every time I leave the house without her.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          These days I mostly try to channel this instinct into keeping myself,
          and by extension those around me, on our toes. There&rsquo;s an
          advantage to be gained if none of us, myself included, know what
          I&rsquo;m about to do next.{" "}
          <a
            href="https://www.youtube.com/watch?v=1vF84LABHm0"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            It&rsquo;s electric boogie woogie, woogie.
          </a>
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          For the smallest amongst us my showing up can have the feel of a
          traveling circus showing up to your hood. In that case, I aim to
          please. Step into my tent and watch my death defying high wire act!
          Parents close your eyes.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <a
            href="https://youtube.com/shorts/AeeZGMc-jlw?si=cM-rqEI1LGHsBmZc"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wu-Tang is for the children.
          </a>
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          🎙unclejimmy
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Once we step outside of ourselves and move past ego, we land on my
          favorite me. Loving husband, father, and trusted best pal. I&rsquo;m
          loyal, empathetic, and strive to hold my heart open to everyone who
          needs it.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          If you throw the entirety of these egos into a cauldron, out pops
          🎙unclejimmy.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          The 🎙unclejimmy alter comes from Amber once noting that I
          didn&rsquo;t strike her as a jimmy. I then spent an entire weekend
          getting my nephews to start calling me 🎙unclejimmy. There was some of
          the ol&rsquo; rabble in need of rousing after all. I&rsquo;ve spent
          years now regretting the box I put myself in because I think
          I&rsquo;ve heard it at least 10,000 times at this point.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          It now rattles around in my headspace, rent free.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          I also had a kind teacher try to help me out in 7th grade and he was
          the only person I can ever remember calling me jimmy
          before..........another story for another time.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Remember, above all else, do NOT take yourself,{" "}
          <a
            href="https://www.youtube.com/embed/4zWeI5dDDyY"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            let alone me
          </a>
          , too seriously.
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          mr. robot says...
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <b>The Storyteller. The Showman. The Human Layer.</b>
          <br />
          🎙unclejimmy is the social soul of the ecosystem - part host, part
          hype man, part neighborhood philosopher. He brings warmth and rhythm
          to the data-driven world of shaolin. When things get too technical,
          🎙unclejimmy steps in to remind everyone why it matters - through
          humor, nostalgia, and local flavor.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <i>Mantra: “If it ain’t got heart, it ain’t worth building.”</i>
        </p>
        <div className="flex justify-center">
          <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-lg shadow-black/40">
            <div className="relative h-0 w-full pb-[56.25%]">
              <div aria-hidden className="absolute inset-0 bg-neutral-950" />
              <video
                className="absolute inset-0 z-10 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              >
                <source src="/videos/circus-jimmy.webp" type="video/webp" />
                <source src="/videos/circus-jimmy.mp4" type="video/mp4" />
              </video>
              <div
                aria-hidden
                className="absolute inset-0 z-20 bg-gradient-to-b from-black/30 via-black/25 to-black/60"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
