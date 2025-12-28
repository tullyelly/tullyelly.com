import { notFound } from "next/navigation";
import { makeDetailGenerateMetadata } from "@/lib/seo/factories";
import { getScroll } from "@/lib/scrolls";
import { renderScrollsPage } from "../renderScrollsPage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const generateMetadata = makeDetailGenerateMetadata({
  pathBase: "/mark2/shaolin-scrolls",
  fetcher: async (id: string) => await getScroll(id),
  resolve: (release) => {
    const id = String(release.id);
    const name = release.release_name || `Release ${id}`;
    const status = release.status ?? "unknown";
    const date = release.release_date ?? "";
    const title = `Scroll ${id}; ${name}`;
    const description = `Shaolin Scroll ${id} (${status})${date ? `; released ${date}` : ""}.`;
    return {
      title,
      description,
      canonicalPath: `/mark2/shaolin-scrolls/${id}`,
      index: true,
    };
  },
});

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    q?: string;
    sort?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const release = await getScroll(id);
  if (!release) return notFound();
  return renderScrollsPage(searchParams);
}
