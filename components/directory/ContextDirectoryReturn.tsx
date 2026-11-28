"use client";

import DirectoryReturnLink from "./DirectoryReturnLink";
import { useDirectorySearch } from "./useDirectoryField";

/** Only show an explicit browse return for a known source directory. */
export default function ContextDirectoryReturn({
  directory,
  label,
}: {
  directory: string;
  label: string;
}) {
  const candidate = new URLSearchParams(useDirectorySearch()).get("returnTo");
  if (candidate?.split("?")[0] !== directory) return null;
  return (
    <DirectoryReturnLink directory={directory} className="btn">
      {label}
    </DirectoryReturnLink>
  );
}
