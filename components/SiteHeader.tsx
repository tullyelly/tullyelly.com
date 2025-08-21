"use client";

import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="w-full bg-great-lakes text-white">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <Link href="/" className="font-semibold">
          tullyelly
        </Link>
      </div>
    </header>
  );
}
