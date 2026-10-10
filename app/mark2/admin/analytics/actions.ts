"use server";
import { revalidatePath } from "next/cache";
import {
  requireAnalyticsActionOrigin,
  requireAnalyticsOwner,
} from "@/lib/analytics-archive/authorization";
import {
  runAnalyticsOperation,
  testAnalyticsConnection,
  type OperationResult,
} from "@/lib/analytics-archive/operations";

export async function analyticsAction(
  _previous: OperationResult | null,
  form: FormData,
): Promise<OperationResult> {
  await requireAnalyticsActionOrigin();
  await requireAnalyticsOwner();
  const action = form.get("operation");
  let result: OperationResult;
  if (action === "test") result = await testAnalyticsConnection();
  else if (action === "daily")
    result = await runAnalyticsOperation({ kind: "daily" });
  else if (action === "continue")
    result = await runAnalyticsOperation({ kind: "continue_import" });
  else if (action === "import")
    result = await runAnalyticsOperation({
      kind: "start_import",
      from: String(form.get("from") ?? ""),
      through: String(form.get("through") ?? ""),
    });
  else return { status: "failure", message: "Unknown analytics action." };
  revalidatePath("/mark2/admin/analytics");
  return result;
}
