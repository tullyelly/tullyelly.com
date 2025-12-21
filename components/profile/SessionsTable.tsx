import { formatDateTime } from "@/components/profile/utils";
import type { SanitizedSession } from "@/types/profile";

export function SessionsTable({ sessions }: { sessions: SanitizedSession[] }) {
  if (!sessions.length) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        No sessions found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full min-w-[520px] table-fixed border-collapse text-sm">
        <thead className="bg-muted/60">
          <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold [&>th]:text-muted-foreground">
            <th className="w-56">User</th>
            <th className="w-40">Expires</th>
          </tr>
        </thead>
        <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
          {sessions.map((session) => (
            <tr key={`${session.userId ?? "unknown"}-${session.expires}`}>
              <td className="break-all font-mono text-xs">
                {session.userId ?? "Unknown"}
              </td>
              <td className="text-muted-foreground">
                {formatDateTime(session.expires)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
