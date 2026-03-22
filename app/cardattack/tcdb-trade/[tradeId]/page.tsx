import { permanentRedirect } from "next/navigation";

type Params = { tradeId: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { tradeId } = await params;
  permanentRedirect(`/cardattack/tcdb-trades/${tradeId}`);
}
