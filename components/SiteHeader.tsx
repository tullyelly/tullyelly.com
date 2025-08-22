"use client";

import BrandedLink from "@/components/BrandedLink";

export default function SiteHeader() {
  return (
    <header
      className="w-full"
      style={{ backgroundColor: "var(--brand-chrome)", color: "var(--brand-chrome-fg)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-4">
        <BrandedLink href="/" aria-label="tullyelly — home">
          tullyelly
        </BrandedLink>
      </div>
    </header>
  );
}