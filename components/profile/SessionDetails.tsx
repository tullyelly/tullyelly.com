import { FeaturesChips } from "@/components/profile/FeaturesChips";
import { displayValue } from "@/components/profile/utils";
import type { SessionSnapshot } from "@/types/profile";

export function SessionDetails({
  snapshot,
}: {
  snapshot: SessionSnapshot | null;
}) {
  if (!snapshot) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        No session available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-background p-3">
            <dt className="text-muted-foreground">Session user ID</dt>
            <dd className="break-all font-mono text-xs">
              {displayValue(snapshot.id, "Unknown")}
            </dd>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">
              {displayValue(snapshot.email, "Email not set")}
            </dd>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">
              {displayValue(snapshot.name, "Name not set")}
            </dd>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <dt className="text-muted-foreground">Image</dt>
            <dd className="font-medium">
              {displayValue(snapshot.image, "Not set")}
            </dd>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium">
              {displayValue(snapshot.role, "user")}
            </dd>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <dt className="text-muted-foreground">Authz revision</dt>
            <dd className="font-medium">{snapshot.authzRevision}</dd>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <dt className="text-muted-foreground">Feature count</dt>
            <dd className="font-medium">{snapshot.features.length}</dd>
          </div>
        </dl>
      </div>
      <FeaturesChips features={snapshot.features} />
    </div>
  );
}
