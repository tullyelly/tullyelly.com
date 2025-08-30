"use client";

import { buildInfo } from "@/lib/build-info";

export default function BuildBadge() {
  if (buildInfo.env === "production") return null;

  const commitUrl = `https://github.com/tullyally/tullyelly.com/commit/${buildInfo.commitSha}`;
  const prUrl = buildInfo.prNumber
    ? `https://github.com/tullyally/tullyelly.com/pull/${buildInfo.prNumber}`
    : undefined;

  return (
    <div className="mt-2 text-xs">
      <a className="underline" href={commitUrl}>
        {buildInfo.commitShortSha}
      </a>
      {prUrl && (
        <>
          {" · "}
          <a className="underline" href={prUrl}>
            PR #{buildInfo.prNumber}
          </a>
        </>
      )}
      {" · "}
      {buildInfo.env} {" · "}
      {buildInfo.builtAt}
    </div>
  );
}
