export type ActionBarProps = { q: string | null };

const ENABLED = process.env.NEXT_PUBLIC_RELEASE_CREATION_ENABLED === '1';

export default function ActionBar({ q }: ActionBarProps) {
  const qVal = q ?? '';
  return (
    <section id="action-zone" className="flex flex-wrap items-center gap-3">
      {ENABLED ? (
        <>
          <form method="post" action="/api/releases/patch" className="inline">
            <input type="hidden" name="label" value={qVal} />
            <button type="submit" className="btn" aria-label="Create Patch">
              Create Patch
            </button>
          </form>
          <form method="post" action="/api/releases/minor" className="inline">
            <input type="hidden" name="label" value={qVal} />
            <button type="submit" className="btn" aria-label="Create Minor">
              Create Minor
            </button>
          </form>
        </>
      ) : null}

      <form role="search" action="/shaolin-scrolls" method="get" className="inline-flex items-center gap-2">
        <input
          name="q"
          type="search"
          placeholder="Search releases"
          aria-label="Search releases"
          defaultValue={qVal}
          className="form-input"
          autoComplete="off"
        />
        <button type="submit" className="btn">
          Search
        </button>
      </form>
    </section>
  );
}
