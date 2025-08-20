import { ReactNode } from 'react';

interface CalloutProps {
  children: ReactNode;
}

export default function Callout({ children }: CalloutProps) {
  return (
    <aside role="note" className="callout">
      {children}
    </aside>
  );
}
