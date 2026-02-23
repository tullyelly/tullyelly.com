import type { Route } from "next";
import Link from "next/link";

import { getAllTableSchemaSummaries } from "@/lib/table-schema";

export default function TableSchemaDirectory() {
  const tableSchemas = getAllTableSchemaSummaries();

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-semibold leading-snug">
        Table Schema
      </h2>
      <p className="text-[16px] md:text-[18px] text-muted-foreground">
        Restaurant visits tracked from chronicles, with average ratings by spot.
      </p>

      {tableSchemas.length > 0 ? (
        <ul className="space-y-3">
          {tableSchemas.map((tableSchema) => (
            <li
              key={tableSchema.tableSchemaId}
              className="rounded-xl border border-border/60 bg-white p-4 shadow-sm"
            >
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-semibold leading-snug">
                  {tableSchema.tableSchemaName}
                </h3>
                <p className="text-[16px] md:text-[18px] text-muted-foreground">
                  {`Average rating: ${tableSchema.averageRating.toFixed(1)}/10`}{" "}
                  <Link
                    href={
                      `/unclejimmy/table-schema/${tableSchema.tableSchemaId}` as Route
                    }
                    className="link-blue whitespace-nowrap"
                  >
                    view visits
                  </Link>
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          No Table Schema visits are published yet.
        </p>
      )}
    </section>
  );
}
