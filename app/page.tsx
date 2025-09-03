export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import ScrollsTablePanel from '@/components/scrolls/ScrollsTablePanel';
import { nowIso, formatDateOnly } from '@/lib/format';

export default function Home() {
  const formatted = formatDateOnly(nowIso());
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <section aria-label="Chronicle of Chronicles" className="space-y-2">
        <h2 className="text-lg font-medium">📓 Chronicle of Chronicles — {formatted}</h2>
        <p className="text-sm">Intro paragraph placeholder for chronicle section.</p>
        <div className="space-y-2">
          <p>🎯 Purpose</p>
          <p>
            Capture the full set of Chronicle templates we use, explain them simply, and show how they form a
            complete system for building and recording work.
          </p>
          <p>🏗 Kickoff – Blueprint</p>
          <p>
            Used at the start of a project. Defines scope, breaks down Epics → Stories → Subtasks, and sets
            estimates. It’s the map before the journey.
          </p>
          <p>💡 Idea</p>
          <p>
            Used for early sparks—feature thoughts, business directions, design notions. Captures context so we can
            evaluate potential before committing.
          </p>
          <p>📊 Roundup</p>
          <p>
            Used after delivery or milestones. Summarizes results, notes lessons, and sets up next steps. The
            “after-action report.”
          </p>
          <p>🧠 Memory</p>
          <p>
            Used for truths and standards we want to keep. Palettes, conventions, workflows. The knowledge vault we
            can return to anytime.
          </p>
          <p>🎭 Prompt Pack</p>
          <p>
            Used for reusable AI prompts. Stores polished instructions so we can reuse them consistently. Our
            spellbook for automation.
          </p>
          <p>📜 Chronicle (Universal Root)</p>
          <p>
            The base template. Provides metadata, narrative, and labels. Every other template builds on this
            skeleton.
          </p>
          <p>🔄 Lifecycle Flow</p>
          <p>Together, the templates cover the full rhythm:</p>
          <p>Idea → Kickoff → Work → Roundup → Memory</p>
          <p>Prompt Packs and base Chronicles fit in wherever reusable knowledge is needed.</p>
          <p>🌟 Why It Works</p>
          <p>
            The system turns chaos into clarity. Every piece of work has a place, every template has a purpose, and
            over time it creates a living history that’s structured, searchable, and repeatable.
          </p>
        </div>
      </section>
      <section aria-label="Latest Releases" className="space-y-2">
        <h2 className="text-lg font-medium">Shaolin Scrolls — {formatted}</h2>
        <p className="text-sm">Intro paragraph placeholder for scrolls section.</p>
        <Suspense fallback={<div className="rounded border bg-white p-4">Loading releases…</div>}>
          {/* Example usage: show compact list on homepage */}
          <ScrollsTablePanel limit={20} />
        </Suspense>
      </section>
    </main>
  );
}
