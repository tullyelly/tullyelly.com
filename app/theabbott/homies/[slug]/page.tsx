import IdentityDetailPage from "@/components/identity/IdentityDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <IdentityDetailPage
      slug={slug}
      context="theabbott"
      kind="person"
      noun="Homie"
      directoryHref="/theabbott/homies"
    />
  );
}
