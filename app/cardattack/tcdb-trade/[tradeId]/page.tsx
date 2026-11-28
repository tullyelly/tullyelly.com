import { permanentRedirect } from "next/navigation";
import {
  safeDirectoryReturn,
  withDirectoryReturn,
} from "@/lib/directory-state";
type Params = { tradeId: string };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams?: Promise<{ returnTo?: string | string[] }>;
}) {
  const { tradeId } = await params;
  const query = await searchParams;
  const candidate =
    typeof query?.returnTo === "string" ? query.returnTo : undefined;
  const href = `/cardattack/tcdb-trades/${encodeURIComponent(tradeId)}`;
  permanentRedirect(
    candidate
      ? withDirectoryReturn(
          href,
          safeDirectoryReturn(
            candidate,
            candidate.split("?")[0] === "/cardattack/hof"
              ? "/cardattack/hof"
              : "/cardattack/tcdb-trades",
          ),
        )
      : href,
  );
}
