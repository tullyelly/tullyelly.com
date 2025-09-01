import dynamic from 'next/dynamic';

const ActionBarClient = dynamic(() => import('./ActionBar.client'), { ssr: false });

export type ActionBarProps = {
  q: string | null;
};

export default function ActionBar({ q }: ActionBarProps) {
  // Server-rendered, deterministic skeleton. Client enhances after mount.
  return (
    <section id="action-zone" className="flex flex-wrap items-center gap-3">
      <button type="button" aria-label="Create Patch" data-btn-slot="patch" className="rounded border px-2 py-1">
        Create Patch
      </button>
      <button type="button" aria-label="Create Minor" data-btn-slot="minor" className="rounded border px-2 py-1">
        Create Minor
      </button>
      <div data-input-slot="search" className="inline-block align-middle" />
      <ActionBarClient q={q ?? ''} />
    </section>
  );
}

