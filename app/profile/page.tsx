import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountsTable } from "@/components/profile/AccountsTable";
import { FeaturesChips } from "@/components/profile/FeaturesChips";
import { IdentityCard } from "@/components/profile/IdentityCard";
import { MembershipsTable } from "@/components/profile/MembershipsTable";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { RawJsonPanel } from "@/components/profile/RawJsonPanel";
import { SessionDetails } from "@/components/profile/SessionDetails";
import { SessionsTable } from "@/components/profile/SessionsTable";
import { getCurrentUser } from "@/lib/auth/session";
import { getProfileData } from "@/lib/profile/getProfileData";
import { redactSecrets } from "@/lib/profile/redact";

const title = "Profile | tullyelly";

export const metadata = {
  title,
  description: "Profile; account and auth details.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    const hdrs = await headers();
    const candidates = [
      "/profile",
      hdrs.get("next-url"),
      hdrs.get("x-invoke-path"),
      hdrs.get("x-matched-path"),
    ];
    const resolvedCallback =
      candidates.find((value) => value && value.startsWith("/")) ?? "/profile";
    const qs = new URLSearchParams({
      callbackUrl: resolvedCallback,
    }).toString();
    redirect(`/login?${qs}`);
  }

  const profile = redactSecrets(await getProfileData(user));
  const revisionMismatch =
    (profile.sessionSnapshot?.authzRevision ?? 0) !==
    (profile.revision.db ?? 0);
  const counts = {
    accounts: profile.accounts.length,
    sessions: profile.sessions.length,
    memberships: profile.memberships.length,
    features: profile.effectiveFeatures.length,
  };

  const tabs = [
    {
      key: "auth",
      label: "Auth",
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Accounts</h3>
            <AccountsTable accounts={profile.accounts} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Sessions</h3>
            <SessionsTable sessions={profile.sessions} />
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-semibold">Verification tokens</h4>
                <p className="text-sm text-muted-foreground">
                  Count only; tokens are never shown.
                </p>
              </div>
              <div className="text-2xl font-bold">
                {profile.verificationTokenCount}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "authorization",
      label: "Authorization",
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Memberships</h3>
            <MembershipsTable memberships={profile.memberships} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Effective features</h3>
            <FeaturesChips features={profile.effectiveFeatures} />
          </div>
        </div>
      ),
    },
    {
      key: "session",
      label: "Session",
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Session snapshot</h3>
          <SessionDetails snapshot={profile.sessionSnapshot} />
        </div>
      ),
    },
    {
      key: "raw",
      label: "Raw",
      content: (
        <RawJsonPanel
          items={[
            { id: "identity", title: "Identity", data: profile.user },
            {
              id: "session",
              title: "Session snapshot",
              data: profile.sessionSnapshot,
            },
            {
              id: "auth",
              title: "Auth schema",
              data: {
                user: profile.user,
                accounts: profile.accounts,
                sessions: profile.sessions,
                verificationTokenCount: profile.verificationTokenCount,
              },
            },
            {
              id: "authz",
              title: "Dojo authz",
              data: {
                memberships: profile.memberships,
                effectiveFeatures: profile.effectiveFeatures,
                revision: profile.revision,
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <ProfileHeader
        role={profile.sessionSnapshot?.role ?? "user"}
        revisionMismatch={revisionMismatch}
        counts={counts}
      />

      <IdentityCard user={profile.user} revision={profile.revision} />

      <ProfileTabs tabs={tabs} />
    </main>
  );
}
