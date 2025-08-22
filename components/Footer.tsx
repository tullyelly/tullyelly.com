// components/Footer.tsx
"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer role="contentinfo" className="w-full bg-[#0077C0] text-white">
      <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm">
        © {new Date().getFullYear()}{" "}
        <Link href="/" className="underline">
          tullyelly
        </Link>{" "}
        All rights reserved.
      </div>
    </footer>
  );
}
