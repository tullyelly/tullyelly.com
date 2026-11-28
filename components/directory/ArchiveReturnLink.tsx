"use client";
import DirectoryReturnLink from "./DirectoryReturnLink";
import { useDirectorySearch } from "./useDirectoryField";
import { getArchiveReturnDirectory } from "@/lib/archive-return";

export default function ArchiveReturnLink() {
  const candidate = new URLSearchParams(useDirectorySearch()).get("returnTo");
  const source = getArchiveReturnDirectory(candidate);
  return source ? (
    <div className="mb-4">
      <DirectoryReturnLink directory={source.path} className="btn">
        {source.label}
      </DirectoryReturnLink>
    </div>
  ) : null;
}
