import Link from "next/link";

export default function Forbidden({ feature }: { feature?: string }) {
  return (
    <div
      role="alert"
      className="rounded border border-[var(--border-subtle)] p-4 space-y-2"
    >
      <div className="font-semibold">You don’t have access.</div>
      {feature ? (
        <div className="opacity-80">
          Missing permission: <code className="font-mono">{feature}</code>
        </div>
      ) : null}
      <div>
        <Link className="underline" href="/">
          Return home
        </Link>
      </div>
    </div>
  );
}
