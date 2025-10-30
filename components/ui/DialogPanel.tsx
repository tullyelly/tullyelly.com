"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import Modal, { ModalClose, ModalDescription, ModalTitle } from "./Modal";

type DialogPanelProps = React.ComponentProps<typeof Modal>;

const PANEL_WIDTH_CLASSES =
  "w-[min(80vw,640px)] max-w-[640px] overflow-x-hidden box-border";

export function DialogPanel({
  className,
  ...props
}: DialogPanelProps): React.ReactElement {
  return <Modal {...props} className={cn(PANEL_WIDTH_CLASSES, className)} />;
}

export const DialogPanelClose = ModalClose;
export const DialogPanelDescription = ModalDescription;
export const DialogPanelTitle = ModalTitle;

export default DialogPanel;
