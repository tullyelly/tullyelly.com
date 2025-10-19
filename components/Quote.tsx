import { ReactNode } from "react";

interface QuoteProps {
  children: ReactNode;
  cite?: string;
}

export default function Quote({ children, cite }: QuoteProps) {
  return (
    <blockquote>
      <p>{children}</p>
      {cite && <cite>{cite}</cite>}
    </blockquote>
  );
}
