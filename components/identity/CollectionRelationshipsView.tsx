import { Card } from "@ui";
import TagLink from "@/components/tags/TagLink";
import { fmtDate } from "@/lib/datetime";
import type {
  CollectionRelationshipData,
  CollectionRelationshipMode,
} from "@/lib/collection-relationship-data";

const numberFormat = new Intl.NumberFormat("en-US");
export default function CollectionRelationshipsView({
  displayName,
  mode,
  data,
}: {
  displayName: string;
  mode: CollectionRelationshipMode;
  data: CollectionRelationshipData;
}) {
  const title =
    mode === "person"
      ? `Collections inspired by ${displayName}`
      : "Why I collect this";
  return (
    <>
      <Card as="section">
        <h2 className="!m-0 text-xl font-semibold">{title}</h2>
        {!data.available ? (
          <p role="status" className="mt-3 text-muted-foreground">
            Collection relationships are unavailable right now.
          </p>
        ) : data.entries.length === 0 ? (
          <p className="mt-3 text-muted-foreground">
            {mode === "person"
              ? "No inspired collections are recorded yet."
              : "No collection reasons are recorded yet."}
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {data.entries.map(({ motivation, counts }) => {
              const related =
                mode === "person" ? motivation.subject : motivation.person;
              return (
                <li
                  key={motivation.id}
                  className="min-w-0 rounded-xl border border-border p-4"
                >
                  <h3 className="!m-0 break-words text-lg font-semibold">
                    <TagLink tag={related.slug} className="link-blue">
                      {related.displayName}
                    </TagLink>
                  </h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5">
                    {motivation.reasons.map((reason) => (
                      <li key={reason.code} className="break-words">
                        {reason.explanation}
                      </li>
                    ))}
                  </ul>
                  {mode === "person" ? (
                    counts.length ? (
                      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                        {counts.map((count) => (
                          <li key={`${count.label}:${count.rankingAt}`}>
                            {count.label}:{" "}
                            {numberFormat.format(count.cardCount)} cards as of{" "}
                            <time dateTime={count.rankingAt}>
                              {fmtDate(count.rankingAt)}
                            </time>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Card count unavailable.
                      </p>
                    )
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {data.aliases.length ? (
        <Card as="section">
          <h2 className="!m-0 text-xl font-semibold">Alternate names</h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {data.aliases.map((alias) => (
              <li key={alias.id}>
                <TagLink tag={alias.slug} className="link-blue">
                  {alias.displayName}
                </TagLink>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
