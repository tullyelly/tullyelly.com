import { formatDateTime } from "@/components/profile/utils";
import {
  Table,
  TableCell,
  TableHeaderCell,
  TBody,
  THead,
} from "@/components/ui/Table";
import type { SanitizedAccount } from "@/types/profile";

export function AccountsTable({ accounts }: { accounts: SanitizedAccount[] }) {
  if (!accounts.length) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        No accounts found.
      </div>
    );
  }

  return (
    <Table showOnMobile density="compact" aria-label="Connected accounts">
      <THead>
        <TableHeaderCell intent="name">Provider</TableHeaderCell>
        <TableHeaderCell intent="status">Type</TableHeaderCell>
        <TableHeaderCell intent="identifier">
          Provider Account ID
        </TableHeaderCell>
        <TableHeaderCell intent="descriptive">Scope</TableHeaderCell>
        <TableHeaderCell intent="date">Expires</TableHeaderCell>
      </THead>
      <TBody>
        {accounts.map((account) => (
          <tr key={`${account.provider}-${account.providerAccountId}`}>
            <TableCell intent="name" className="font-medium">
              {account.provider ?? "Unknown"}
            </TableCell>
            <TableCell intent="status" className="text-muted-foreground">
              {account.type ?? "N/A"}
            </TableCell>
            <TableCell intent="identifier" className="font-mono text-xs">
              {account.providerAccountId ?? "N/A"}
            </TableCell>
            <TableCell intent="descriptive" className="text-muted-foreground">
              {account.scope ?? "Not set"}
            </TableCell>
            <TableCell intent="date" className="text-muted-foreground">
              {formatDateTime(account.expires_at)}
            </TableCell>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}
