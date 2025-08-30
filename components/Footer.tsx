import BrandedLink from "@/components/BrandedLink";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="w-full text-center text-sm"
      style={{ backgroundColor: "var(--brand-chrome)", color: "var(--brand-chrome-fg)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-6">
        © <BrandedLink href="/">tullyelly</BrandedLink>. All rights reserved.
      </div>
    </footer>
  );
}
