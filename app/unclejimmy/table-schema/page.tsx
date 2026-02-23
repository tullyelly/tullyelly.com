import { Card } from "@ui";

import TableSchemaDirectory from "@/components/unclejimmy/TableSchemaDirectory";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

const pageTitle = "table schema | 🎙unclejimmy";
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

export default function UncleJimmyTableSchemaPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-10 mt-8 md:mt-10">
      <Card as="section" className="space-y-8 p-6 md:p-8">
        <TableSchemaDirectory />
      </Card>
    </article>
  );
}
