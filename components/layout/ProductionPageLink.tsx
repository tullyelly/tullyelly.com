"use client";

import { ExternalLink } from "lucide-react";
import { useSyncExternalStore } from "react";

const PRODUCTION_ORIGIN = "https://tullyelly.com";

function subscribe() {
  return () => undefined;
}

function getProductionHref() {
  const current = new URL(window.location.href);
  if (current.origin === PRODUCTION_ORIGIN) return null;
  return `${PRODUCTION_ORIGIN}${current.pathname}${current.search}${current.hash}`;
}

export default function ProductionPageLink() {
  const href = useSyncExternalStore(subscribe, getProductionHref, () => null);

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-current/25 px-3 py-1.5 text-xs font-semibold text-ink/70 no-underline transition hover:bg-ink/5 hover:text-ink"
      aria-label="View this page in production"
    >
      View production
      <ExternalLink aria-hidden="true" className="size-3.5" />
    </a>
  );
}
