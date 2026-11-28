import { buildMetadata } from "@/lib/seo/builders";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
export const metadata = buildMetadata({
  title: "TCDb Trades | tullyelly",
  description: "The cardattack trade ledger and trading partners.",
  canonical: canonicalUrl("cardattack/tcdb-trades"),
});
import { permanentRedirect } from "next/navigation";
import { safeDirectoryReturn } from "@/lib/directory-state";
export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {}))
    if (typeof value === "string") params.set(key, value);
  permanentRedirect(
    safeDirectoryReturn(
      `/cardattack/tcdb-trades?${params}`,
      "/cardattack/tcdb-trades",
    ),
  );
}
