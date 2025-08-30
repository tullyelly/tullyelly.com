import BrandedLink from "@/components/BrandedLink";
import BuildBadge from "@/components/BuildBadge";
import { BUILD_INFO } from "@/lib/build-info";

export default function Footer() {
  // Derive year without constructing a Date (ESLint rule-safe)
  const year = (BUILD_INFO?.buildDateISO ?? "").slice(0, 4);

  return (
    <footer
      role="contentinfo"
      className="w-full text-center text-sm"
      style={{ backgroundColor: "var(--brand-chrome)", color: "var(--brand-chrome-fg)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-6">
        © {year} <BrandedLink href="/">tullyelly</BrandedLink>. All rights reserved.
        <BuildBadge />
      </div>
    </footer>
  );
}