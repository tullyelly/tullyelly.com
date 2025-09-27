"use client";

import BrandedLink from "@/components/BrandedLink";

export default function SiteHeader() {
  return (
    <header
      className="w-full"
      style={{
        backgroundColor: "var(--brand-chrome)",
        color: "var(--brand-chrome-fg)",
      }}
    >
      <div className="mx-auto flex h-12 max-w-[var(--content-max)] items-center justify-between px-6">
        <BrandedLink href="/" aria-label="tullyelly; home">
          tullyelly
        </BrandedLink>
        <nav className="flex items-center gap-6">
          <BrandedLink
            href="/credits"
            title="Sources, credits, and shout-outs."
          >
            Flowers
          </BrandedLink>
        </nav>
      </div>
    </header>
  );
}
