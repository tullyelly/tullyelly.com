"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

type RankingListNavProps = {
  current: "overview" | "homies" | "clans";
};

const items = [
  { key: "overview", href: "/cardattack/tcdb-rankings", label: "Overview" },
  { key: "homies", href: "/cardattack/tcdb-rankings/homies", label: "Homies" },
  { key: "clans", href: "/cardattack/tcdb-rankings/clans", label: "Clans" },
] as const;

export default function RankingListNav({ current }: RankingListNavProps) {
  return (
    <nav aria-label="TCDB rankings sections" className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = item.key === current;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-sm font-semibold transition",
              active
                ? "border-[var(--blue)] bg-[var(--blue)] text-[var(--text-on-blue)]"
                : "border-[var(--border-subtle)] bg-white text-ink hover:bg-[var(--cream)]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
