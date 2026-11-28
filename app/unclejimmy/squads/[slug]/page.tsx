import { makeIdentityGenerateMetadata } from "@/lib/seo/identity-metadata";
import IdentityDetailPage from "@/components/identity/IdentityDetailPage";

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
  return (
    <IdentityDetailPage
      returnTo={returnTo}
      slug={slug}
      context="unclejimmy"
      kind="group"
      noun="Squad"
      directoryHref="/unclejimmy/squads"
      directoryLabel="Squads"
    />
  );
}

export const generateMetadata = makeIdentityGenerateMetadata({
  directory: "/unclejimmy/squads",
  kind: "group",
  noun: "Squad",
});
