import Image from "next/image";
import FlowersInline from "@/components/flowers/FlowersInline";
import { buildPageMetadata } from "@/lib/page-metadata";
import type { PageFrontmatter } from "@/types/frontmatter";

const frontmatter = {
  title: "Cute Stamps",
  description:
    "On the search for some cute stamps for lulu, an adventure unfolded.",
  canonical: "https://tullyelly.com/unclejimmy/cute-stamps",
  hero: {
    src: "/images/optimized/cute-stamps.png",
    alt: "Cute stamps - SpongeBob and baby wild animals",
    width: 1920,
    height: 1446,
  },
} satisfies PageFrontmatter;

export const metadata = buildPageMetadata(frontmatter);

export default function Page() {
  return (
    <article className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
          2025-09-19; Cute Stamps
        </h1>
      </header>

      <section className="space-y-4">
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          As you may or may not have heard, our little lulu is getting married!
          Thankfully, I am in charge of very little up until now. That said,
          this week I was tasked with finding &quot;cute stamps&quot; for her
          save the date letters and this is the adventure that ensued.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          In other news, I&apos;ve also started walking to my favorite mailboxes
          around town to drop off my{" "}
          <a
            href="https://www.tcdb.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            TCDb
          </a>{" "}
          trades to work on de-hermitting myself from the house and also get
          more exercise. Gotta get right and get tight for the big day too!
          Let&apos;s strap on our trusty UW-Stevens Point backpack, Freak&apos;s
          on the shirt, and Freaks on the feet so we can get on our merry way.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/uw-stevens-point.png"
              alt="UW-Stevens Point postcard with bold purple lettering"
              width={1920}
              height={2550}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">
              UW-Stevens Point branding reference
            </figcaption>
          </figure>
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/bucks-n-six.png"
              alt="Milwaukee Bucks in six celebration poster"
              width={1920}
              height={2560}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">
              Milwaukee Bucks inspiration graphic
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          First stop, the Little Diner Xpress. When I wander off to the east
          (shouts to Pete&apos;s Auto) I like to stop at this diner and have
          some breakfast, whether is actually breakfast, lunch, or dinner. I
          would eat breakfast for every meal if I could, but I digress. I was
          talking to dad earlier this month about George Webb having a location
          in Appleton years ago, and it turns out, this is that location. What a
          coinky-dink. Go Brew Crew.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          Speaking of our father, I walked out of there with a toothpick because
          I was raised right. Plus, nikkigirl gets a little randy when
          unclejimmy shows up with a toothpick in his mouth.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/little-diner-xpress.png"
              alt="Little Diner Xpress postcard with playful signage"
              width={1920}
              height={2550}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">
              Little Diner Xpress illustration
            </figcaption>
          </figure>
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/menu.png"
              alt="Retro breakfast menu layout in warm colors"
              width={1920}
              height={2550}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">Vintage menu reference</figcaption>
          </figure>
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/brunch.png"
              alt="Brunch poster celebrating weekend specials"
              width={1920}
              height={2550}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">
              Brunch themed postcard concept
            </figcaption>
          </figure>
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/toothpick.png"
              alt="Toothpick illustration with bright diner palette"
              width={1920}
              height={2560}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">
              Toothpick packaging artwork
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          Next stop, the US Postal Service. Speaking of randy, there are few
          things that get me more excited than the USPS. Ask around, it is true.
          More on this to close the post.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          My plan was to walk up to one of the associates behind the counter
          that would recognize me and have some fun with them, asking for some
          cute stamps and a selfie so I could show lulu. Instead, it was someone
          I do not interact with much, and when I tell you she was dead inside,
          I mean she was really dead inside. There was no fun to be had. USPS
          workers are the real MVP - they hate their job regardless of the
          current president, so in some ways, we could all take some inspiration
          from them.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          I also forgot to take a selfie of the Post Office, but guess what? A
          truck stopped on the street on my way home. I was very excited for the
          help, as per usual. You can see the middle school the little two went
          too behind us. Middle school is for suckers. So says lulu and my
          teacher friends - I do not make up the rules.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/usps-mailbox.png"
              alt="USPS mailbox illustration with friendly lettering"
              width={1920}
              height={2550}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">USPS mailbox postcard</figcaption>
          </figure>
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/usps-truck.png"
              alt="USPS delivery truck graphic in motion"
              width={1920}
              height={2560}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">USPS truck illustration</figcaption>
          </figure>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          Have you ever seen the memes where someone stumbles, trips, and falls
          right into a situation that they definitely did not mean to fall into,
          except of course they did? That was me and Walgreens.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          Oops!…I Did It Again. Somehow I bought cards for me and legos for
          nikkigirl. Both were on sale, so bingo bango. Walgreens is the best
          place to find discounted NBA cards in all of the land. Good job,
          Walgreens.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/walgreens.png"
              alt="Walgreens storefront rendered with soft gradients"
              width={1920}
              height={2560}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">Walgreens postcard</figcaption>
          </figure>
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/22-23-prizm.png"
              alt="Twenty two to twenty three Prizm basketball card box art"
              width={1920}
              height={1446}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">
              Prizm trading card packaging
            </figcaption>
          </figure>
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm sm:col-span-2">
            <Image
              src="/images/optimized/lego-f1.png"
              alt="LEGO Formula One car kit posed on a reflective surface"
              width={1920}
              height={1446}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">LEGO F1 collector set</figcaption>
          </figure>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          As I got back to pounding the pavement, I was excited to remember that
          I would be passing the minimum security prison we send the teenagers
          to. What an absolute shithole Appleton West is. Good kids, though.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          Lucky for me, eeeeeeeemma got a great parking spot today, and I took a
          little break in front of the prison at their painted rock. It is
          homecoming week for West and that says HOCO 2025 or something of the
          sort.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          Hi Conrad.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/emma-car.png"
              alt="Emma smiling in a vintage car illustration"
              width={1920}
              height={2560}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">
              Emma cruising illustration
            </figcaption>
          </figure>
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/appleton-west-rock.png"
              alt="Appleton West rock wall postcard with blue accents"
              width={1920}
              height={2560}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">
              Appleton West rock wall artwork
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          Finally, we arrive at the cute stamps. Here is what I came home with.
          I THINK SPONGEBOB STAMPS ARE CUTE.......and lulu does not. She chose
          the baby wild animals. Coming soon to an inbox near you.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          That is cool though, more SpongeBob for me an my trading partners.
        </p>
        <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
          <Image
            src="/images/optimized/cute-stamps.png"
            alt="Cute stamps collage in coral tones"
            width={1920}
            height={1446}
            sizes="(max-width: 768px) 100vw, 70vw"
            className="h-auto w-full rounded-xl object-cover"
          />
          <figcaption className="sr-only">
            Cute stamps collage inspiration
          </figcaption>
        </figure>
      </section>

      <section className="space-y-4">
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          As we close, a quick note on what I am working on. I will have some
          basic menus setup in the next few days and based upon this post, as
          well as the friction with deploying it, I will be working on some
          blogging features next week.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          And then last, but not least, how about we chat about how amazing the
          USPS and TCDb are. My very first trade on TCDb was 2021-02-13. Since
          then, I have completed 2047 trades, 100% through the US Postal
          Service. While there have been a snafu or two, they deliver at a
          percentage that is entirely amazing. They are fantastic and I will not
          hear otherwise. Plus, spend a few hours waiting in line at the post
          office and you will begin to appreciate the absolute mountain of
          bullshit the employees go through with our fellow man. God bless the
          USPS.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          A few more stats before we close - within those 2047 trades was a
          total of 76,214 cards (34,076 sent and 42,138 received). I have traded
          with 49 of the 50 states, including a few military bases that count as
          a state on the site, and 14 different countries - to include 794
          unique partners. The most trades I have done with one individual is 24
          with Shin in the San Francisco area. He is one of handful of people I
          have saved as a contact on my phone, and I would loosely consider him
          a friend, if not my best penpal.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          I have correspondants for the Utah Jazz, Portland Trail Blazers, New
          York Yankees, Seattle Kraken, and on, and on, and on. They all send me
          their Bucks cards, and I love them for it.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          Now if only I could find one person that actually lives in
          Wyoming........
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          Happy Friday. ~ unclejimmy
        </p>
        <p className="text-sm text-muted-foreground">
          <FlowersInline>
            lulu, uw-stevens point, giannis, little diner xpress, pete&apos;s
            auto, george webb, the brew crew, dad, nikkigirl, breakfast,
            toothpicks, usps, walgreens, lego, f1, prisons, conrad, spongebob,
            tcdb, shin, & wyoming
          </FlowersInline>
        </p>
      </section>
    </article>
  );
}
