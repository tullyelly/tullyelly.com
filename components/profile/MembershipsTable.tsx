import { formatDateTime } from "@/components/profile/utils";
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
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
        <thead className="bg-muted/60">
          <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold [&>th]:text-muted-foreground">
            <th className="w-48">App</th>
            <th className="w-40">Role</th>
            <th className="w-56">Granted at</th>
            <th className="w-56">Email</th>
          </tr>
        </thead>
        <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
          {memberships.map((membership) => (
            <tr
              key={`${membership.userId}-${membership.appSlug}-${membership.role}-${membership.grantedAt ?? "none"}`}
            >
              <td className="font-medium">{membership.appSlug}</td>
              <td className="text-muted-foreground">{membership.role}</td>
              <td className="text-muted-foreground">
                {formatDateTime(membership.grantedAt)}
              </td>
              <td className="text-muted-foreground">
                {membership.email ?? "Unknown"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
