import BrandedLink from "@/components/BrandedLink";
import { buildInfo } from "@/lib/build-info";

export default function Footer() {
  const year = (buildInfo.buildTime ?? "").slice(0, 4) || "";

  return (
    <footer
      role="contentinfo"
      className="w-full text-center text-sm"
      style={{
        backgroundColor: "var(--brand-chrome)",
        color: "var(--brand-chrome-fg)",
      }}
    >
      <div className="mx-auto flex h-12 max-w-[var(--content-max)] items-center justify-center px-6">
        © {year} <BrandedLink href="/">tullyelly</BrandedLink>. All rights
        reserved.
      </div>
    </footer>
  );
}
