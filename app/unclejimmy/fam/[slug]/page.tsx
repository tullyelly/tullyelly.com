import IdentityDetailPage from "@/components/identity/IdentityDetailPage";
import BonnibelPage from "@/app/unclejimmy/squad/bonnibel/page";
import JeffMeffPage from "@/app/unclejimmy/squad/jeff-meff/page";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "bonnibel") return <BonnibelPage />;
  if (slug === "jeff-meff") return <JeffMeffPage />;
  return (
    <IdentityDetailPage
      slug={slug}
      context="unclejimmy"
      kind="person"
      noun="Fam"
      directoryHref="/unclejimmy/fam"
      directoryLabel="Fam"
    />
  );
}
