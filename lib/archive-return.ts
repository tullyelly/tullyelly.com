import { getPersonaReleaseFeed } from "@/lib/persona-release-feeds";

/** Resolve only known public archive destinations, never arbitrary return URLs. */
export function getArchiveReturnDirectory(candidate?: string | null) {
  const path = candidate?.split("?")[0];
  if (!path) return null;
  if (path === "/shaolin") return { path, label: "Back to Chronicles" };
  if (path === "/shaolin/tags") return { path, label: "Back to tag directory" };
  if (
    /^\/shaolin\/tags\/[^/?#\\]+$/.test(path) &&
    !/[\u0000-\u001f\u007f]/.test(path) &&
    new URL(path, "https://directory.invalid").pathname === path
  )
    return { path, label: "Back to tag archive" };
  const match = /^\/([a-z0-9]+)\/releases$/.exec(path);
  const persona = match && getPersonaReleaseFeed(match[1]);
  return persona ? { path, label: `Back to ${persona.label}` } : null;
}
