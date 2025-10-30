"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  useId,
} from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import * as Dialog from "@ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useActivity } from "@/components/activity/activity-provider";
import {
  createTcdbSnapshot,
  type CreateTcdbSnapshotError,
} from "@/lib/client/tcdbSnapshots";

type HomieOption = {
  value: string | number;
  label: string;
};

type AddSnapshotButtonProps = {
  homieOptions: HomieOption[];
  onSnapshotCreated?: () => void;
  defaultRankingDate: string;
};

const integerRegex = /^\d+$/;
const integerWithSignRegex = /^-?\d+$/;

const FormSchema = z.object({
  homie_id: z.string().min(1, "Select a homie"),
  card_count: z
    .string()
    .trim()
    .min(1, "Card count is required")
    .refine(
      (value) => integerRegex.test(value),
      "Card count must be a non-negative integer",
    ),
  ranking: z
    .string()
    .trim()
    .min(1, "Ranking is required")
    .refine(
      (value) => integerRegex.test(value),
      "Ranking must be a positive integer",
    )
    .refine((value) => Number(value) >= 1, "Ranking must be at least 1"),
  difference: z
    .string()
    .trim()
    .min(1, "Difference is required")
    .refine(
      (value) => integerWithSignRegex.test(value),
      "Difference must be an integer",
    ),
  ranking_at: z
    .string()
    .trim()
    .min(1, "Ranking date is required")
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "Ranking date is invalid",
    ),
});

type FormInput = z.infer<typeof FormSchema>;

function createDefaultValues(today: string): FormInput {
  return {
    homie_id: "",
    card_count: "",
    ranking: "",
    difference: "",
    ranking_at: today,
  };
}

