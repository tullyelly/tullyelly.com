'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export function SectionDivider() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '-100px 0px -100px 0px' }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        'h-0.5 w-full bg-brand-greatLakesBlue origin-center transform transition-all duration-700 ease-out',
        visible ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
      )}
    />
  );
}
