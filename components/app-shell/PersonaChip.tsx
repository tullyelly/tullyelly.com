import Link from "next/link";
import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResolvedPersona } from "@/lib/menu/persona";

function PersonaIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  if (!name) return null;
  const IconComponent = Lucide[name as keyof typeof Lucide] as
    | LucideIcon
    | undefined;
  if (!IconComponent) return null;
  return <IconComponent className={className} aria-hidden="true" />;
}

type PersonaChipProps = {
  persona: NonNullable<ResolvedPersona>;
  className?: string;
};

export default function PersonaChip({ persona, className }: PersonaChipProps) {
  const href = `/persona/${persona.persona}`;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 text-sm font-medium text-[color:var(--text-strong,#0e2240)] transition hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue,#0077c0)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        className,
      )}
      aria-label={`Go to ${persona.label} persona`}
    >
      <PersonaIcon
        name={persona.icon}
        className="size-4 text-[color:var(--text-muted,#58708c)]"
      />
      <span className="truncate">{persona.label}</span>
    </Link>
  );
}
