import type { ReactNode } from 'react';

interface ScrollsLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function ScrollsLayout({ sidebar, children }: ScrollsLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
      <aside className="lg:col-span-3">{sidebar}</aside>
      <section className="lg:col-span-9">{children}</section>
    </div>
  );
}

