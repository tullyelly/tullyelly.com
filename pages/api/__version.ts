import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const { buildInfo } = await import("@/lib/build-info");
    res.status(200).json({
      ok: true,
      buildIso: buildInfo.buildIso ?? "",
      commitSha: buildInfo.commit ?? "",
      shortCommit: buildInfo.shortCommit ?? "",
      branch: buildInfo.branch ?? "",
    });
  } catch {
    const sha = process.env.GITHUB_SHA ?? "";
    res.status(200).json({
      ok: true,
      buildIso: "",
      commitSha: sha,
      shortCommit: sha.slice(0, 7),
      branch: process.env.GITHUB_REF_NAME ?? "",
      _note: "fallback payload",
    });
  }
}
