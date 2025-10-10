"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandHomeLinkProps = {
  className?: string;
};

export default function BrandHomeLink({ className }: BrandHomeLinkProps) {
  return (
    <Link
      href="/"
      aria-label="Go to Home"
      className={cn(
        "inline-flex h-11 items-center rounded-full px-3 font-semibold tracking-tight text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        "md:h-10",
        className,
      )}
    >
      <span className="font-semibold leading-none">tullyelly</span>
    </Link>
  );
}
