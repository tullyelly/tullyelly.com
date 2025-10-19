import Image from "next/image";
import FlowersInline from "@/components/flowers/FlowersInline";
import { Card } from "@ui";

type Item = {
  slug: string;
  icon: string;
  title: string;
  body: string;
};

const items: Item[] = [
  {
    slug: "purpose",
    icon: "🌈",
    title: "Purpose",
    body: "Capture the full set of Chronicle templates we use, explain them simply, and show how they form a complete system for building and recording work.",
  },
  {
    slug: "kickoff",
    icon: "🎬",
    title: "Kickoff – Blueprint",
    body: "Used at the start of a project. Defines scope, breaks down Epics → Stories → Subtasks, and sets estimates. It’s the map before the journey.",
  },
  {
    slug: "idea",
    icon: "💡",
    title: "Idea",
    body: "Used for early sparks; feature thoughts, business directions, design notions. Captures context so we can evaluate potential before committing.",
  },
  {
    slug: "roundup",
    icon: "📊",
    title: "Roundup",
    body: "Used after delivery or milestones. Summarizes results, notes lessons, and sets up next steps. The “after-action report.”",
  },
  {
    slug: "memory",
    icon: "🧠",
    title: "Memory",
    body: "Used for truths and standards we want to keep. Palettes, conventions, workflows. The knowledge vault we can return to anytime.",
  },
  {
    slug: "prompt-pack",
    icon: "🎭",
    title: "Prompt Pack",
    body: "Used for reusable AI prompts. Stores polished instructions so we can reuse them consistently. Our spellbook for automation.",
  },
  {
    slug: "chronicle-root",
    icon: "📜",
    title: "Chronicle (Universal Root)",
    body: "The base template. Provides metadata, narrative, and labels. Every other template builds on this skeleton.",
  },
  {
    slug: "lifecycle",
    icon: "🔄",
    title: "Lifecycle Flow",
    body: "Together, the templates cover the full rhythm: Idea → Kickoff → Work → Roundup → Memory. Prompt Packs and base Chronicles fit in wherever reusable knowledge is needed.",
  },
  {
    slug: "why",
    icon: "🌟",
    title: "Why It Works",
    body: "The system turns chaos into clarity. Every piece of work has a place, every template has a purpose, and over time it creates a living history that’s structured, searchable, and repeatable.",
  },
];

export function ChroniclesSection({ date }: { date?: string }) {
  // Prepare bookend paragraphs (not cards)
  const purpose = items.find((i) => i.slug === "purpose");
  const why = items.find((i) => i.slug === "why");

  // Build card list excluding purpose/why, and append the joke as the last card
  const baseCards = items.filter(
    (i) => i.slug !== "purpose" && i.slug !== "why",
  );
  const dadJoke: Item = {
    slug: "dadbod-jokes",
    icon: "🤣",
    title: "Dadbod Jokes",
    body: `Why can’t you trust stairs?\n\nBecause they’re always up to something.`,
  };
  const cards = [...baseCards, dadJoke];

  const mid = Math.floor(cards.length / 2);

  return (
    <section
      id="chronicles"
      aria-labelledby="chronicles-heading"
      className="scroll-mt-24"
    >
      {/* Heading */}
      <h2
        id="chronicles-heading"
        className="flex items-baseline text-xl md:text-2xl font-semibold leading-snug"
      >
        <span aria-hidden className="mr-2">
          📓
        </span>
        <span>
          Chronicle of Chronicles
          {date && <span className="whitespace-nowrap">; {date}</span>}
        </span>
      </h2>

      {/* Intro space */}
      <p className="mt-3 text-[16px] md:text-[18px] text-muted-foreground">
        This project is my first crack at AI-human collaboration. I’ve provided
        about half of the vision, structure, and problem-solving, while ChatGPT
        and Codex have written 90–95% of the code and guided me through the
        environment setup. It’s the most fun I’ve ever had building and
        executing against a project plan.
      </p>
      <p className="mt-3 text-[16px] md:text-[18px] text-muted-foreground">
        Here’s our pal summarizing the foundation of what we build upon:
      </p>

      {/* Intro bookend paragraph (Purpose) */}
      {purpose && (
        <div
          id={purpose.slug}
          className="mt-3 space-y-1 leading-6 md:leading-7"
        >
          <div className="flex items-baseline font-medium">
            <span aria-hidden className="mr-2 min-w-5 text-base">
              {purpose.icon}
            </span>
            <span>{purpose.title}</span>
          </div>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            {purpose.body}
          </p>
        </div>
      )}

      {/* Grid of cards with centered image as a grid item */}
      <dl className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 md:gap-y-5 leading-6 md:leading-7">
        {/* First half of items */}
        {cards.slice(0, mid).map((it) => (
          <Card as="div" key={it.slug} id={it.slug} className="space-y-1">
            <dt className="flex items-baseline font-medium">
              <span aria-hidden className="mr-2 min-w-5 text-base">
                {it.icon}
              </span>
              <span>{it.title}</span>
            </dt>
            <dd className="text-[16px] md:text-[18px] text-muted-foreground">
              {it.body}
            </dd>
          </Card>
        ))}

        {/* Center image card (placed at mid, centered column on md+) */}
        <figure
          className="rounded-2xl bg-white p-2 place-self-center md:col-start-2 border-[4px] border-[var(--blue)] shadow-sm"
          style={{ borderColor: "var(--blue)" }}
        >
          <Image
            src="/images/optimized/raistlin black robes.webp"
            alt="Raistlin in black robes, atmospheric portrait"
            width={320}
            height={420}
            className="rounded-xl shadow-none"
            priority={false}
          />
          <figcaption className="sr-only">Raistlin illustration</figcaption>
        </figure>

        {/* Second half of items */}
        {cards.slice(mid).map((it) => (
          <Card as="div" key={it.slug} id={it.slug} className="space-y-1">
            <dt className="flex items-baseline font-medium">
              <span aria-hidden className="mr-2 min-w-5 text-base">
                {it.icon}
              </span>
              <span>{it.title}</span>
            </dt>
            <dd className="text-[16px] md:text-[18px] text-muted-foreground">
              {it.body}
            </dd>
          </Card>
        ))}
      </dl>

      {/* Outro bookend paragraph (Why it works) */}
      {why && (
        <div id={why.slug} className="mt-3 space-y-1 leading-6 md:leading-7">
          <div className="flex items-baseline font-medium">
            <span aria-hidden className="mr-2 min-w-5 text-base">
              {why.icon}
            </span>
            <span>{why.title}</span>
          </div>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            {why.body}
          </p>
        </div>
      )}

      {/* Closing acknowledgments */}
      <p className="mt-3 mb-0 text-[16px] md:text-[18px] text-muted-foreground">
        <FlowersInline>
          Chronicles Wiki &{" "}
          <a
            href="https://dragonlance.fandom.com/wiki/Raistlin_Majere"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Raistlin Majere
          </a>
        </FlowersInline>
      </p>
    </section>
  );
}
