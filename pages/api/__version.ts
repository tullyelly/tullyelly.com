import type { NextApiRequest, NextApiResponse } from "next";
import { buildInfo } from "@/lib/build-info";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    res.status(200).json({
      ok: true,
      buildIso: buildInfo.buildTime ?? "",
      commitSha: buildInfo.commit ?? "",
      shortCommit: (buildInfo.commit ?? '').slice(0, 7),
      branch: buildInfo.branch ?? "",
      version: buildInfo.version ?? "",
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
