import * as React from 'react';
import { cn } from '@/lib/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50',
        variant === 'outline' ? 'bg-transparent' : 'bg-neutral-100',
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
