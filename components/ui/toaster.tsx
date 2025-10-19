"use client";

import * as React from "react";

import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import { useToast } from "./use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ id, title, description, action, variant }) => (
        <Toast
          key={id}
          onOpenChange={(open) => {
            if (!open) dismiss(id);
          }}
          className={
            variant === "destructive"
              ? "border-red-600 bg-red-50 text-red-900"
              : undefined
          }
        >
          <div className="flex flex-1 flex-col gap-1">
            {title ? <ToastTitle>{title}</ToastTitle> : null}
            {description ? (
              <ToastDescription>{description}</ToastDescription>
            ) : null}
          </div>
          {action ? <ToastAction altText="Action">{action}</ToastAction> : null}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
