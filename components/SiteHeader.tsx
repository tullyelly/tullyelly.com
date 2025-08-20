"use client";

/**
 * Global site header & navigation.
 * - Applies across all routes via app/layout.tsx.
 * - Uses global tokens (--blue-header, --header-fg, etc.).
 * - Announcement rail dismissal persists with localStorage key `site-rail-dismissed`.
 * - Pages that include `.has-hero` start transparent and solidify on scroll.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [solid, setSolid] = useState(true);

  useEffect(() => {
    const hasHero =
      document.body.classList.contains("has-hero") ||
      document.querySelector("main")?.classList.contains("has-hero");
    if (hasHero) {
      setSolid(false);
      const onScroll = () => {
        if (window.scrollY > 80) {
          setSolid(true);
        } else {
          setSolid(false);
        }
      };
      window.addEventListener("scroll", onScroll);
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, []);

  const toggleMenu = () => setMenuOpen((o) => !o);

  return (
    <header className={`site-header ${solid ? "solid" : "transparent"}`}>
      <div className="container header-inner">
        <Link href="/" className="brand">
          tullyelly
        </Link>
        <nav className={`nav ${menuOpen ? "open" : ""}`} aria-label="Main">
          <ul className="nav-links">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/docs">Docs</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
          <div className="nav-cta">
            <Link href="/get-started" className="cta">
              Get Started
            </Link>
            <button className="util-btn" aria-label="Search">
              🔍
            </button>
            <button className="util-btn" aria-label="User">
              👤
            </button>
          </div>
        </nav>
        <button
          className="menu-toggle"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          ☰
        </button>
      </div>
    </header>
  );
}
