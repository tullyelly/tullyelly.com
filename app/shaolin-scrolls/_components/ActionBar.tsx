import ActionBarClient from './ActionBar.client';

export type ActionBarProps = {
  q: string | null;
};

export default function ActionBar({ q }: ActionBarProps) {
  // Render the client leaf directly; its initial SSR output is deterministic
  // and matches the client hydration output (dialogs forceMount + hidden).
  return (
    <section id="action-zone" className="flex flex-wrap items-center gap-3">
      <ActionBarClient q={q ?? ''} />
    </section>
  );
}
