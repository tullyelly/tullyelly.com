"use client";

import Link from "next/link";

export default function SiteHeader() {
  return (
    <header
      className="w-full text-white"
      style={{ backgroundColor: "var(--brand-chrome)", color: "var(--brand-chrome-fg)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-4">
        <Link
          href="/"
          aria-label="tullyelly — home"
          className={[
            "text-white visited:text-white hover:text-white focus:text-white",
            "no-underline hover:underline underline-offset-4",
            "font-semibold tracking-tight",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-chrome)]",
          ].join(" ")}
          style={{ color: "var(--brand-chrome-fg)" }}
        >
          tullyelly
        </Link>
      </div>
    </header>
  );
}
