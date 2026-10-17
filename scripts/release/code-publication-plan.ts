import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import matter from "gray-matter";
import { checkChroniclePublication } from "../check-chronicle-publication";
import { createCleanSource, sourceArchiveDigest } from "./code-source";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

export type PublicationPlan = {
  chronicles: Array<{
    path: string;
    title: string;
    date: string;
    text: string[];
  }>;
  assets: Array<{ path: string; sha256: string }>;
};
/** Compare approved source trees, independently of generated Contentlayer output. */
export function planPublicationChecks(
  previousSha: string,
  commit: string,
): PublicationPlan {
  if (![previousSha, commit].every((sha) => /^[a-f0-9]{40}$/.test(sha)))
    throw new Error("code.application-sha");
  const paths = execFileSync(
    "git",
    ["diff", "--name-only", "--diff-filter=AM", "-z", previousSha, commit],
    { encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean);
  const plan: PublicationPlan = { chronicles: [], assets: [] };
  let source: ReturnType<typeof createCleanSource> | undefined;
  const assets = new Map<string, string>();
  try {
    for (const path of paths) {
      if (/^content\/chronicles\/[a-z0-9-]+\.mdx$/.test(path)) {
        const data = matter(
          execFileSync("git", ["show", `${commit}:${path}`], {
            encoding: "utf8",
            maxBuffer: 4 * 1024 * 1024,
          }),
        ).data;
        if (data.draft === true || data.published === false) continue;
        if (typeof data.title !== "string" || !data.title.trim())
          throw new Error("code.publication-plan");
        source ??= createCleanSource({
          commit,
          sha256: sourceArchiveDigest(commit),
          teamId: "team_pB5TcLa7apLtPAiVrRbcjBG3",
          projectId: "prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU",
          temporaryDirectory: tmpdir(),
        });
        const slug = path.slice("content/chronicles/".length, -4);
        const ready = checkChroniclePublication(slug, source.directory);
        plan.chronicles.push({
          path: `/shaolin/${slug}`,
          title: ready.title,
          date: ready.date,
          text: ready.text,
        });
        for (const asset of ready.assets)
          assets.set(
            asset,
            createHash("sha256")
              .update(readFileSync(join(source.directory, "public", asset)))
              .digest("hex"),
          );
      }
      if (
        /^public\/images\/[A-Za-z0-9_./-]+\.(?:webp|png|jpe?g|gif|avif|svg)$/i.test(
          path,
        )
      ) {
        const bytes = execFileSync("git", ["show", `${commit}:${path}`], {
          maxBuffer: 64 * 1024 * 1024,
        });
        assets.set(
          path.slice("public".length),
          createHash("sha256").update(bytes).digest("hex"),
        );
      }
    }
    plan.assets = [...assets]
      .map(([path, sha256]) => ({ path, sha256 }))
      .sort((a, b) => a.path.localeCompare(b.path));
    if (plan.chronicles.length > 100 || plan.assets.length > 500)
      throw new Error("code.publication-plan");
    return plan;
  } finally {
    source?.dispose();
  }
}
