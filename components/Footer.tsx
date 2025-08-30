"use client";

import BrandedLink from "@/components/BrandedLink";
import BuildBadge from "@/components/BuildBadge";
import { buildInfo } from "@/lib/build-info";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="w-full text-center text-sm"
      style={{ backgroundColor: "var(--brand-chrome)", color: "var(--brand-chrome-fg)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-6">
        © {buildInfo.buildYear} {" "}
        <BrandedLink href="/">tullyelly</BrandedLink>
        . All rights reserved.
        <BuildBadge />
      </div>
    </footer>
  );
}
