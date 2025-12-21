/* eslint-disable @next/next/no-img-element */
import { CopyButton } from "@/components/profile/CopyButton";
import { displayValue, formatDateTime } from "@/components/profile/utils";
import type { SerializedUser } from "@/types/profile";

type IdentityCardProps = {
  user: SerializedUser | null;
  revision: { db: number; session: number };
};

function initialFromUser(user: SerializedUser | null): string {
  if (user?.name) return user.name.charAt(0).toUpperCase();
  if (user?.email) return user.email.charAt(0).toUpperCase();
  return "U";
}

export function IdentityCard({ user, revision }: IdentityCardProps) {
  const initial = initialFromUser(user);
  const userId = user?.id ?? "unknown";

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name ?? user.email ?? "User"}
                className="h-full w-full rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              initial
            )}
          </div>
          <div>
            <p className="text-base font-semibold">
              {displayValue(user?.name, "Unnamed user")}
            </p>
            <p className="text-sm text-muted-foreground">
              {displayValue(user?.email, "Email not set")}
            </p>
          </div>
        </div>
        <CopyButton value={userId} label="Copy user id" />
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-background p-3">
          <dt className="text-muted-foreground">User ID</dt>
          <dd className="break-all font-mono text-xs">{userId}</dd>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <dt className="text-muted-foreground">Email verified</dt>
          <dd className="font-medium">{formatDateTime(user?.emailVerified)}</dd>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <dt className="text-muted-foreground">Authz revision</dt>
          <dd className="font-medium">
            DB {revision.db} / Session {revision.session}
          </dd>
        </div>
      </dl>
    </section>
  );
}
