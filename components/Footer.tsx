import BrandedLink from "@/components/BrandedLink";
import { getBuildInfo } from "@/lib/build-info";

export default async function Footer() {
  const info = await getBuildInfo();
  const year = (info.builtAt ?? "").slice(0, 4) || "";

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
