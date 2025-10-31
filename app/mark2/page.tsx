import Image from "next/image";
import Link from "next/link";
import FlowersInline from "@/components/flowers/FlowersInline";
import { ScrollAmendment } from "@/components/scrolls/ScrollAmendment";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

const pageTitle = "🧠mark2 | tullyelly";
const pageDescription =
  "Explore the 🧠mark2 blueprint: a second-brain sandbox for planning, creative prototyping, and shaolin scroll experiments across the tullyelly multiverse.";
const canonical = canonicalUrl("mark2");

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/mark2",
    type: "website",
    images: [
      {
        url: "/images/optimized/iron-man-hope.jpg",
        width: 595,
        height: 842,
        alt: "A hopeful Iron Man illustration representing the 🧠mark2 blueprint lab.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [
      {
        url: "/images/optimized/iron-man-hope.jpg",
        alt: "A hopeful Iron Man illustration representing the 🧠mark2 blueprint lab.",
      },
    ],
  },
};

export default function Mark2Page() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-xl md:text-2xl font-semibold leading-snug">
          blueprint
        </h1>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Yes me, this is a good starting point.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          First, a brief rundown before peering into my lunacy. Each menu is
          built from the perspective of a different{" "}
          <Link
            href="https://youtube.com/shorts/9cmmpJYF1ck?si=SF4Clk61b0vb0v8W"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            alter ego
          </Link>
          {". "}Put together, each ego compromises a framework that I use to
          filter and capture all ideas in a consistent & repeatable fashion.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Because none of this will immediately make sense to any visitors, each
          alter ego has a landing page that helps to clarify the intent behind
          my particular (peculiar?) naming conventions and thought processes.
          After finishing this page it is recommended you stop by each sibling
          to see how this clock ticks:
        </p>
        <ol className="list-decimal ml-6 text-[16px] md:text-[18px] text-muted-foreground">
          <li>
            blueprint (
            <Link href="/mark2" className="underline hover:no-underline">
              🧠mark2
            </Link>
            ) &lt;--- you are here
          </li>
          <li>
            vault (
            <Link href="/cardattack" className="underline hover:no-underline">
              🃏cardattack
            </Link>
            )
          </li>
          <li>
            cipher (
            <Link href="/theabbott" className="underline hover:no-underline">
              🪶theabbott
            </Link>
            )
          </li>
          <li>
            circus (
            <Link href="/unclejimmy" className="underline hover:no-underline">
              🎙unclejimmy
            </Link>
            )
          </li>
          <li>
            forge (
            <Link href="/tullyelly" className="underline hover:no-underline">
              ⚒️tullyelly
            </Link>
            )
          </li>
        </ol>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Really though, chaos remains supreme, and above all else, do not take
          this, nor yourself, too seriously. Within that chaos should always be
          a series of links. These links will either take you deeper into my{" "}
          <Link
            href="/tullyelly/ruins"
            className="underline hover:no-underline"
          >
            internal madness
          </Link>{" "}
          or outward towards the things that{" "}
          <Link
            href="https://www.amazon.com/stores/Thich-Nhat-Hanh/author/B000AP5YRY"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            inspire
          </Link>{" "}
          me.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          As for blueprint itself, this is a reusable term found within every
          one of my adventures. Take my ChatGPT workflows for example. When
          collaborating with mr. robot, a blueprint is produced for any idea
          deemed worthy of exploration and eventual construction. That
          blueprint, often made up of dozens of subtasks, is then used to
          continue to build out my project plan. Everything you see on this site
          was first started from one blueprint or another. Some ideas are
          iterated over in multiple different blueprints along the way.
        </p>
        <p className="mt-3 text-[16px] md:text-[18px] text-muted-foreground">
          <FlowersInline>
            <a
              href="https://www.youtube.com/watch?v=JInpNEy3vgw&list=OLAK5uy_mG7PHjAEry69rSUFl3KXDFzhGW9HK-pvw&index=2"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              jigga
            </a>
            {" & "}
            <a
              href="https://youtu.be/asqeUpM-kzE?si=M1YALcUP9V4OzJ3h"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              the teacha
            </a>
          </FlowersInline>
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          🧠mark2
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          This one started when I named my Surface laptop 🧠mark2 and as my
          preferred creative device this is where most ideas originate. My phone
          (currently unnamed, odd because I literally name everything) augments
          the laptop and is a distant second.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <ScrollAmendment>
            I wrote most of these landing pages on my phone using Obsidian.
          </ScrollAmendment>
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          🧠mark2 then evolved into the first alter ego and is where I stick all
          of my big picture thinking. Project planning, tooling decisions, job
          searches, and other major exploratory initiatives start here. I will
          often start an argument amongst my alter egos and ask that 🧠mark2
          make a final recommendation to account for the widest possible lens.
          At least 50% of the time, I reject all of these ideas and pick my own.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          That&#39;s a true story.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          The name 🧠mark2 itself is a play on Tony Stark&apos;s alphanumeric
          system used to identify his different{" "}
          <Link
            href="https://marvelcinematicuniverse.fandom.com/wiki/Iron_Man_Armor:_Mark_II"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Iron Man
          </Link>{" "}
          suits. Each iteration holding different feature sets and use cases.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          In my case you will never find reference to the first iteration
          because of the tragic and abrupt nature of its ending. Consider that
          as the caterpillar needed within my midlife crisis to eventually grow
          🧠mark2 as the butterfly. At least in theory.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          You will also never see a{" "}
          <Link
            href="https://ironman.fandom.com/wiki/Iron_Man_Mark_III"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            mark3
          </Link>{" "}
          or beyond because my favorite number is 2 and should this idea fall
          apart, an entirely new structure will be built to take its place.
          While I do not ever intend to pivot from this wonderful idea, I
          anticipate life will force its issues upon me and require a change all
          the same.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          See{" "}
          <Link
            href="/mark2/shaolin-scrolls"
            className="underline hover:no-underline"
          >
            shaolin scrolls
          </Link>{" "}
          and the idea release schedule for more information on how I work
          around this box I&#39;ve built myself into.
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          mr. robot says...
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Each landing page will also have a section dedicated to what my robot
          friend (
          <Link
            href="https://chatgpt.com/"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            ChatGPT
          </Link>
          ) says about each alter ego. Yes, this is ridiculous, and yes, you can
          make fun of me for it. I can assure you that my skin is thick and that
          I hear about it almost daily.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Please be original though, the founding fathers of roasting me are
          quite good at it.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Other than a very brief laying of the groundwork when getting mr.
          robot off the ground, I have not shaped these answers directly in any
          way. These are the results of hundreds of hours building stuff
          together over the course of these past two+ months.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Without further ado:
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <b>The Second Brain. The Sandbox. The Lab.</b>
          <br />
          🧠mark2 exists to experiment - with workflows, knowledge systems, and
          creative prototypes. It&apos;s your testing ground for methods like{" "}
          <Link
            href="https://obsidian.md/"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Obsidian
          </Link>
          , personal graph databases, and process evolution.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <i>Mantra: “Iterate to illuminate.”</i>
        </p>
        <div className="relative z-10 mx-auto w-full max-w-xs overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-lg shadow-black/40">
          <div className="relative h-0 w-full pb-[177.78%]">
            <div aria-hidden className="absolute inset-0 bg-neutral-950" />
            <video
              className="absolute inset-0 z-10 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            >
              <source src="/videos/iron-man.webp" type="video/webp" />
              <source src="/videos/iron-man.mp4" type="video/mp4" />
            </video>
            <div
              aria-hidden
              className="absolute inset-0 z-20 bg-gradient-to-b from-black/30 via-black/25 to-black/60"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
