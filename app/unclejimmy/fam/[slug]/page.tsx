import IdentityDetailPage from "@/components/identity/IdentityDetailPage";
import BonnibelPage from "@/app/unclejimmy/squad/bonnibel/page";
import JeffMeffPage from "@/app/unclejimmy/squad/jeff-meff/page";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ returnTo?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const returnTo =
    typeof query?.returnTo === "string" ? query.returnTo : undefined;
  if (slug === "bonnibel") return <BonnibelPage />;
  if (slug === "jeff-meff") return <JeffMeffPage />;
  return (
    <IdentityDetailPage
      returnTo={returnTo}
      slug={slug}
      context="unclejimmy"
      kind="person"
      noun="Fam"
      directoryHref="/unclejimmy/fam"
      directoryLabel="Fam"
    />
  );
}
