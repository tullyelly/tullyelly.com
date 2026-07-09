export function assertValidDatabaseUrl(
  url: string | null,
  env: NodeJS.ProcessEnv = process.env,
) {
  if (env.VERCEL_ENV !== "production" || !url) return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Ignore parse errors; other checks will handle missing or bad URLs.
    return;
  }

  const badUser = parsed.username === "neondb_owner";
  const badDb = parsed.pathname.endsWith("/neondb");
  if (badUser || badDb) {
    throw new Error(
      "Invalid DATABASE_URL: neondb_owner/neondb detected. Update Production env to use tullyelly_admin and tullyelly_db.",
    );
  }
}
