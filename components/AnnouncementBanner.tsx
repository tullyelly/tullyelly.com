"use client";

import { useState } from "react";

interface AnnouncementBannerProps {
  message: string;
  href?: string;
  variant?: "info" | "success" | "warning" | "error";
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<NonNullable<AnnouncementBannerProps["variant"]>, string> = {
  info: "bg-blue text-text-on-blue",
  success: "bg-green text-text-on-green",
  warning: "bg-amber-200 text-black",
  error: "bg-red-600 text-white",
};

export default function AnnouncementBanner({
  message,
  href,
  variant = "info",
  dismissible = false,
  onDismiss,
  icon,
  className = "",
}: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const role = variant === "error" || variant === "warning" ? "alert" : "status";
  const classes = `${variantStyles[variant]} flex items-center justify-between px-4 py-2 text-sm ${className}`;

  const content = (
    <span className="flex items-center gap-2">
      {icon && <span aria-hidden="true">{icon}</span>}
      {message}
    </span>
  );

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div role={role} className={classes}>
      {href ? (
        <a href={href} className="underline decoration-current text-inherit">
          {content}
        </a>
      ) : (
        content
      )}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="ml-4"
        >
          ×
        </button>
      )}
    </div>
  );
}
