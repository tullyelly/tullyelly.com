// components/Footer.tsx
"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className={[
        "w-full text-center text-sm",
        "bg-blue text-text-on-blue",
        "[&_a]:text-text-on-blue [&_a:visited]:text-text-on-blue [&_a:hover]:text-text-on-blue [&_a:focus]:text-text-on-blue",
        "[&_a]:no-underline [&_a:hover]:underline [&_a:focus]:underline [&_a]:underline-offset-4",
      ].join(" ")}
    >
      <div className="mx-auto max-w-7xl px-6 py-6">
        © {new Date().getFullYear()}{" "}
        <Link href="/" className="font-semibold">
          tullyelly
        </Link>
        . All rights reserved.
      </div>
    </footer>
  );
}