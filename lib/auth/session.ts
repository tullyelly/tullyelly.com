/**
 * WU-377: Session resolver (NextAuth v4)
 * Returns { id: string; email?: string } or null.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export type SessUser = { id: string; email?: string } | null;

export async function getCurrentUser(): Promise<SessUser> {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return null;

  // NextAuth + Prisma adapter: prefer user.id (string), fall back to sub if present
  const id = (user.id ?? user.sub) as string | undefined;
  if (!id) return null;

  return { id, email: user.email ?? undefined };
}
