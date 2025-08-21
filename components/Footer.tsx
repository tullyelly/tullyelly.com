// components/Footer.tsx
"use client";

export default function Footer() {
  return (
    <footer role="contentinfo" className="w-full bg-great-lakes text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <nav aria-label="Footer — Explore">
            <ul className="flex flex-col items-center gap-2 md:items-start">
              <li>
                <a
                  href="/about"
                  className="text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className="text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  Blog
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Footer — Support">
            <ul className="flex flex-col items-center gap-2 md:items-start">
              <li>
                <a
                  href="/contact"
                  className="text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  Privacy
                </a>
              </li>
            </ul>
          </nav>
          <form className="flex flex-col items-center gap-2 md:items-start" action="#" method="post">
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              className="w-full rounded px-2 py-1 text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              placeholder="Email address"
            />
            <button
              type="submit"
              className="rounded bg-white px-3 py-1 text-great-lakes focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Join
            </button>
          </form>
        </div>
        <p className="mt-8 text-center text-sm">
          © {new Date().getFullYear()} tullyelly. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
