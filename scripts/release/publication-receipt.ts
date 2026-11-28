/** Read one small report from the exact run/attempt artifact; never extract files. */
import { inflateRawSync } from "node:zlib";
import { z } from "zod";
import { RELEASE_REPOSITORY, type Api } from "./app";
import type {
  PublicationReceipt,
  PublicationRun,
} from "./publication-progress";

export function reportFromZip(bytes: Buffer): string {
  if (bytes.length > 10 * 1024 * 1024)
    throw new Error("Receipt archive too large");
  let end = bytes.length - 22;
  for (; end >= Math.max(0, bytes.length - 65557); end--)
    if (bytes.readUInt32LE(end) === 0x06054b50) break;
  if (
    end < 0 ||
    bytes.readUInt32LE(end) !== 0x06054b50 ||
    end + 22 + bytes.readUInt16LE(end + 20) !== bytes.length
  )
    throw new Error("Invalid receipt archive");
  const count = bytes.readUInt16LE(end + 10);
  if (count > 64) throw new Error("Too many receipt entries");
  let offset = bytes.readUInt32LE(end + 16);
  let found: string | undefined;
  for (let i = 0; i < count; i++) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50)
      throw new Error("Invalid receipt directory");
    const flags = bytes.readUInt16LE(offset + 8),
      method = bytes.readUInt16LE(offset + 10);
    const compressed = bytes.readUInt32LE(offset + 20),
      size = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28),
      extra = bytes.readUInt16LE(offset + 30),
      comment = bytes.readUInt16LE(offset + 32);
    const name = bytes
      .subarray(offset + 46, offset + 46 + nameLength)
      .toString("utf8");
    const local = bytes.readUInt32LE(offset + 42);
    offset += 46 + nameLength + extra + comment;
    if (name !== "release-report.jsonl") continue;
    if (
      found !== undefined ||
      flags & 1 ||
      ![0, 8].includes(method) ||
      compressed > 1024 * 1024 ||
      size > 1024 * 1024 ||
      bytes.readUInt32LE(local) !== 0x04034b50
    )
      throw new Error("Invalid receipt entry");
    const start =
      local +
      30 +
      bytes.readUInt16LE(local + 26) +
      bytes.readUInt16LE(local + 28);
    const payload = bytes.subarray(start, start + compressed);
    const report =
      method === 8
        ? inflateRawSync(payload, { maxOutputLength: 1024 * 1024 })
        : payload;
    if (report.length !== size) throw new Error("Incomplete receipt entry");
    found = report.toString("utf8");
  }
  if (found === undefined) throw new Error("Receipt report missing");
  return found;
}
export function receiptFromReport(
  report: string,
  run: PublicationRun,
): PublicationReceipt | undefined {
  const events: Record<string, unknown>[] = report
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const context = events.find(
    (e) =>
      e.event === "context" &&
      e.revision === run.head_sha &&
      e.workflowRunId === String(run.id) &&
      e.workflowRunAttempt === String(run.run_attempt) &&
      e.workflowRevision === run.head_sha,
  );
  if (!context) return;
  const result = events.filter((e) => e.event === "release-result").at(-1);
  if (
    !result ||
    result.deployment_succeeded !== true ||
    typeof result.public_verified !== "boolean" ||
    typeof result.deploymentId !== "string" ||
    !/^dpl_[A-Za-z0-9]{1,80}$/.test(result.deploymentId)
  )
    return;
  return {
    deployment: result.deploymentId,
    publicVerified: result.public_verified,
  };
}
export async function downloadPublicationReceipt(
  run: PublicationRun,
  token: string,
  api: Api,
  fetcher: typeof fetch = fetch,
) {
  try {
    const base = `/repos/${RELEASE_REPOSITORY}`;
    const artifacts = z
      .object({
        total_count: z.number().max(100),
        artifacts: z.array(
          z.object({
            id: z.number().int().positive(),
            name: z.string(),
            expired: z.boolean(),
          }),
        ),
      })
      .parse(
        await api(
          `${base}/actions/runs/${run.id}/artifacts?per_page=100`,
          token,
        ),
      );
    const matches = artifacts.artifacts.filter(
      (a) =>
        a.name === `release-report-production-${run.id}-${run.run_attempt}` &&
        !a.expired,
    );
    if (matches.length !== 1) return;
    const response = await fetcher(
      `https://api.github.com${base}/actions/artifacts/${matches[0].id}/zip`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (response.status !== 302) return;
    const location = new URL(response.headers.get("location") ?? "");
    if (
      location.protocol !== "https:" ||
      location.username ||
      location.password ||
      location.hash ||
      ![
        ".blob.core.windows.net",
        ".actions.githubusercontent.com",
        ".githubusercontent.com",
      ].some((host) => location.hostname.endsWith(host))
    )
      return;
    const archive = await fetcher(location, {
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (
      archive.status !== 200 ||
      Number(archive.headers.get("content-length") ?? 0) > 10 * 1024 * 1024
    )
      return;
    return receiptFromReport(
      reportFromZip(Buffer.from(await archive.arrayBuffer())),
      run,
    );
  } catch {
    return;
  } // Missing/expired evidence is never reported as public success.
}
