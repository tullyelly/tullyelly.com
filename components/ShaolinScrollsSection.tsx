import { Suspense } from 'react';
import FlowersInline from '@/components/flowers/FlowersInline';
import ScrollsTablePanel from '@/components/scrolls/ScrollsTablePanel';

export function ShaolinScrollsSection({ date }: { date?: string }) {
  return (
    <section aria-label="Latest Releases" className="space-y-2">
      <h2 className="flex items-baseline text-xl md:text-2xl font-semibold leading-snug">
        <span aria-hidden className="mr-2">📜</span>
        <span>
          Shaolin Scrolls{date && (
            <span className="whitespace-nowrap">; {date}</span>
          )}
        </span>
      </h2>
      <p className="text-sm md:text-[15px] text-muted-foreground">
        One of the first things I did was start building out a project plan and documenting it in Jira and Confluence.
        As part of that process, I designed a release system; major.minor.patch; to govern the entire creative space.
        Major meant direction shifts, minor captured meaningful progress, and patch handled the small calibrations.
        From there, I released the steps that carried me from then to now:
      </p>
      <Suspense fallback={<div className="rounded border bg-white p-4">Loading releases…</div>}>
        {/* Example usage: show compact list on homepage */}
        <ScrollsTablePanel limit={20} />
      </Suspense>
      
      <p className="text-sm md:text-[15px] text-muted-foreground">
        In less than 30 days, I have accumulated a project plan 260+ tasks long, holding 50+ pages of documentation, and I am 500+ commits deep. Nerd alert.
      </p>
      <p className="text-sm md:text-[15px] text-muted-foreground">
        I think I see something over there - hop aboard, kids.
      </p>

      {/* Closing acknowledgments */}
      <p className="mt-3 mb-0 text-sm md:text-[15px] text-muted-foreground">
        <FlowersInline>
          <a
            href="https://www.postgresql.org/"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            PostgreSQL
          </a>
          {', '}
          <a
            href="https://neon.tech/"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Neon
          </a>
          {' & '}
          <a
            href="https://www.jetbrains.com/datagrip/"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            DataGrip
          </a>
          {'; rekindled my database crush. '}
          {'I always '}
          <span aria-hidden>❤️</span>
          {' '}
          <a
            href="https://www.atlassian.com/"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Atlassian
          </a>
          {'.'}
        </FlowersInline>
      </p>
    </section>
  );
}
