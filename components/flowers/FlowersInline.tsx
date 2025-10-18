import * as React from "react";

export function FlowersInline({
  children,
  withEmoji = true,
}: {
  children: React.ReactNode;
  withEmoji?: boolean;
}) {
  return (
    <span
      className="inline-flex items-baseline gap-2 text-sm text-muted-foreground"
      aria-label="Acknowledgments"
    >
      {withEmoji && <span aria-hidden="true">💐</span>}
      <span>Flowers: {children}</span>
    </span>
  );
}

export default FlowersInline;
