"use client";

import type {
  CreateCategorySnapshot,
  CorrectCategorySnapshot,
} from "@/lib/card-categories";

export type CategorySaveResult = {
  id: string;
  status: "ok";
  freshness: "fresh" | "pending";
};
export async function saveCategorySnapshot(
  input: CreateCategorySnapshot | CorrectCategorySnapshot,
): Promise<CategorySaveResult> {
  const response = await fetch("/api/cardattack/categories/snapshots", {
    method: "snapshot_id" in input ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data: unknown = await response.json();
  if (!response.ok) throw data;
  return data as CategorySaveResult;
}
export function categorySaveError(error: unknown): string {
  const code =
    error && typeof error === "object" && "error" in error ? error.error : null;
  switch (code) {
    case "SNAPSHOT_ALREADY_EXISTS":
      return "A measurement already exists for this category and date. Open its history and choose Correct snapshot.";
    case "UNAUTHENTICATED":
      return "Sign in to save a measurement.";
    case "FORBIDDEN":
      return "You do not have permission to save this measurement.";
    case "CATEGORY_NOT_FOUND":
      return "This category no longer exists. Refresh the page.";
    case "SNAPSHOT_NOT_FOUND":
      return "This measurement no longer exists. Refresh the page.";
    case "INVALID_INPUT":
      return "Check the date, count, optional ranking and difference; future dates are not allowed.";
    default:
      return "Unable to confirm the save. Check history before retrying; your input has been kept.";
  }
}
