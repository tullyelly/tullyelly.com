import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, openSync, closeSync, unlinkSync } from "node:fs";
import { pathToFileURL } from "node:url";

const keyPattern = /^WU-\d+$/;
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
export function chicagoDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(now);
}
// Candidates come from live Jira status plus local/remote Git discovery.
// Keep existing names: the epic association is verified, not guessed from spelling.
export function selectBranch(candidates, { epic, day }) {
  const eligible = candidates.filter(
    (c) => c.epic === epic && c.day === day && c.open && !c.merged,
  );
  const names = [...new Set(eligible.map((c) => c.branch))];
  if (names.length > 1)
    throw new Error(
      "Multiple eligible epic branches; select the existing shared branch.",
    );
  if (names.length === 1) return names[0];
  if (candidates.some((c) => c.epic === epic))
    throw new Error(
      "Only stale, closed or merged epic context exists; reselect before creating a branch.",
    );
  return null; // Caller may create from verified main after fresh remote inspection.
}
export function validate({ active, context, branch, message, paths, day }) {
  for (const field of ["epic", "branch", "day", "timezone"]) {
    if (context[field] !== active[field])
      throw new Error(
        `Context ${field} conflicts with shared epic; refresh your own session context.`,
      );
  }
  if (active.timezone !== "America/Chicago" || active.day !== day)
    throw new Error(
      "Active day is stale; reselect the epic before committing.",
    );
  if (!keyPattern.test(active.epic) || branch !== active.branch)
    throw new Error("Checkout does not match the selected epic branch.");
  if (
    !context.verifiedAt ||
    !Number.isFinite(Date.parse(context.verifiedAt)) ||
    !context.items?.length
  )
    throw new Error("Live-verified Jira item context is required.");
  const keys = [...message.matchAll(/\[(WU-\d+)\]/g)].map((m) => m[1]);
  if (!keys.length || !message.startsWith(`[${keys[0]}]`))
    throw new Error("Start the commit message with the selected [WU-key].");
  const selected = new Set(keys);
  if (
    selected.size !== context.items.length ||
    context.items.some((i) => !selected.has(i.key))
  )
    throw new Error(
      "Message keys must match your selected Jira items exactly.",
    );
  for (const item of context.items) {
    if (!keyPattern.test(item.key) || !["work", "content"].includes(item.kind))
      throw new Error("Invalid selected work item.");
    // This records explicit user authorization; it never changes Jira hierarchy.
    const exception = item.branchException;
    const authorizedDate = new Date(exception?.authorizedAt ?? "");
    const authorizedException =
      exception?.epic === active.epic &&
      exception?.branch === active.branch &&
      Number.isFinite(authorizedDate.getTime()) &&
      chicagoDay(authorizedDate) === active.day &&
      typeof exception?.reason === "string" &&
      exception.reason.trim().length > 0;
    if (
      item.kind === "work" &&
      item.parent !== active.epic &&
      item.key !== active.epic &&
      !authorizedException
    )
      throw new Error(`${item.key} does not belong to ${active.epic}.`);
    if (
      item.kind === "content" &&
      paths.some(
        (p) =>
          !/^(content\/chronicles\/.*\.mdx|app\/.*\/page\.mdx|public\/images\/|lib\/images\/optimus-images-manifest\.json$)/.test(
            p,
          ),
      )
    )
      throw new Error(
        "Content exception contains non-content paths; split the staged changes.",
      );
    if (
      selected.size > 1 &&
      !message
        .split("\n")
        .some(
          (line) =>
            line.startsWith(`${item.key}: `) &&
            line.length > item.key.length + 2,
        )
    )
      throw new Error(`Combined commit requires a ${item.key}: scope line.`);
  }
  return keys;
}
function snapshot() {
  return {
    active: JSON.parse(readFileSync(".jira/active-epic.json", "utf8")),
    context: JSON.parse(
      readFileSync(process.env.JIRA_CONTEXT_FILE || "", "utf8"),
    ),
    branch: git("branch", "--show-current"),
    paths: git("diff", "--cached", "--name-only", "-z")
      .split("\0")
      .filter(Boolean),
    day: chicagoDay(),
  };
}
export function run(args) {
  const [command, ...rest] = args;
  if (command === "prepare") {
    const file = rest[0];
    const message = readFileSync(file, "utf8");
    const state = snapshot();
    if (!/^\[WU-\d+\]/.test(message) && state.context.items?.length === 1) {
      // Only the user's session-selected, verified key can be inserted.
      const next = `[${state.context.items[0].key}] ${message}`;
      validate({ ...state, message: next });
      execFileSync("node", [
        "-e",
        'require("fs").writeFileSync(process.argv[1],process.argv[2])',
        file,
        next,
      ]);
    }
    return;
  }
  if (command === "check") {
    validate({ ...snapshot(), message: readFileSync(rest[0], "utf8") });
    return;
  }
  if (command !== "commit")
    throw new Error(
      "Use prepare MESSAGE_FILE, check MESSAGE_FILE, or commit HEAD TREE MESSAGE.",
    );
  const [head, tree, message] = rest;
  const lock = git("rev-parse", "--git-path", "jira-mutation.lock");
  let fd;
  try {
    fd = openSync(lock, "wx");
  } catch {
    throw new Error(
      "Another shared-branch mutation holds jira-mutation.lock; coordinate before retrying.",
    );
  }
  try {
    validate({ ...snapshot(), message });
    if (git("rev-parse", "HEAD") !== head || git("write-tree") !== tree)
      throw new Error(
        "HEAD or index advanced; review and recapture the staged diff.",
      );
    const result = spawnSync("git", ["commit", "-m", message], {
      stdio: "inherit",
    });
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw new Error(
        "Git commit failed; inspect hooks and index before retrying.",
      );
  } finally {
    closeSync(fd);
    unlinkSync(lock);
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    run(process.argv.slice(2));
  } catch (error) {
    console.error(`Jira workflow: ${error.message}`);
    process.exitCode = 1;
  }
}
