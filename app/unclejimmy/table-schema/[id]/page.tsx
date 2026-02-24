import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@ui";

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
  params: Params;
}): Promise<Metadata> {
  const { id } = params;
  const tableSchemaData = getTableSchemaPageData(id);
  const tableSchemaName =
    tableSchemaData?.tableSchemaName ?? `Table Schema ${id}`;
  const averageRating = tableSchemaData?.summary.averageRating ?? 0;
  const pageTitle = `${tableSchemaName} | 🎙unclejimmy table schema`;
  const pageDescription = `Average rating: ${averageRating.toFixed(
    1,
  )}/10 from tracked restaurant visits.`;

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
  params: Params;
}) {
  const { id } = params;
  const tableSchemaData = getTableSchemaPageData(id);

  if (!tableSchemaData) {
    notFound();
  }

  const { sections, summary, tableSchemaName } = tableSchemaData;

  return (
    <article className="max-w-3xl mx-auto space-y-10 mt-8 md:mt-10">
      <Card as="section" className="space-y-8 p-6 md:p-8">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            {tableSchemaName}
          </h1>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            {`Average rating: ${summary.averageRating.toFixed(1)}/10`}
          </p>
        </header>
        <TableSchemaSections sections={sections} />
      </Card>
    </article>
  );
}
