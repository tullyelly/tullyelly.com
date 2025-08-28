"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ReleaseType = "patch" | "minor";

export default function CreateRelease() {
  const router = useRouter();

  // Patch form state
  const [patchLabel, setPatchLabel] = useState("");
  const [patchLoading, setPatchLoading] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [patchCreated, setPatchCreated] = useState(false);

  // Minor form state
  const [minorLabel, setMinorLabel] = useState("");
  const [minorLoading, setMinorLoading] = useState(false);
  const [minorError, setMinorError] = useState<string | null>(null);
  const [minorCreated, setMinorCreated] = useState(false);

  async function submit(
    e: FormEvent<HTMLFormElement>,
    type: ReleaseType
  ) {
    e.preventDefault();

    const isPatch = type === "patch";
    const label = (isPatch ? patchLabel : minorLabel).trim().slice(0, 120);

    // guard
    if (!label) return;

    // set local UI state
    if (isPatch) {
      setPatchLoading(true);
      setPatchError(null);
      setPatchCreated(false);
    } else {
      setMinorLoading(true);
      setMinorError(null);
      setMinorCreated(false);
    }

    try {
      const body = isPatch
        ? { label, statusCode: "planned", releaseTypeCode: "hotfix" }
        : { label };
      const res = await fetch(`/api/releases/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Request failed");

      // success
      if (isPatch) {
        setPatchLabel("");
        setPatchCreated(true);
      } else {
        setMinorLabel("");
        setMinorCreated(true);
      }

      router.refresh();
    } catch {
      if (isPatch) setPatchError("Failed to create patch release");
      else setMinorError("Failed to create minor release");
    } finally {
      if (isPatch) setPatchLoading(false);
      else setMinorLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Patch form */}
      <form onSubmit={(e) => submit(e, "patch")} className="flex flex-col gap-2">
        <label htmlFor="patch-label" className="text-sm font-medium">
          Patch label
        </label>
        <input
          id="patch-label"
          name="patch-label"
          value={patchLabel}
          onChange={(e) => setPatchLabel(e.target.value)}
          maxLength={120}
          required
          className="rounded border px-2 py-1"
          placeholder="e.g. hotfix: correct audit trail ordering"
        />
        <button
          type="submit"
          disabled={patchLoading}
          className="rounded border px-3 py-1 disabled:opacity-50"
        >
          {patchLoading ? "Creating…" : "Create Patch"}
        </button>
        {patchError && <p className="text-sm text-red-600">{patchError}</p>}
        {patchCreated && <p className="text-sm text-green-600">Created</p>}
      </form>

      {/* Minor form */}
      <form onSubmit={(e) => submit(e, "minor")} className="flex flex-col gap-2">
        <label htmlFor="minor-label" className="text-sm font-medium">
          Minor label
        </label>
        <input
          id="minor-label"
          name="minor-label"
          value={minorLabel}
          onChange={(e) => setMinorLabel(e.target.value)}
          maxLength={120}
          required
          className="rounded border px-2 py-1"
          placeholder="e.g. v0.6: add scrolls list filters"
        />
        <button
          type="submit"
          disabled={minorLoading}
          className="rounded border px-3 py-1 disabled:opacity-50"
        >
          {minorLoading ? "Creating…" : "Create Minor"}
        </button>
        {minorError && <p className="text-sm text-red-600">{minorError}</p>}
        {minorCreated && <p className="text-sm text-green-600">Created</p>}
      </form>
    </div>
  );
}
