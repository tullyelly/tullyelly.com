"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fmtDateTime } from "@/lib/datetime";
import { setPersistentBanner } from "@/lib/persistent-banner";
import { BusyButton } from "@/components/ui/busy-button";
import { grantRole, revokeRole } from "./actions";

export type MembershipRow = {
  user_id: string;
  email: string | null;
  app_slug: string | null;
  role: string;
  granted_at: string;
};

function formatApp(value: string | null): string {
  return value ?? "*global*";
}

function sortRows(rows: MembershipRow[]): MembershipRow[] {
  return rows.slice().sort((a, b) => {
    const emailA = (a.email ?? "").toLowerCase();
    const emailB = (b.email ?? "").toLowerCase();
    if (emailA !== emailB) return emailA.localeCompare(emailB);
    const appA = formatApp(a.app_slug);
    const appB = formatApp(b.app_slug);
    if (appA !== appB) return appA.localeCompare(appB);
    return a.role.localeCompare(b.role);
  });
}

export default function AdminAuthzPanel({
  initialMemberships,
}: {
  initialMemberships: MembershipRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isMutating, setIsMutating] = useState(false);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [appSlug, setAppSlug] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const busy = isPending || isMutating;

  function handleForbidden() {
    setPersistentBanner({
      message:
        "Your admin access has changed. Contact an administrator if you still need access.",
      variant: "warning",
    });
    startTransition(() => {
      router.replace("/");
    });
  }

  async function handleGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedUserId = userId.trim();
    const trimmedRole = role.trim();
    const trimmedApp = appSlug.trim();

    if (!trimmedUserId || !trimmedRole) {
      setError("User ID and role are required.");
      return;
    }

    setIsMutating(true);
    try {
      await grantRole({
        userId: trimmedUserId,
        role: trimmedRole,
        appSlug: trimmedApp ? trimmedApp : null,
      });
      startTransition(() => {
        router.refresh();
      });
      setUserId("");
      setRole("viewer");
      setEmail("");
      setAppSlug("");
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.toLowerCase().includes("forbidden")
      ) {
        handleForbidden();
        return;
      }
      setError(err instanceof Error ? err.message : "Grant failed.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleRevoke(row: MembershipRow) {
    setError(null);
    setIsMutating(true);
    try {
      await revokeRole({
        userId: row.user_id,
        role: row.role,
        appSlug: row.app_slug,
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.toLowerCase().includes("forbidden")
      ) {
        handleForbidden();
        return;
      }
      setError(err instanceof Error ? err.message : "Revoke failed.");
    } finally {
      setIsMutating(false);
    }
  }

  const rows = sortRows(initialMemberships);

  return (
    <div className="space-y-6">
      <section className="rounded border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">Grant or Revoke Role</h2>
        <p className="text-sm text-gray-500">
          Provide a user UUID and role; app slug is optional for global grants.
        </p>
        <form className="mt-4 space-y-3" onSubmit={handleGrant}>
          <div className="grid gap-3 md:grid-cols-5">
            <input
              className="w-full rounded border border-gray-300 p-2 text-sm"
              placeholder="User UUID"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              autoComplete="off"
              required
            />
            <input
              className="w-full rounded border border-gray-300 p-2 text-sm"
              placeholder="Email (optional)"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
            />
            <select
              className="w-full rounded border border-gray-300 p-2 text-sm"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="viewer">viewer</option>
              <option value="editor">editor</option>
              <option value="admin">admin</option>
            </select>
            <input
              className="w-full rounded border border-gray-300 p-2 text-sm"
              placeholder="App slug (blank = global)"
              value={appSlug}
              onChange={(event) => setAppSlug(event.target.value)}
              autoComplete="off"
            />
            <BusyButton
              type="submit"
              className="border border-gray-300 bg-gray-50 text-sm font-medium text-gray-900 hover:bg-gray-100"
              isLoading={busy}
              loadingLabel="Working..."
              disabled={busy}
              variant="outline"
            >
              Grant
            </BusyButton>
          </div>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Memberships</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 p-2">Email</th>
                <th className="border border-gray-200 p-2">User ID</th>
                <th className="border border-gray-200 p-2">App</th>
                <th className="border border-gray-200 p-2">Role</th>
                <th className="border border-gray-200 p-2">Granted</th>
                <th className="border border-gray-200 p-2 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    className="p-4 text-center text-sm text-gray-500"
                    colSpan={6}
                  >
                    No memberships recorded.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={`${row.user_id}-${row.role}-${formatApp(row.app_slug)}`}
                  >
                    <td className="border border-gray-200 p-2">
                      {row.email ?? "(unknown)"}
                    </td>
                    <td className="border border-gray-200 p-2 font-mono text-xs">
                      {row.user_id}
                    </td>
                    <td className="border border-gray-200 p-2">
                      {formatApp(row.app_slug)}
                    </td>
                    <td className="border border-gray-200 p-2">{row.role}</td>
                    <td className="border border-gray-200 p-2">
                      {fmtDateTime(row.granted_at)}
                    </td>
                    <td className="border border-gray-200 p-2 text-center">
                      <BusyButton
                        type="button"
                        className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-900 hover:bg-gray-100"
                        onClick={() => {
                          void handleRevoke(row);
                        }}
                        disabled={busy}
                        isLoading={busy}
                        loadingLabel="Working..."
                        variant="outline"
                        size="sm"
                      >
                        Revoke
                      </BusyButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
