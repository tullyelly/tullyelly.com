import { formatDateTime } from "@/components/profile/utils";
import {
  Table,
  TableCell,
  TableHeaderCell,
  TBody,
  THead,
} from "@/components/ui/Table";
import type { AuthzMembership } from "@/types/profile";

export function MembershipsTable({
  memberships,
}: {
  memberships: AuthzMembership[];
}) {
  if (!memberships.length) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        No memberships found.
      </div>
    );
  }

  return (
    <Table showOnMobile density="compact" aria-label="Application memberships">
      <THead>
        <TableHeaderCell intent="name">App</TableHeaderCell>
        <TableHeaderCell intent="status">Role</TableHeaderCell>
        <TableHeaderCell intent="date">Granted at</TableHeaderCell>
        <TableHeaderCell intent="grow">Email</TableHeaderCell>
      </THead>
      <TBody>
        {memberships.map((membership) => (
          <tr
            key={`${membership.userId}-${membership.appSlug}-${membership.role}-${membership.grantedAt ?? "none"}`}
          >
            <TableCell intent="name" className="font-medium">
              {membership.appSlug}
            </TableCell>
            <TableCell intent="status" className="text-muted-foreground">
              {membership.role}
            </TableCell>
            <TableCell intent="date" className="text-muted-foreground">
              {formatDateTime(membership.grantedAt)}
            </TableCell>
            <TableCell intent="grow" className="text-muted-foreground">
              {membership.email ?? "Unknown"}
            </TableCell>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}
