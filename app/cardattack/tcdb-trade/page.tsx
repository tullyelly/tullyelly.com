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
