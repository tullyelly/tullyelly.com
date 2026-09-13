"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fmtDateTime } from "@/lib/datetime";
import { setPersistentBanner } from "@/lib/persistent-banner";
import { BusyButton } from "@/components/ui/busy-button";
import SectionHeader from "@/components/layout/SectionHeader";
import {
  MobileDataCard,
  MobileDataCardHeader,
  MobileDataEmptyState,
  MobileDataField,
  MobileDataGrid,
} from "@/components/ui/MobileDataCard";
import {
  Table,
  TableCell,
  TableEmptyRow,
  TableHeaderCell,
  TBody,
  THead,
} from "@/components/ui/Table";
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
        <SectionHeader
          title="Grant or Revoke Role"
          titleClassName="text-xl md:text-xl"
          description="Provide a user UUID and role; app slug is optional for global grants."
        />
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
        <SectionHeader
          title="Memberships"
          titleClassName="text-lg md:text-lg"
        />

        <ul className="mt-3 space-y-3 md:hidden">
          {rows.length > 0 ? (
            rows.map((row) => (
              <MobileDataCard
                key={`${row.user_id}-${row.role}-${formatApp(row.app_slug)}`}
              >
                <MobileDataCardHeader
                  eyebrow={formatApp(row.app_slug)}
                  title={row.email ?? "(unknown)"}
                  description={row.user_id}
                  trailing={
                    <BusyButton
                      type="button"
                      onClick={() => void handleRevoke(row)}
                      disabled={busy}
                      isLoading={busy}
                      loadingLabel="Working..."
                      variant="outline"
                      size="sm"
                    >
                      Revoke
                    </BusyButton>
                  }
                />
                <MobileDataGrid>
                  <MobileDataField label="Role">{row.role}</MobileDataField>
                  <MobileDataField label="Granted">
                    {fmtDateTime(row.granted_at)}
                  </MobileDataField>
                </MobileDataGrid>
              </MobileDataCard>
            ))
          ) : (
            <MobileDataEmptyState>
              No memberships recorded.
            </MobileDataEmptyState>
          )}
        </ul>

        <div className="mt-3">
          <Table density="compact" aria-label="Authorization memberships">
            <THead>
              <TableHeaderCell intent="name">Email</TableHeaderCell>
              <TableHeaderCell intent="identifier">User ID</TableHeaderCell>
              <TableHeaderCell intent="status">App</TableHeaderCell>
              <TableHeaderCell intent="status">Role</TableHeaderCell>
              <TableHeaderCell intent="date">Granted</TableHeaderCell>
              <TableHeaderCell intent="compact">Actions</TableHeaderCell>
            </THead>
            <TBody>
              {rows.length === 0 ? (
                <TableEmptyRow colSpan={6}>
                  No memberships recorded.
                </TableEmptyRow>
              ) : (
                rows.map((row) => (
                  <tr
                    key={`${row.user_id}-${row.role}-${formatApp(row.app_slug)}`}
                  >
                    <TableCell intent="name">
                      {row.email ?? "(unknown)"}
                    </TableCell>
                    <TableCell
                      intent="identifier"
                      className="font-mono text-xs"
                    >
                      {row.user_id}
                    </TableCell>
                    <TableCell intent="status">
                      {formatApp(row.app_slug)}
                    </TableCell>
                    <TableCell intent="status">{row.role}</TableCell>
                    <TableCell intent="date">
                      {fmtDateTime(row.granted_at)}
                    </TableCell>
                    <TableCell intent="compact">
                      <BusyButton
                        type="button"
                        onClick={() => void handleRevoke(row)}
                        disabled={busy}
                        isLoading={busy}
                        loadingLabel="Working..."
                        variant="outline"
                        size="sm"
                      >
                        Revoke
                      </BusyButton>
                    </TableCell>
                  </tr>
                ))
              )}
            </TBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
