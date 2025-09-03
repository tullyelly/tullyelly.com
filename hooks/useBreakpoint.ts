'use client';

import { useEffect, useState } from 'react';

const MD_QUERY = '(min-width: 768px)';

export function useBreakpoint(): boolean {
  const [isMd, setIsMd] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(MD_QUERY);
    const handler = () => setIsMd(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMd;
}

