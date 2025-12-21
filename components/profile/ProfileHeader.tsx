import { displayValue } from "@/components/profile/utils";

type ProfileHeaderProps = {
  role?: string | null;
  revisionMismatch: boolean;
  counts: {
    accounts: number;
    sessions: number;
    memberships: number;
    features: number;
  };
};

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "warning";
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide";
  const toneClass =
    tone === "warning"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-foreground";
  return <span className={`${base} ${toneClass}`}>{children}</span>;
}

export function ProfileHeader({
  role,
  revisionMismatch,
  counts,
}: ProfileHeaderProps) {
  const resolvedRole = displayValue(role ?? "user").toLowerCase();
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-lg text-muted-foreground">
          Account, session, and authorization details.
        </p>
      </div>
      <div className="flex flex-col items-start gap-3 text-sm md:items-end">
        <div className="flex flex-wrap gap-2">
          <Badge>Role: {resolvedRole}</Badge>
          <Badge tone={revisionMismatch ? "warning" : "default"}>
            {revisionMismatch ? "Revision mismatch" : "Revision ok"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-muted-foreground">
          <span>Accounts: {counts.accounts}</span>
          <span>Sessions: {counts.sessions}</span>
          <span>Memberships: {counts.memberships}</span>
          <span>Features: {counts.features}</span>
        </div>
      </div>
    </header>
  );
}
