'use client';

import { useEffect } from 'react';
import { tinyHash } from '@/lib/sig';
import { nowIso } from '@/lib/format';

type Props = {
  id: string;
  zone: string;
  ssrSignature?: string;
  enabled: boolean;
  ssrPropsJSON?: string;
};

declare global {
  interface Window {
    __HYDRATION_DIAG__?: any[];
  }
}

export default function ZoneCanary({ id, zone, ssrSignature, enabled, ssrPropsJSON }: Props) {
  useEffect(() => {
    if (!enabled) return;
    const root = document.getElementById(id);
    const domText = (root?.textContent || '').slice(0, 800);
    const domSig = tinyHash(domText);
    const entry = {
      tag: 'hydration:zone',
      when: nowIso(),
      url: location.href,
      zone,
      ssrSignature: ssrSignature ?? '(none)',
      domSig,
      equal: ssrSignature === domSig,
      domPreview: domText.slice(0, 200),
      ssrPropsPreview: ssrPropsJSON?.slice(0, 200),
    };
    (window.__HYDRATION_DIAG__ ||= []).push(entry);
    console.error('[hydration:zone]', entry);
  }, [id, zone, ssrSignature, enabled, ssrPropsJSON]);

  return null;
}
