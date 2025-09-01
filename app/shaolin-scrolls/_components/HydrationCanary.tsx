'use client';

import { useEffect } from 'react';
import { signSnapshot } from '@/lib/sig';
import { nowIso } from '@/lib/format';

type Props = { initial: unknown; enabled: boolean };

declare global {
  interface Window {
    __HYDRATION_DIAG__?: any[];
  }
}

export default function HydrationCanary({ initial, enabled }: Props) {
  useEffect(() => {
    if (!enabled) return;
    const root = document.getElementById('scrolls-root');
    const serverSig = root?.getAttribute('data-ssr-sig') || 'absent';
    const clientSig = signSnapshot(initial);

    const record = (extra: Record<string, unknown>) => {
      const entry = {
        tag: 'hydration:canary',
        when: nowIso(),
        serverSig,
        clientSig,
        equal: serverSig === clientSig,
        url: location.href,
        ...extra,
      };
      (window.__HYDRATION_DIAG__ ||= []).push(entry);
      console.error('[hydration:canary]', entry);
    };

    if (serverSig !== clientSig) {
      try {
        // @ts-expect-error: heuristic probing of shape
        const arr: any[] = initial?.items || initial?.rows || initial?.data || [];
        const domFirstRow = root?.querySelector('table tbody tr');
        const domText = domFirstRow ? (domFirstRow as HTMLElement).innerText.slice(0, 240) : '(no row)';
        record({ kind: 'sig_mismatch', initialPreview: JSON.stringify(arr?.[0])?.slice(0, 240), domFirstRow: domText });
      } catch (e) {
        record({ kind: 'sig_mismatch_probe_failed', error: String(e) });
      }
    } else {
      record({ kind: 'sig_match' });
    }
  }, [initial, enabled]);

  return null;
}
