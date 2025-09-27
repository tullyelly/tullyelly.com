"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getPool } from "@/db/pool";

function normalizeLabel(label: string) {
  return label.trim().slice(0, 120);
}

async function revalidateScrollPaths() {
  // Revalidate common pages that list scrolls
  revalidatePath("/");
  revalidatePath("/shaolin-scrolls");
  revalidateTag("scrolls");
}

export async function createPatch(label: string) {
  const normalized = normalizeLabel(label);
  if (!normalized) throw new Error("Invalid label");

  const db = getPool();
  const sql = "SELECT * FROM dojo.fn_next_patch($1::text);";
  const res = await db.query<{ scroll_id: number; generated_name: string }>(
    sql,
    [normalized],
  );
  const row = res.rows[0];
  if (!row) throw new Error("Failed to create patch");

  await revalidateScrollPaths();
  return { id: String(row.scroll_id), generated_name: row.generated_name };
}

export async function createMinor(label: string) {
  const normalized = normalizeLabel(label);
  if (!normalized) throw new Error("Invalid label");

  const db = getPool();
  const sql = "SELECT * FROM dojo.fn_next_minor($1::text);";
  const res = await db.query<{ scroll_id: number; generated_name: string }>(
    sql,
    [normalized],
  );
  const row = res.rows[0];
  if (!row) throw new Error("Failed to create minor");

  await revalidateScrollPaths();
  return { id: String(row.scroll_id), generated_name: row.generated_name };
}
