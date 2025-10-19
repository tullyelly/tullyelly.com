import { flowersConfig } from "@/lib/flowersConfig";
import FlowersBlock from "@/components/flowers/FlowersBlock";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

export const metadata = {
  title: `${flowersConfig.displayLabel}; tullyelly`,
  description: flowersConfig.tooltip,
  alternates: { canonical: canonicalUrl(flowersConfig.slug) },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-container space-y-4 p-4">
      <h1 className="text-2xl font-bold" title={flowersConfig.tooltip}>
        <span aria-hidden>{flowersConfig.emoji}</span>{" "}
        {flowersConfig.displayLabel}
      </h1>
      <p
        className="text-sm text-muted-foreground"
        aria-label={flowersConfig.ariaLabel}
      >
        This page collects sources, credits, and shout-outs in one place.
      </p>
      <FlowersBlock
        items={[
          <span key="1">
            <a
              href="https://www.postgresql.org/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              PostgreSQL
            </a>
            {", "}
            <a
              href="https://neon.tech/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Neon
            </a>
            {" & "}
            <a
              href="https://www.jetbrains.com/datagrip/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              DataGrip
            </a>
            {"; rekindled my database crush. "}
            {"I always "}
            <span aria-hidden>❤️</span>{" "}
            <a
              href="https://www.atlassian.com/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Atlassian
            </a>
            {"."}
          </span>,
          <span key="2">
            Chronicles wiki &{" "}
            <a
              href="https://dragonlance.fandom.com/wiki/Raistlin_Majere"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Raistlin Majere
            </a>
          </span>,
          <span key="3">
            nikkigirl, Big Ter,{" "}
            <a
              href="https://www.youtube.com/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube
            </a>
            {", "}
            <a
              href="https://www.python.org/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Python
            </a>
            {" & "}
            <a
              href="https://www.kapwing.com/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Kapwing
            </a>
          </span>,
          <span key="4">
            <a
              href="https://www.instagram.com/westsidegunn/?hl=en"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              westside gunn
            </a>
            {", "}
            <a
              href="https://www.instagram.com/aesoprockwins/?hl=en"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              aesop rock
            </a>
            {", "}
            <a
              href="https://www.instagram.com/wutangclan/?hl=en"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              wu-tang clan
            </a>
            {" & "}
            <a
              href="https://www.instagram.com/runthejewels/?hl=en"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              rjt
            </a>
          </span>,
          <span key="5">
            me,{" "}
            <a
              href="https://openai.com/index/chatgpt/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              ChatGPT
            </a>
            {", "}
            <a
              href="https://openai.com/index/introducing-codex/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Codex
            </a>
            {" & "}
            <a
              href="https://github.com/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </span>,
          <span key="6">
            lulu, uw-stevens point, giannis, little diner xpress, pete&apos;s
            auto, george webb, the brew crew, dad, nikkigirl, breakfast,
            toothpicks, usps, walgreens, lego, f1, prisons, conrad, spongebob,
            tcdb, shin, & wyoming
          </span>,
        ]}
      />
    </main>
  );
}
