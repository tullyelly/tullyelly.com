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
  const metaJson = metadata ? JSON.stringify(metadata) : null;

  await sql`
    INSERT INTO dojo.audit_log (
      action,
      actor_id,
      target_table,
      target_id,
      metadata
    )
    VALUES (${action}, ${actorId}, ${targetTable}, ${targetId}, ${metaJson})
  `;
}
