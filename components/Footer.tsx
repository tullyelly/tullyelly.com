import BrandedLink from "@/components/BrandedLink";
import { buildInfo } from "@/lib/build-info";

export default function Footer() {
  // Prefer the precomputed year; fall back to slicing the ISO if needed
  const year = buildInfo.buildYear || (buildInfo.buildIso ?? "").slice(0, 4) || "";

  return (
    <footer
      role="contentinfo"
      className="w-full text-center text-sm"
      style={{ backgroundColor: "var(--brand-chrome)", color: "var(--brand-chrome-fg)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-6">
        © {year} <BrandedLink href="/">tullyelly</BrandedLink>. All rights reserved.
      </div>
    </footer>
  );
}
