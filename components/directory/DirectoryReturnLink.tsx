"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { safeDirectoryReturn } from "@/lib/directory-state";
import { useDirectorySearch } from "./useDirectoryField";

export default function DirectoryReturnLink({
  directory,
  alternatives = [],
  children,
  className,
}: {
  directory: string;
  alternatives?: string[];
  children: ReactNode;
  className?: string;
}) {
  const search = useDirectorySearch();
  const candidate = new URLSearchParams(search).get("returnTo");
  const expected =
    alternatives.find((path) => candidate?.split("?")[0] === path) ?? directory;
  const href = safeDirectoryReturn(candidate, expected);
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
