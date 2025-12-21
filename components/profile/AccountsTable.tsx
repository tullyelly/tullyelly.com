import { formatDateTime } from "@/components/profile/utils";
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
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
        <thead className="bg-muted/60">
          <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold [&>th]:text-muted-foreground">
            <th className="w-32">Provider</th>
            <th className="w-28">Type</th>
            <th className="w-56">Provider Account ID</th>
            <th className="w-56">Scope</th>
            <th className="w-40">Expires</th>
          </tr>
        </thead>
        <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
          {accounts.map((account) => (
            <tr key={`${account.provider}-${account.providerAccountId}`}>
              <td className="font-medium">{account.provider ?? "Unknown"}</td>
              <td className="text-muted-foreground">{account.type ?? "N/A"}</td>
              <td className="break-all font-mono text-xs">
                {account.providerAccountId ?? "N/A"}
              </td>
              <td className="max-w-[240px] truncate text-muted-foreground">
                {account.scope ?? "Not set"}
              </td>
              <td className="text-muted-foreground">
                {formatDateTime(account.expires_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
