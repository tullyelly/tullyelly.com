"use client";

import { useEffect, useState } from "react";

interface BuildInfo {
  commitSha: string;
  commitShortSha: string;
  ref?: string;
  prNumber?: string;
  env: string;
  url: string;
  runtime: string;
  builtAt: string;
}

export default function BuildBadge() {
  const [info, setInfo] = useState<BuildInfo | null>(null);

  useEffect(() => {
    fetch("/api/__version")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }, []);

  if (!info || info.env === "production") return null;

  const commitUrl = `https://github.com/tullyally/tullyelly.com/commit/${info.commitSha}`;
  const prUrl = info.prNumber
    ? `https://github.com/tullyally/tullyelly.com/pull/${info.prNumber}`
    : undefined;

  return (
    <div className="mt-2 text-xs">
      <a className="underline" href={commitUrl}>
        {info.commitShortSha}
      </a>
      {prUrl && (
        <>
          {" · "}
          <a className="underline" href={prUrl}>
            PR #{info.prNumber}
          </a>
        </>
      )}
      {" · "}
      {info.env} {" · "}
      {new Date(info.builtAt).toLocaleString()}
    </div>
  );
}
