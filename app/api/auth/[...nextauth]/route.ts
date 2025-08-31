// app/api/auth/[...nextauth]/route.ts  (v4)
import NextAuth from "next-auth";
import { authOptions } from "@/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
