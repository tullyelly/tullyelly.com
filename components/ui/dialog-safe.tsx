"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export const Root = Dialog.Root;
export const Portal = Dialog.Portal;
export const Overlay = Dialog.Overlay;

/** Content that guarantees a Title/Description exist. */
export function Content({
  label,
  description,
  hideLabel = true,
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Dialog.Content> & {
  label: string;
  description?: string;
  hideLabel?: boolean;
}) {
  return (
    <Dialog.Content {...rest} asChild>
      <div
        role="dialog"
        aria-modal="true"
        className={className}
        data-overlay-root
      >
        <Dialog.Title asChild={hideLabel}>
          {hideLabel ? (
            <VisuallyHidden>{label}</VisuallyHidden>
          ) : (
            <h2>{label}</h2>
          )}
        </Dialog.Title>
        {description ? (
          <Dialog.Description asChild>
            <VisuallyHidden>{description}</VisuallyHidden>
          </Dialog.Description>
        ) : null}
        {children}
      </div>
    </Dialog.Content>
  );
}