export default function AddSnapshotButton({
  homieOptions,
  onSnapshotCreated,
  defaultRankingDate,
}: AddSnapshotButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const comboboxId = useId();
  const listboxId = `${comboboxId}-listbox`;
  const optionIdPrefix = `${comboboxId}-option-`;
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const defaultValues = useMemo(
    () => createDefaultValues(defaultRankingDate),
    [defaultRankingDate],
  );

  const form = useForm<FormInput>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const { toast } = useToast();
  const {
    start: startActivity,
    update: updateActivity,
    done: completeActivity,
    error: failActivity,
  } = useActivity();

  const options = useMemo(
    () =>
      homieOptions.map((option) => ({
        value: String(option.value),
        label: option.label,
      })),
    [homieOptions],
  );

  const homieFieldValue = form.watch("homie_id");
  const [searchTerm, setSearchTerm] = useState("");
  const [isListOpen, setIsListOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredOptions = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(needle),
    );
  }, [options, searchTerm]);

  useEffect(() => {
    if (!options.length) {
      setSearchTerm("");
      setHighlightedIndex(0);
      if (homieFieldValue) {
        form.setValue("homie_id", "", {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      return;
    }

    if (!homieFieldValue) return;
    const selected = options.find((option) => option.value === homieFieldValue);
    if (selected) {
      setSearchTerm(selected.label);
    } else {
      form.setValue("homie_id", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      setSearchTerm("");
    }
  }, [options, homieFieldValue, form]);

  useEffect(() => {
    const matchIndex = filteredOptions.findIndex(
      (option) => option.value === homieFieldValue,
    );
    setHighlightedIndex(matchIndex >= 0 ? matchIndex : 0);
  }, [filteredOptions, homieFieldValue]);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(event.target as Node)) return;
      setIsListOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selectOption = (value: string) => {
    const choice = options.find((option) => option.value === value);
    if (!choice) return;
    form.setValue("homie_id", choice.value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setSearchTerm(choice.label);
    setIsListOpen(false);
  };

  const onComboboxKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredOptions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % filteredOptions.length);
      setIsListOpen(true);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex(
        (index) =>
          (index - 1 + filteredOptions.length) % filteredOptions.length,
      );
      setIsListOpen(true);
      return;
    }
    if (event.key === "Enter") {
      if (!isListOpen) return;
      event.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (option) selectOption(option.value);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setIsListOpen(false);
    }
  };

  const resetForm = useCallback(
    (initialDate: string) => {
      form.reset(createDefaultValues(initialDate));
      setSearchTerm("");
      setIsListOpen(false);
      setHighlightedIndex(0);
    },
    [form],
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      resetForm(defaultRankingDate);
    } else {
      resetForm(defaultRankingDate);
    }
  };

  useEffect(() => {
    if (!open) {
      resetForm(defaultRankingDate);
    }
  }, [defaultRankingDate, open, resetForm]);

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      homie_id: values.homie_id,
      card_count: Number(values.card_count),
      ranking: Number(values.ranking),
      difference: Number(values.difference),
      ranking_at: values.ranking_at,
    };

    const selectedHomie = homieOptions.find(
      (option) => String(option.value) === String(values.homie_id),
    );
    const activityLabel = selectedHomie
      ? `Snapshot for ${selectedHomie.label}`
      : "Saving snapshot";
    const activityId = startActivity(activityLabel, {
      status: "starting",
      detail: "Preparing snapshot request",
    });

    updateActivity(activityId, {
      status: "running",
      detail: "Sending snapshot to the server",
    });

    try {
      await createTcdbSnapshot(payload);
      toast({
        title: "Snapshot added",
        description: "Rankings are up to date.",
      });
      completeActivity(activityId, { detail: "Snapshot created successfully" });
      onSnapshotCreated?.();
      router.refresh();
      setOpen(false);
    } catch (error) {
      let description = "Unable to add snapshot right now. Please try again.";

      const maybeError = error as Partial<CreateTcdbSnapshotError> | undefined;
      if (
        maybeError &&
        typeof maybeError === "object" &&
        "error" in maybeError
      ) {
        if (maybeError.error === "SNAPSHOT_ALREADY_EXISTS") {
          description = "Snapshot already exists for this homie on that date.";
        } else if (
          maybeError.error === "INVALID_INPUT" &&
          maybeError.fieldErrors
        ) {
          const firstFieldError = Object.values(
            maybeError.fieldErrors,
          ).flat()[0];
          if (firstFieldError) description = firstFieldError;
        } else if (typeof maybeError.error === "string") {
          description = maybeError.error.replace(/_/g, " ").toLowerCase();
          description =
            description.charAt(0).toUpperCase() + description.slice(1);
        }
      } else if (error instanceof Error && error.message) {
        description = error.message;
      }

      failActivity(activityId, description);
      toast({
        title: "Failed to add snapshot",
        description,
        variant: "destructive",
      });
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button variant="default" aria-label="Add Snapshot">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Snapshot
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="app-dialog-overlay" />
        <Dialog.Content className="outline-none rounded-[16px] border-[6px] border-[var(--cream)] bg-[var(--white)] text-[var(--black)] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
          <div
            data-dialog-handle
            className="-mx-6 -mt-6 flex items-center gap-3 bg-[var(--blue)] px-6 py-2 text-white"
            style={{
              borderTopLeftRadius: "13px",
              borderTopRightRadius: "13px",
            }}
          >
            <Dialog.Title className="text-base font-semibold leading-6">
              New Snapshot
            </Dialog.Title>
            <Dialog.Close
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded border border-white/80 text-white transition hover:opacity-80"
              aria-label="Close dialog"
              disabled={isSubmitting}
            >
              ×
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Start a new TCDB snapshot.
          </Dialog.Description>
          <Form {...form}>
            <form
              onSubmit={onSubmit}
              className="mt-4 space-y-4"
              aria-busy={isSubmitting}
            >
              <FormField
                control={form.control}
                name="homie_id"
                render={() => (
                  <FormItem>
                    <FormLabel htmlFor={comboboxId}>Homie</FormLabel>
                    <div ref={wrapperRef} className="relative">
                      <FormControl>
                        <input
                          id={comboboxId}
                          type="text"
                          className="form-input h-9 w-full pr-10"
                          role="combobox"
                          aria-autocomplete="list"
                          aria-expanded={isListOpen}
                          aria-controls={listboxId}
                          aria-activedescendant={
                            isListOpen && filteredOptions[highlightedIndex]
                              ? `${optionIdPrefix}${filteredOptions[highlightedIndex].value}`
                              : undefined
                          }
                          value={searchTerm}
                          placeholder={
                            options.length
                              ? "Search or select a homie"
                              : "No homies available"
                          }
                          onChange={(event) => {
                            const value = event.target.value;
                            setSearchTerm(value);
                            if (form.getValues("homie_id")) {
                              form.setValue("homie_id", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }
                            setIsListOpen(true);
                          }}
                          onFocus={() => {
                            if (options.length > 0) setIsListOpen(true);
                          }}
                          onKeyDown={onComboboxKeyDown}
                          disabled={isSubmitting || options.length === 0}
                          autoComplete="off"
                          aria-invalid={Boolean(form.formState.errors.homie_id)}
                        />
                      </FormControl>
                      {isListOpen && (
                        <ul
                          id={listboxId}
                          role="listbox"
                          className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-[var(--border-subtle)] bg-white py-1 shadow-lg"
                        >
                          {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => {
                              const isSelected =
                                option.value === homieFieldValue;
                              const isActive = index === highlightedIndex;
                              return (
                                <li
                                  id={`${optionIdPrefix}${option.value}`}
                                  key={option.value}
                                  role="option"
                                  aria-selected={isSelected}
                                  className={`cursor-pointer px-3 py-2 text-sm ${
                                    isActive
                                      ? "bg-[var(--cream)] text-ink"
                                      : isSelected
                                        ? "bg-[var(--cream)]/70 text-ink"
                                        : "text-ink"
                                  }`}
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    selectOption(option.value);
                                  }}
                                  onMouseEnter={() =>
                                    setHighlightedIndex(index)
                                  }
                                >
                                  {option.label}
                                </li>
                              );
                            })
                          ) : (
                            <li
                              className="cursor-default px-3 py-2 text-sm text-ink/70"
                              role="presentation"
                            >
                              No matches found.
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="card_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="card-count">Card count</FormLabel>
                      <FormControl>
                        <Input
                          id="card-count"
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                          onBlur={field.onBlur}
                          ref={field.ref}
                          disabled={isSubmitting}
                          aria-invalid={Boolean(
                            form.formState.errors.card_count,
                          )}
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
                      <FormLabel htmlFor="ranking">Ranking</FormLabel>
                      <FormControl>
                        <Input
                          id="ranking"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          step={1}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                          onBlur={field.onBlur}
                          ref={field.ref}
                          disabled={isSubmitting}
                          aria-invalid={Boolean(form.formState.errors.ranking)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="difference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="difference">Difference</FormLabel>
                      <FormControl>
                        <Input
                          id="difference"
                          type="number"
                          inputMode="numeric"
                          step={1}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                          onBlur={field.onBlur}
                          ref={field.ref}
                          disabled={isSubmitting}
                          aria-invalid={Boolean(
                            form.formState.errors.difference,
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ranking_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="ranking-at">Ranking date</FormLabel>
                      <FormControl>
                        <Input
                          id="ranking-at"
                          type="date"
                          value={field.value ?? ""}
                          max={defaultRankingDate || undefined}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                          onBlur={field.onBlur}
                          ref={field.ref}
                          disabled={isSubmitting}
                          aria-invalid={Boolean(
                            form.formState.errors.ranking_at,
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Dialog.Close asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Saving…
                    </>
                  ) : (
                    "Save Snapshot"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
