import { makeIdentityGenerateMetadata } from "@/lib/seo/identity-metadata";
import IdentityMusic from "@/components/theabbott/IdentityMusic";
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
      music={<IdentityMusic slug={slug} />}
      returnTo={returnTo}
      slug={slug}
      context="theabbott"
      kind="person"
      noun="Homie"
      directoryHref="/theabbott/homies"
      directoryLabel="Homies"
    />
  );
}

export const generateMetadata = makeIdentityGenerateMetadata({
  directory: "/theabbott/homies",
  kind: "person",
  noun: "Homie",
});
