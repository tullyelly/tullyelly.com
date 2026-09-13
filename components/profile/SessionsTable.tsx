import { formatDateTime } from "@/components/profile/utils";
import {
  Table,
  TableCell,
  TableHeaderCell,
  TBody,
  THead,
} from "@/components/ui/Table";
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
    <Table showOnMobile density="compact" aria-label="Active sessions">
      <THead>
        <TableHeaderCell intent="grow">User</TableHeaderCell>
        <TableHeaderCell intent="date">Expires</TableHeaderCell>
      </THead>
      <TBody>
        {sessions.map((session) => (
          <tr key={`${session.userId ?? "unknown"}-${session.expires}`}>
            <TableCell intent="grow" className="break-all font-mono text-xs">
              {session.userId ?? "Unknown"}
            </TableCell>
            <TableCell intent="date" className="text-muted-foreground">
              {formatDateTime(session.expires)}
            </TableCell>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}
