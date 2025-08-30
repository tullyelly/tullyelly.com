import { buildInfo } from "@/lib/build-info";

export default function BuildBadge() {
  if (buildInfo.isProd) return null;

  const commitSha = buildInfo.commit;
  const short = buildInfo.shortCommit || commitSha.slice(0, 7);
  const commitUrl = `https://github.com/tullyelly/tullyelly.com/commit/${commitSha}`;

  return (
    <a
      href={commitUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 text-xs opacity-80 hover:opacity-100 underline underline-offset-4"
      title={`Build ${short} @ ${buildInfo.buildIso} (${buildInfo.branch})`}
    >
      build {short}
    </a>
  );
}
