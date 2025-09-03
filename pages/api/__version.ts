import type { NextApiRequest, NextApiResponse } from "next";
import { getBuildInfo } from "@/lib/build-info";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const info = await getBuildInfo();
    res.status(200).json({
      ok: true,
      buildIso: info.builtAt ?? "",
      commitSha: info.commit ?? "",
      shortCommit: info.commit ?? "",
      branch: info.branch ?? "",
      version: info.version ?? "",
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
