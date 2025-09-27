import Forbidden from "@/components/auth/Forbidden";
import { getCurrentUser } from "@/lib/auth/session";
import { must } from "@/lib/authz";
import { headers } from "next/headers";

export default async function AuthzGate({
  feature,
  redirectOn401 = true,
  callbackUrl,
  children,
}: {
  feature: string;
  redirectOn401?: boolean;
  callbackUrl?: string;
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user?.id) {
    if (redirectOn401) {
      const { redirect } = await import("next/navigation");
      const hdrs = await headers();
      const candidates = [
        callbackUrl,
        hdrs.get("next-url"),
        hdrs.get("x-invoke-path"),
        hdrs.get("x-matched-path"),
      ];
      const resolvedCallback =
        candidates.find((value) => value && value.startsWith("/")) ?? "/";
      const qs = new URLSearchParams({
        callbackUrl: resolvedCallback,
      }).toString();
      redirect(`/login?${qs}`);
    }
    return <Forbidden />;
  }

  try {
    await must(user, feature, { strict: true });
    return <>{children}</>;
  } catch (err) {
    return <Forbidden feature={feature} />;
  }
}
