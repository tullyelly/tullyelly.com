import * as React from 'react'
import { cn } from '@/lib/cn'

export type BadgeIntent =
  | 'planned'
  | 'released'
  | 'minor'
  | 'hotfix'
  | 'archived'
  | 'neutral'
  | 'success'
  | 'warning'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  intent?: BadgeIntent
  tone?: 'neutral' | 'success' | 'warning'
  children: React.ReactNode
}

export function Badge({ intent, tone, className, children, ...props }: BadgeProps) {
  const applied = intent ?? tone ?? 'neutral'
  return (
    <span className={cn('badge', `badge--${applied}`, className)} {...props}>
      {children}
    </span>
  )
}
