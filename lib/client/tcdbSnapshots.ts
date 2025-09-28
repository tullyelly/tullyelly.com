import { getBaseUrl } from "@/app/lib/getBaseUrl";

const SNAPSHOT_ENDPOINT = "/api/tcdb/snapshot" as const;

export type CreateTcdbSnapshotInput = {
  homie_id: string | number;
  card_count: number;
  ranking: number;
  difference: number;
  ranking_at: string;
};

export type CreateTcdbSnapshotSuccess = {
  id: string;
  status: "ok";
};

export type CreateTcdbSnapshotError =
  | { error: "INVALID_JSON" }
  | { error: "INVALID_INPUT"; fieldErrors: Record<string, string[]> }
  | { error: "UNAUTHENTICATED" }
  | { error: "FORBIDDEN" }
  | { error: "SNAPSHOT_CREATE_FAILED" }
  | { error: string; [key: string]: unknown };

export async function createTcdbSnapshot(
  input: CreateTcdbSnapshotInput,
): Promise<CreateTcdbSnapshotSuccess> {
  const baseUrl = typeof window === "undefined" ? getBaseUrl() : "";
  const response = await fetch(`${baseUrl}${SNAPSHOT_ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data: unknown = await response
    .json()
    .catch(() => ({ error: "SNAPSHOT_CREATE_FAILED" }));

  if (!response.ok) {
    throw data as CreateTcdbSnapshotError;
  }

  if (!data || typeof data !== "object") {
    throw new Error("Unexpected response payload from tcdb snapshot API");
  }

  return data as CreateTcdbSnapshotSuccess;
}
