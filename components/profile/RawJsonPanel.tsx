"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type RawItem = {
  id: string;
  title: string;
  data: unknown;
};

export function RawJsonPanel({ items }: { items: RawItem[] }) {
  return (
    <Accordion
      type="multiple"
      className="divide-y rounded-xl border bg-card shadow-sm"
      defaultValue={[]}
    >
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>
            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
              {JSON.stringify(item.data, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
