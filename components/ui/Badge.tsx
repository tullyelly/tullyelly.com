'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'

export type BadgeIntent =
  | 'planned'
  | 'released'
  | 'minor'
  | 'hotfix'
  | 'archived'
  | 'patch'
  | 'neutral'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  intent?: BadgeIntent
  children: React.ReactNode
}

export function Badge({ intent = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span className={cn('badge', `badge--${intent}`, className)} {...props}>
      {children}
    </span>
  )
}

