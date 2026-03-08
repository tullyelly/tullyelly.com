import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@ui";

import FullBleedPage from "@/components/layout/FullBleedPage";
import TableSchemaSections from "@/components/unclejimmy/TableSchemaSections";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import {
  getAllTableSchemaSummaries,
  getTableSchemaPageData,
} from "@/lib/table-schema";

type Params = { id: string };

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams(): Params[] {
  const summaries = getAllTableSchemaSummaries();
  return summaries.map((summary) => ({ id: summary.tableSchemaId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const tableSchemaData = getTableSchemaPageData(id);
  const tableSchemaName =
    tableSchemaData?.tableSchemaName ?? `Table Schema ${id}`;
  const averageRating = tableSchemaData?.summary.averageRating ?? 0;
  const visitCount = tableSchemaData?.summary.visitCount ?? 0;
  const visitLabel = visitCount === 1 ? "visit" : "visits";
  const pageTitle = `${tableSchemaName} | 🎙unclejimmy table schema`;
  const pageDescription = `Average rating: ${averageRating.toFixed(
    1,
  )}/10 from ${visitCount} tracked ${visitLabel}.`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: canonicalUrl(`unclejimmy/table-schema/${id}`) },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `/unclejimmy/table-schema/${id}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: pageTitle,
      description: pageDescription,
    },
  };
}

export default async function UncleJimmyTableSchemaIdPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const tableSchemaData = getTableSchemaPageData(id);

  if (!tableSchemaData) {
    notFound();
  }

  const { sections, summary, tableSchemaName, tableSchemaUrl } = tableSchemaData;
  const visitLabel = summary.visitCount === 1 ? "visit" : "visits";

  return (
    <FullBleedPage>
      <Card
        as="section"
        className="space-y-4 border-0 shadow-none px-1 py-6 md:p-8"
      >
        <header className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            {tableSchemaName}
          </h1>
          <Link href="/unclejimmy/table-schema" className="link-blue">
            ← Back to table schema
          </Link>
          {tableSchemaUrl ? (
            <a
              href={tableSchemaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-blue"
            >
              
            </a>
          ) : null}
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            {`Average rating: ${summary.averageRating.toFixed(1)}/10 across ${summary.visitCount} ${visitLabel}`}
          </p>
        </header>
        <TableSchemaSections sections={sections} />
      </Card>
    </FullBleedPage>
  );
}
