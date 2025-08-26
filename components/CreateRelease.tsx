"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateRelease() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCreated(false);
    try {
      const res = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        throw new Error("Request failed");
      }
      setName("");
      setCreated(true);
      router.refresh();
    } catch {
      setError("Failed to create release");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded border px-2 py-1"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded border px-3 py-1 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {created && <p className="text-sm text-green-600">Created</p>}
    </form>
  );
}

