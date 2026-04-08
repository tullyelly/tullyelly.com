export function slugifyChronicleTitle(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeSlugPath(value) {
  if (!value) return value;

  return value
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => {
      const trimmed = segment.trim();

      if (
        !trimmed ||
        trimmed === "." ||
        trimmed === ".." ||
        trimmed.includes("-") ||
        !/\s/.test(trimmed)
      ) {
        return trimmed;
      }

      return slugifyChronicleTitle(trimmed);
    })
    .join("/");
}
