import * as React from "react";

export function FlowersBlock({
  title = "Flowers",
  items = [] as React.ReactNode[],
}: {
  title?: string;
  items?: React.ReactNode[];
}) {
  return (
    <section
      className="space-y-3"
      aria-label="Acknowledgments"
      data-testid="flowers-ack"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length > 0 && (
        <ul className="list-disc pl-6 space-y-1">
          {items.map((it, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={i}>{it}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default FlowersBlock;
