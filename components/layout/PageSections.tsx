import type { ReactNode } from "react";
import { Card } from "@ui";
import SectionHeader from "./SectionHeader";

export type PageSection = {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
};

/** Composition keeps authored media and domain modules owned by their caller. */
export default function PageSections({
  sections,
}: {
  sections: PageSection[];
}) {
  return (
    <>
      {sections.length > 1 ? (
        <nav
          aria-label="On this page"
          className="flex flex-wrap gap-3 border-y border-[var(--border)] py-3"
        >
          {sections.map((section) => (
            <a
              className="link-blue rounded px-2 py-2 text-sm"
              key={section.id}
              href={`#${section.id}`}
            >
              {section.title}
            </a>
          ))}
        </nav>
      ) : null}
      {sections.map((section) => (
        <Card
          as="section"
          key={section.id}
          aria-labelledby={`${section.id}-heading`}
          id={section.id}
          className="min-w-0 scroll-mt-24 space-y-4"
        >
          <SectionHeader
            id={`${section.id}-heading`}
            title={section.title}
            description={section.description}
          />
          {section.content}
        </Card>
      ))}
    </>
  );
}
