"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import * as Dialog from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { useActivity } from "@/components/activity/activity-provider";
import {
  MAX_CARD_COUNT,
  MIN_CATEGORY_DIFFERENCE,
  isCalendarDate,
} from "@/lib/card-categories";
import {
  saveCategorySnapshot,
  categorySaveError,
} from "@/lib/client/categorySnapshots";

const fields = z.object({
  difference: z
    .string()
    .refine(
      (value) =>
        value === "" ||
        (/^-?\d+$/.test(value) &&
          Number(value) >= MIN_CATEGORY_DIFFERENCE &&
          Number(value) <= MAX_CARD_COUNT),
      "Enter a signed whole-number difference or leave blank",
    ),
  ranking: z
    .string()
    .refine(
      (value) =>
        value === "" ||
        (/^\d+$/.test(value) &&
          Number(value) >= 1 &&
          Number(value) <= MAX_CARD_COUNT),
      "Enter a positive whole-number rank or leave blank",
    ),
  category: z.string().min(1, "Select a category"),
  measured_on: z.string().refine(isCalendarDate, "Select a real calendar date"),
  card_count: z
    .string()
    .regex(/^\d+$/, "Enter a nonnegative whole number")
    .refine(
      (value) => Number(value) <= MAX_CARD_COUNT,
      `Count must be at most ${MAX_CARD_COUNT}`,
    ),
});
type Values = z.infer<typeof fields>;
type Props = {
  categories: { slug: string; name: string }[];
  defaultDate: string;
  category?: string;
  snapshot?: {
    snapshot_id: string;
    measured_on: string;
    card_count: number;
    ranking?: number | null;
    difference?: number | null;
  };
};
export default function SnapshotButton({
  categories,
  defaultDate,
  category,
  snapshot,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  const router = useRouter();
  const { toast } = useToast();
  const activity = useActivity();
  const form = useForm<Values>({
    resolver: zodResolver(fields),
    defaultValues: {
      category: category ?? "",
      measured_on: snapshot?.measured_on ?? defaultDate,
      card_count: snapshot ? String(snapshot.card_count) : "",
      ranking: snapshot?.ranking == null ? "" : String(snapshot.ranking),
      difference:
        snapshot?.difference == null ? "" : String(snapshot.difference),
    },
  });
  const busy = form.formState.isSubmitting;
  const onSubmit = form.handleSubmit(async (values) => {
    if (saving.current) return;
    if (!snapshot && values.measured_on > defaultDate) {
      form.setError("measured_on", {
        message: "Future measurements are not allowed",
      });
      return;
    }
    saving.current = true;
    setError(null);
    const id = activity.start(
      snapshot ? "Correct category snapshot" : "Save category snapshot",
      { status: "running" },
    );
    try {
      const result = await saveCategorySnapshot(
        snapshot
          ? {
              snapshot_id: snapshot.snapshot_id,
              card_count: Number(values.card_count),
              ranking: values.ranking === "" ? null : Number(values.ranking),
              difference:
                values.difference === "" ? null : Number(values.difference),
            }
          : {
              category: values.category,
              measured_on: values.measured_on,
              card_count: Number(values.card_count),
              ranking: values.ranking === "" ? null : Number(values.ranking),
              difference:
                values.difference === "" ? null : Number(values.difference),
            },
      );
      const detail =
        result.freshness === "pending"
          ? "Saved. Display refresh is pending; do not submit again."
          : "Measurement saved.";
      activity.done(id, { detail });
      toast({
        title: snapshot ? "Snapshot corrected" : "Snapshot added",
        description: detail,
      });
      setOpen(false);
      if (!snapshot)
        form.reset({
          category: category ?? "",
          measured_on: defaultDate,
          card_count: "",
          ranking: "",
          difference: "",
        });
      router.refresh();
    } catch (cause) {
      const message = categorySaveError(cause);
      setError(message);
      activity.error(id, message);
    } finally {
      saving.current = false;
    }
  });
  const title = snapshot ? "Correct snapshot" : "Add Snapshot";
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!saving.current) {
          if (next)
            form.reset({
              category: category ?? "",
              measured_on: snapshot?.measured_on ?? defaultDate,
              card_count: snapshot ? String(snapshot.card_count) : "",
              ranking:
                snapshot?.ranking == null ? "" : String(snapshot.ranking),
              difference:
                snapshot?.difference == null ? "" : String(snapshot.difference),
            });
          setOpen(next);
          setError(null);
        }
      }}
    >
      <Dialog.Trigger asChild>
        <Button
          variant={snapshot ? "outline" : "default"}
          className="min-h-11"
          aria-label={
            snapshot
              ? `Correct snapshot for ${snapshot.measured_on}`
              : "Add Snapshot"
          }
        >
          {title}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="app-dialog-overlay" />
        <Dialog.Content
          className="rounded-2xl border bg-white text-ink shadow-xl"
          draggable={false}
        >
          <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm">
            Record your overall owned-card count and optional TCDb ranking for
            one category.{" "}
            {snapshot
              ? "The category and measurement date stay fixed."
              : "Use the date you measured it; future dates are not allowed."}
          </Dialog.Description>
          <Form {...form}>
            <form
              onSubmit={onSubmit}
              className="mt-4 space-y-4"
              aria-busy={busy}
            >
              <fieldset disabled={busy} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          disabled={
                            busy || Boolean(category) || Boolean(snapshot)
                          }
                          className="form-input min-h-11 w-full"
                        >
                          <option value="">Select category</option>
                          {categories.map((item) => (
                            <option key={item.slug} value={item.slug}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="measured_on"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Measurement date</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="min-h-11"
                          type="date"
                          min="0100-01-01"
                          max={defaultDate}
                          readOnly={Boolean(snapshot)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="card_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owned-card count</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="min-h-11"
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={MAX_CARD_COUNT}
                          step={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ranking"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TCDb ranking (optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="min-h-11"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={MAX_CARD_COUNT}
                          step={1}
                        />
                      </FormControl>
                      <FormDescription>
                        Lower is better. Leave blank if not recorded.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="difference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difference (optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="min-h-11"
                          type="number"
                          inputMode="text"
                          min={MIN_CATEGORY_DIFFERENCE}
                          max={MAX_CARD_COUNT}
                          step={1}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the signed TCDb difference as shown, including
                        negatives; leave blank if not recorded.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </fieldset>
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-3">
                <Dialog.Close asChild>
                  <Button
                    type="button"
                    className="min-h-11"
                    variant="outline"
                    disabled={busy}
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button type="submit" className="min-h-11" disabled={busy}>
                  {busy ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : null}
                  {busy ? "Saving…" : "Save snapshot"}
                </Button>
              </div>
            </form>
          </Form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
