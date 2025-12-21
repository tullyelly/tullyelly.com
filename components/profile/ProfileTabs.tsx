"use client";

import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type Tab = {
  key: string;
  label: string;
  content: React.ReactNode;
};

export function ProfileTabs({ tabs }: { tabs: Tab[] }) {
  const firstKey = useMemo(() => tabs[0]?.key ?? "", [tabs]);
  const [active, setActive] = useState(firstKey);

  if (!tabs.length) return null;

  return (
    <div className="space-y-6">
      <div className="hidden md:block">
        <div className="flex flex-wrap gap-2 border-b pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-semibold transition",
                active === tab.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground hover:bg-muted/80",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="pt-4">
          {tabs.find((tab) => tab.key === active)?.content}
        </div>
      </div>

      <div className="md:hidden">
        <Accordion type="single" collapsible defaultValue={firstKey}>
          {tabs.map((tab) => (
            <AccordionItem key={tab.key} value={tab.key}>
              <AccordionTrigger>{tab.label}</AccordionTrigger>
              <AccordionContent>{tab.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
