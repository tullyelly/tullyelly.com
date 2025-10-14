"use client";

import Link from "next/link";

const LINKS = [
  { href: "/mark2", label: "mark2", tid: "e2e-nav-mark2" },
  { href: "/cardattack", label: "cardattack", tid: "e2e-nav-cardattack" },
  { href: "/theabbott", label: "theabbott", tid: "e2e-nav-theabbott" },
  { href: "/unclejimmy", label: "unclejimmy", tid: "e2e-nav-unclejimmy" },
  { href: "/tullyelly", label: "tullyelly", tid: "e2e-nav-tullyelly" },
];

export default function E2EOnlyNav() {
  return (
    <nav aria-label="E2E Nav" data-testid="e2e-nav" className="px-6 py-2">
      <ul className="flex gap-4 text-sm">
        {LINKS.map((link) => (
          <li key={link.tid}>
            <Link
              href={link.href}
              data-testid={link.tid}
              className="underline underline-offset-4"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
