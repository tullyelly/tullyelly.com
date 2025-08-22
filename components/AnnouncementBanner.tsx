'use client';

import { useState, ReactNode } from 'react';

interface AnnouncementBannerProps {
  message: string;
  href?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: ReactNode;
  className?: string;
}

// simple class combiner
function cn(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export default function AnnouncementBanner({
  message,
  href,
  variant = 'info',
  dismissible = false,
  onDismiss,
  icon,
  className,
}: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const variantStyles = {
    info: 'bg-blue text-text-on-blue',
    success: 'bg-green text-text-on-green',
    warning: 'bg-cream text-text-primary',
    error: 'bg-blue-contrast text-text-on-blue',
  } as const;

  const role = variant === 'warning' || variant === 'error' ? 'alert' : 'status';
  const ariaLive = role === 'alert' ? 'assertive' : 'polite';

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  const content = href ? (
    <a href={href} className="underline">
      {message}
    </a>
  ) : (
    message
  );

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={cn(
        'flex items-center gap-2 rounded p-4',
        variantStyles[variant],
        className
      )}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <p className="flex-1 m-0">{content}</p>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="ml-2"
        >
          ×
        </button>
      )}
    </div>
  );
}

