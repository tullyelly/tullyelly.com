import Link from "next/link";
import { notFound } from "next/navigation";
import { getScroll } from "@/lib/scrolls";
import { formatReleaseDate } from "@/components/scrolls/formatReleaseDate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const release = await getScroll(id);
  if (!release) return notFound();
  return (
    <section className="flex min-h-screen flex-col gap-4">
      <h1 className="text-xl font-semibold">Release {release.id}</h1>
      <dl className="space-y-2">
        <div className="flex justify-between">
          <dt className="font-medium">Release Name</dt>
          <dd className="text-right">{release.release_name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-medium">Type</dt>
          <dd className="text-right">{release.release_type}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-medium">Status</dt>
          <dd className="text-right">{release.status}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-medium">Release Date</dt>
          <dd className="text-right">
            {formatReleaseDate(release.release_date)}
          </dd>
        </div>
        {release.label && (
          <div className="flex justify-between">
            <dt className="font-medium">Notes</dt>
            <dd className="text-right">{release.label}</dd>
          </div>
        )}
      </dl>
      <Link href="/shaolin-scrolls" className="link-blue w-fit">
        Back to list
      </Link>
    </section>
  );
}
