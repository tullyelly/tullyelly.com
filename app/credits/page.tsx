import { flowersConfig } from "@/lib/flowersConfig";
import FlowersBlock from "@/components/flowers/FlowersBlock";

export const metadata = {
  title: `${flowersConfig.displayLabel}; tullyelly`,
  description: flowersConfig.tooltip,
  alternates: { canonical: `https://tullyelly.com${flowersConfig.slug}` },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-container space-y-4 p-4">
      <h1 className="text-2xl font-bold" title={flowersConfig.tooltip}>
        <span aria-hidden>{flowersConfig.emoji}</span> {flowersConfig.displayLabel}
      </h1>
      <p className="text-sm text-muted-foreground" aria-label={flowersConfig.ariaLabel}>
        This page collects sources, credits, and shout-outs in one place.
      </p>
      <FlowersBlock
        items={[
          (
            <span key="1">
              <a
                href="https://www.postgresql.org/"
                className="underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                PostgreSQL
              </a>
              {', '}
              <a
                href="https://neon.tech/"
                className="underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Neon
              </a>
              {' & '}
              <a
                href="https://www.jetbrains.com/datagrip/"
                className="underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                DataGrip
              </a>
              {'; rekindled my database crush.'}
            </span>
          ),
          (
            <span key="2">
              Chronicles wiki &{' '}
              <a
                href="https://dragonlance.fandom.com/wiki/Raistlin_Majere"
                className="underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Raistlin Majere
              </a>
            </span>
          ),
        ]}
      />
    </main>
  );
}
