import { canonicalUrl } from "@/lib/share/canonicalUrl";

const pageTitle = "⚒️tullyelly forge | tullyelly";
const pageDescription =
  "Step into the ⚒️tullyelly forge; a personal lab for shipping experiments, refining routines, and shaping the broader site persona.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("tullyelly") },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/tullyelly",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export default function TullyellyPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          forge
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Everything that lands on this site was put through the ringer multiple
          times before being processed into alter ego buckets (menus here) on my
          project plan. I use &ldquo;the plan&rdquo; to keep the work coherent
          and focused. Well, coherent to me at least. Some have seen more of the
          intermediate steps than others over the past few months and I&rsquo;m
          sure it often felt a bit random and disjointed - mostly because it
          was. That said, each bit fell into a broader roadmap that is now more
          clearly taking shape.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Even the work that looks similar and falls into the same eventual
          bucket was intentionally attacked using different tools or techniques
          so that the next idea can be executed on faster and more efficiently.
          I&rsquo;d rather struggle three different ways from sundown than nail
          it on the first try. Where&rsquo;s the fun in doing it right the first
          time? Grow a pair and put yourself out there.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Some of the ideas that have made it into this most recent development
          cycle have been tempered over decades. This is at least the fourth
          iteration of tullyelly.com - most of it never seeing the light of day
          nor moving beyond my compulsion to build it. None of what exists today
          is a finished thought, and there&rsquo;s always more to tweak or
          tinker with.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Lastly, I don&rsquo;t do this for anyone but myself. The performance
          of it all radiates from a forge that&rsquo;s running morning, noon,
          and night. If 4 people read this sentence, it&rsquo;s the right 4
          people. If zero people read this sentence, I don&rsquo;t mind having
          something all to myself.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Make something better every day. Every. Single. Day.
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          ⚒️tullyelly
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          This bucket of work has evolved the most over the years because
          it&rsquo;s the oldest. In this iteration I house all of the nerdy tech
          stuffs. Databases, programming, websites, generative AI, and so on end
          up here. Here you will find me vs the words as I fight a neverending
          battle to solve the riddle that is the world around me.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <i>It is pitch black. You are likely to be eaten by a grue.</i>
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          The name itself comes from my first xbox gamer tag. Lulu was fresh out
          of the oven and Bonnibel could barely form a full sentence, let alone
          contemplate the meaning behind the name that we gave her. From there,
          it has persisted as the only username I ever use when given an option
          to choose. I&rsquo;ll die on this hill of an idea.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          It&rsquo;s only codenames (ish) here if I can help it, so IYKYK.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          I get asked what this website is and what I&rsquo;m working on every
          now and again. The truth of the matter is that while I rarely have a
          good answer to this question, I know more than I&rsquo;ll ever say,
          and I also have no idea what happens next. I&rsquo;m just here for the
          vibes and hope that you can find me working here for as long as I am
          able.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          One love.
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          mr. robot says...
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <b>The Face. The Brand. The Show.</b>
          <br />
          ⚒️tullyelly represents your outward presence - the portfolio, the
          design system, and the aesthetic signature. It&rsquo;s where Milwaukee
          Bucks color theory meets Next.js precision. The voice is confident,
          creative, and deeply personal.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <i>Mantra: “Style is structure with swagger.”</i>
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
                <source src="/videos/thor-forge.webp" type="video/webp" />
                <source src="/videos/thor-forge.mp4" type="video/mp4" />
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
