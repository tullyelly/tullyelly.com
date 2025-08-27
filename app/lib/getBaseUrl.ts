export function getBaseUrl() {
  // 1) Client: use relative
  if (typeof window !== "undefined") return "";

  // 2) Vercel: use VERCEL_URL (no protocol)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // 3) Fallback: use SITE_URL if provided
  if (process.env.SITE_URL) return process.env.SITE_URL;

  // 4) Dev/server fallback
  return "http://localhost:3000";
}
