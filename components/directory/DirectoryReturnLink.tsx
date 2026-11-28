"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { safeDirectoryReturn } from "@/lib/directory-state";
import { useDirectorySearch } from "./useDirectoryField";

export default function DirectoryReturnLink({
  directory,
  children,
  className,
}: {
  directory: string;
  children: ReactNode;
  className?: string;
}) {
  const search = useDirectorySearch();
  const href = safeDirectoryReturn(
    new URLSearchParams(search).get("returnTo"),
    directory,
  );
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
