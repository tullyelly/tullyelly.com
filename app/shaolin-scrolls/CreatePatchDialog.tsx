"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { useState, useEffect } from "react";

type Option = { id: number; code: string };

export default function CreatePatchDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState("");
  const [rtype, setRtype] = useState("");
  const [statusOpts, setStatusOpts] = useState<Option[]>([]);
  const [typeOpts, setTypeOpts] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultName, setResultName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [s, t] = await Promise.all([
        fetch("/api/meta/release-status").then(r => r.json()),
        fetch("/api/meta/release-type").then(r => r.json())
      ]);
      setStatusOpts(s);
      setTypeOpts(t);
    })();
  }, []);

  async function submit() {
    setLoading(true);
    setError(null);
    setResultName(null);
    try {
      const res = await fetch("/api/releases/patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, statusCode: status, releaseTypeCode: rtype }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Request failed");
      setResultName(data.generated_name ?? null);
      onCreated?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="px-3 py-2 rounded bg-green-600 text-white">Create Patch</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[400px] shadow-xl">
          <Dialog.Title className="text-lg font-medium mb-4">Create Patch</Dialog.Title>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Label</label>
              <input
                className="w-full border rounded px-2 py-1"
                placeholder="e.g., optimize ci e2e pipeline"
                value={label}
                onChange={e => setLabel(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Status</label>
              <Select.Root value={status} onValueChange={setStatus}>
                <Select.Trigger className="inline-flex w-full justify-between border rounded px-2 py-1">
                  <Select.Value placeholder="Choose status" />
                </Select.Trigger>
                <Select.Content className="bg-white border rounded shadow">
                  {statusOpts.map(o => (
                    <Select.Item key={o.id} value={o.code} className="px-2 py-1 cursor-pointer">
                      {o.code}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>

            <div>
              <label className="block text-sm mb-1">Release Type</label>
              <Select.Root value={rtype} onValueChange={setRtype}>
                <Select.Trigger className="inline-flex w-full justify-between border rounded px-2 py-1">
                  <Select.Value placeholder="Choose release type" />
                </Select.Trigger>
                <Select.Content className="bg-white border rounded shadow">
                  {typeOpts.map(o => (
                    <Select.Item key={o.id} value={o.code} className="px-2 py-1 cursor-pointer">
                      {o.code}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {resultName && (
              <div className="border rounded p-2 bg-gray-50 text-sm">
                <div className="font-medium mb-1">Created</div>
                <div className="select-all">{resultName}</div>
                <div className="text-xs text-gray-500 mt-1">Copy for Jira</div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Dialog.Close asChild>
                <button className="px-3 py-2 rounded border">Cancel</button>
              </Dialog.Close>
              <button
                onClick={submit}
                disabled={loading || !label.trim() || !status || !rtype}
                className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
