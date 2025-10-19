import { sql } from "@/lib/db";

type AuditMetadata = Record<string, unknown> | null | undefined;

export type WriteAuditInput = {
  action: string;
  actorId: string | null;
  targetTable: string;
  targetId: string | number | null;
  metadata?: AuditMetadata;
};

export async function writeAudit({
  action,
  actorId,
  targetTable,
  targetId,
  metadata,
}: WriteAuditInput): Promise<void> {
  const metaPayload = {
    ...(metadata ?? {}),
    target_table: targetTable,
    target_id: targetId,
  };

  const metaJson = JSON.stringify(metaPayload);

  await sql`
    INSERT INTO dojo.audit_log (
      action,
      actor_user_id,
      feature_key,
      effect,
      meta
    )
    VALUES (${action}, ${actorId}, ${action}, 'success', ${metaJson})
  `;
}
