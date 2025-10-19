import Link from "next/link";
import FlowersInline from "@/components/flowers/FlowersInline";
import { ScrollAmendment } from "@/components/scrolls/ScrollAmendment";

export default function Mark2Page() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          blueprint
        </h2>
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
            alter egos
          </Link>
          {". "}Put together, each ego compromises a framework that I use to
          filter and capture all ideas in a consistent & repeatable fashion.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Because none of this will immediately make sense to any visitors, each
          alter ego has a landing page that helps to clarify the intent behind
          my particular (peculiar?) naming conventions and thought processes.
          After finishing this page it is recommended you stop by each to see
          how this clock ticks:
        </p>
        <ol className="list-decimal ml-6 space-y-1 text-[16px] md:text-[18px] text-muted-foreground">
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
          one of my adventures. Take ChatGPT for example. When collaborating
          with mr. robot, a blueprint is produced for any idea deemed worthy of
          exploration and eventual construction. That blueprint, often made up
          of dozens of subtasks, is then used to continue to build out my
          project plan. Everything you see on this site was first started from
          one blueprint or another. Some ideas are iterated over in multiple
          different blueprints along the way.
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
      </section>
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          mr. robot says...
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Curabitur aliquet quam id dui posuere blandit. Donec sollicitudin
          molestie malesuada.
        </p>
      </section>
    </div>
  );
}
