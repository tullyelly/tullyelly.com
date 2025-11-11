"use client";

import Link from "next/link";
import { PropsWithChildren } from "react";

interface SmartLinkProps extends PropsWithChildren {
  href: string;
}

export default function SmartLink({ href, children }: SmartLinkProps) {
  const isExternal =
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//");
  const linkClassName = "underline hover:no-underline text-primary";

  // External links -> open in new tab, skip prefetching
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {children}
      </a>
    );
  }

  // Internal links -> Next.js navigation with relaxed typing
  return (
    <Link
      href={href as unknown as any}
      prefetch={false}
      className={linkClassName}
    >
      {children}
    </Link>
  );
}
