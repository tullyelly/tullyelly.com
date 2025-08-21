// components/Footer.tsx
"use client";

export default function Footer() {
  return (
    <footer role="contentinfo" className="w-full bg-great-lakes text-white">
      <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm">
        © {new Date().getFullYear()} tullyelly. All rights reserved.
      </div>
    </footer>
  );
}
