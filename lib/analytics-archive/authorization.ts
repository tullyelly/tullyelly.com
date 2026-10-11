import "server-only";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { must } from "@/lib/authz";
import {
  AuthzForbiddenError,
  AuthzUnauthenticatedError,
} from "@/lib/authz/types";
import { headers } from "next/headers";

export async function requireAnalyticsOwner(): Promise<void> {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | (NonNullable<typeof session>["user"] & { id?: string })
    | undefined;
  if (!user || typeof user.id !== "string" || !user.id)
    throw new AuthzUnauthenticatedError();
  if (user.role !== "owner") throw new AuthzForbiddenError();
  await must({ id: user.id }, "admin.analytics.manage", {
    strict: true,
  });
}
export async function requireAnalyticsActionOrigin(): Promise<void> {
  // Next server actions also enforce POST and Origin/Host; require Origin explicitly.
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  try {
    if (!origin || !host) throw new Error();
    const url = new URL(origin);
    if (!["https:", "http:"].includes(url.protocol) || url.host !== host)
      throw new Error();
  } catch {
    throw new AuthzForbiddenError("Invalid action origin.");
  }
}
