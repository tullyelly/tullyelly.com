'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

type Option = { id: number; code: string };

export default function CreatePatchDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [rtype, setRtype] = React.useState('');

  const [statusOpts, setStatusOpts] = React.useState<Option[]>([]);
  const [typeOpts, setTypeOpts] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [resultName, setResultName] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const [s, t] = await Promise.all([
        fetch('/api/meta/release-status').then(r => r.json()),
        fetch('/api/meta/release-type').then(r => r.json()),
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
      const res = await fetch('/api/releases/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(),
          statusCode: status,
          releaseTypeCode: rtype,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Request failed');
      setResultName(data?.generated_name ?? null);
      onCreated?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function resetAndClose() {
    setOpen(false);
    setLabel('');
    setStatus('');
    setRtype('');
    setError(null);
    setResultName(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Patch</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Patch</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">Label</label>
            <Input
              placeholder="e.g., optimize ci e2e pipeline"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a status" />
              </SelectTrigger>
              <SelectContent>
                {statusOpts.map(o => (
                  <SelectItem key={o.id} value={o.code}>
                    {o.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Release Type</label>
            <Select value={rtype} onValueChange={setRtype}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a release type" />
              </SelectTrigger>
              <SelectContent>
                {typeOpts.map(o => (
                  <SelectItem key={o.id} value={o.code}>
                    {o.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {resultName && (
            <div className="rounded-md border p-3 text-sm">
              <div className="mb-1 font-medium">Created</div>
              <div className="select-all">{resultName}</div>
              <div className="mt-1 text-xs text-neutral-500">Copy for Jira.</div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={resetAndClose} variant="outline">
              Cancel
            </Button>
            <Button onClick={submit} disabled={loading || !label.trim() || !status || !rtype}>
              {loading ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
