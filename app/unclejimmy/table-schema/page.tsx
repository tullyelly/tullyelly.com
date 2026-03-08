import { Card } from "@ui";

import FullBleedPage from "@/components/layout/FullBleedPage";
import { getAllTableSchemaSummaries } from "@/lib/table-schema";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

import TableSchemaListClient from "./_components/TableSchemaListClient";

const pageTitle = "Table Schema | 🎙unclejimmy";
const pageDescription =
  "Table Schema tracks restaurant visits from chronicles and summarizes average ratings.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("unclejimmy/table-schema") },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/unclejimmy/table-schema",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export const dynamic = "force-static";
export const revalidate = 3600;

export default function UncleJimmyTableSchemaPage() {
  const tableSchemas = getAllTableSchemaSummaries();

  return (
    <FullBleedPage>
      <Card
        as="section"
        className="space-y-8 border-0 shadow-none px-1 py-6 md:p-8"
      >
        <header>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            Table Schema
          </h1>
        </header>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Running list of restaurants we have been visiting.
        </p>
        <TableSchemaListClient rows={tableSchemas} />
      </Card>
    </FullBleedPage>
  );
}
