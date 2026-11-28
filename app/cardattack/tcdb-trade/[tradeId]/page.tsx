import { buildMetadata } from "@/lib/seo/builders";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tradeId } = await params;
  return buildMetadata({
    title: `TCDb Trade ${tradeId}`,
    description: `TCDb trade ${tradeId} detail page.`,
    canonical: canonicalUrl(
      `cardattack/tcdb-trades/${encodeURIComponent(tradeId)}`,
    ),
  });
}
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
