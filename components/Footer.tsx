"use client";

import Link from "next/link.js";
import { useCallback } from "react";

const links = {
  explore: [
    { href: "/work", label: "Work" },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About" },
  ],
  support: [
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
};

function SafeLink({ href, children }: { href: string; children: React.ReactNode }) {
  // Existence guard: if the route seems non-existent (heuristic), render <span>
  const isPlaceholder = href === "#" || href.trim() === "";
  if (isPlaceholder) return <span className="text-muted-foreground">{children}</span>;
  return (
    <Link
      href={href}
      className="hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground/30 rounded"
      onClick={() => {
        try {
          window.dispatchEvent(new CustomEvent("footer:link-click", { detail: { href } }));
        } catch {}
      }}
    >
      {children}
    </Link>
  );
}

export default function Footer() {
  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    if (!email) return;
    try {
      window.dispatchEvent(new CustomEvent("newsletter:submit", { detail: { email } }));
      // Placeholder: integrate with actual endpoint later.
      console.info("newsletter:submit", { email });
      form.reset();
    } catch {}
  }, []);

  return (
    <footer role="contentinfo" className="border-t">
      <div className="mx-auto max-w-7xl px-6 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="font-semibold tracking-tight">tullyelly</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Building clean, fast, vercel-native experiences on Next.js.
          </p>
        </div>

        {/* Explore */}
        <nav aria-label="Footer — Explore">
          <h3 className="text-sm font-medium">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {links.explore.map((l) => (
              <li key={l.href}>
                <SafeLink href={l.href}>{l.label}</SafeLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Support */}
        <nav aria-label="Footer — Support">
          <h3 className="text-sm font-medium">Support</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {links.support.map((l) => (
              <li key={l.href}>
                <SafeLink href={l.href}>{l.label}</SafeLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Newsletter + Social */}
        <div>
          <h3 className="text-sm font-medium">Stay in the loop</h3>
          <form className="mt-3 flex gap-2" onSubmit={onSubmit}>
            <label htmlFor="footer-email" className="sr-only">Email address</label>
            <input
              id="footer-email"
              type="email"
              name="email"
              placeholder="you@domain.com"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              aria-label="Email address"
              required
            />
            <button
              type="submit"
              className="rounded-md border px-3 py-2 text-sm"
            >
              Join
            </button>
          </form>

          <ul className="mt-4 flex gap-3" aria-label="Social">
            <li>
              <a
                aria-label="GitHub"
                href="https://github.com/your-handle"
                className="hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground/30 rounded"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                aria-label="LinkedIn"
                href="https://www.linkedin.com/in/your-handle"
                className="hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground/30 rounded"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} tullyelly. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

