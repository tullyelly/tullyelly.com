import { makeIdentityGenerateMetadata } from "@/lib/seo/identity-metadata";
import IdentityDetailPage from "@/components/identity/IdentityDetailPage";
import BonnibelPage, {
  metadata as bonnibelMetadata,
} from "@/app/unclejimmy/squad/bonnibel/page";
import JeffMeffPage, {
  metadata as jeffMeffMetadata,
} from "@/app/unclejimmy/squad/jeff-meff/page";

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

export const generateMetadata = makeIdentityGenerateMetadata({
  directory: "/unclejimmy/fam",
  kind: "person",
  noun: "Fam",
  authored: { bonnibel: bonnibelMetadata, "jeff-meff": jeffMeffMetadata },
});
