'use client';

import { useEffect, useState } from 'react';

const MD_QUERY = '(min-width: 768px)';

export function useBreakpoint(): boolean | null {
  const [isMd, setIsMd] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MD_QUERY);
    const handler = () => setIsMd(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMd;
}

