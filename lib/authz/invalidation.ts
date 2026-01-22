import { revalidateTag } from "next/cache";
import { getPool } from "@/db/pool";
import { isNextBuild } from "@/lib/env";

let listenerPromise: Promise<void> | null = null;

function shouldSkipListener(): boolean {
  if (process.env.NODE_ENV === "test") return true;
  if (process.env.E2E_MODE === "1") return true;
  if (process.env.NEXT_E2E === "1") return true;
  if (isNextBuild()) return true;
  if (process.env.SKIP_DB === "true") return true;
  return false;
}

export function ensureAuthzInvalidationListener(): void {
  if (shouldSkipListener()) return;
  if (listenerPromise) return;

  const pool: any = getPool();
  if (typeof pool?.connect !== "function") {
    return;
  }

  listenerPromise = (async () => {
    const client = await pool.connect();

    client.on("error", (err: unknown) => {
      console.error("authz LISTEN connection error", err);
      listenerPromise = null;
    });

    client.on("notification", (msg: { channel: string; payload?: string }) => {
      if (msg.channel === "authz_changed" && msg.payload) {
        revalidateTag(`auth:user:${msg.payload}`, "max");
      }
    });

    await client.query("LISTEN authz_changed");
  })().catch((err) => {
    console.error("failed to start authz listener", err);
    listenerPromise = null;
  });
}
