import AuthzGate from "@/components/auth/AuthzGate";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const path = hdrs.get("next-url") ?? "/mark2/admin";
  return (
    <AuthzGate feature="admin.app.view" callbackUrl={path}>
      {children}
    </AuthzGate>
  );
}
