"use client";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="w-full text-center text-sm"
      style={{ backgroundColor: "var(--brand-chrome)", color: "var(--brand-chrome-fg)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-6">
        © {new Date().getFullYear()} tullyelly. All rights reserved.
      </div>
    </footer>
  );
}
