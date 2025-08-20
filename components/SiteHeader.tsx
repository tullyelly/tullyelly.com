"use client";

/**
 * Global site header.
 * - Applies across all routes via app/layout.tsx.
 * - Uses global tokens (--blue-header, --header-fg, etc.).
 * - Announcement rail component exists but is hidden by default until activated.
 * - Pages that include `.has-hero` start transparent and solidify on scroll.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SiteHeader() {
  const [solid, setSolid] = useState(true);

  useEffect(() => {
    const hasHero =
      document.body.classList.contains("has-hero") ||
      document.querySelector("main")?.classList.contains("has-hero");
    if (hasHero) {
      setSolid(false);
      const onScroll = () => {
        setSolid(window.scrollY > 80);
      };
      window.addEventListener("scroll", onScroll);
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, []);

  return (
    <header className={`site-header ${solid ? "solid" : "transparent"}`}>
      <div className="container header-inner">
        <Link href="/" className="brand">
          tullyelly
        </Link>
      </div>
    </header>
  );
}
