"use client";

import BrandedLink from "@/components/BrandedLink";

export default function SiteHeader() {
  return (
    <header
      className="w-full"
      style={{ backgroundColor: "var(--brand-chrome)", color: "var(--brand-chrome-fg)" }}
    >
      <div className="mx-auto max-w-[var(--content-max)] px-6 py-4 flex items-center justify-between">
        <BrandedLink href="/" aria-label="tullyelly; home">
          tullyelly
        </BrandedLink>
        <nav className="flex items-center gap-6">
          <BrandedLink href="/ui-lab">UI Lab</BrandedLink>
          <BrandedLink href="/typography-demo">Typography</BrandedLink>
          <BrandedLink href="/credits" title="Sources, credits, and shout-outs.">Flowers</BrandedLink>
        </nav>
      </div>
    </header>
  );
}
