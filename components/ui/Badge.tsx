import React from 'react'
import { cn } from '@/lib/cn'

export type BadgeProps = {
  intent?: 'planned' | 'released' | 'minor' | 'hotfix' | 'archived' | 'patch'
  tone?: 'neutral' | 'success' | 'warning'
  className?: string
  children: React.ReactNode
}

export function Badge({ intent, tone = 'neutral', className, children, ...props }: BadgeProps) {
  if (intent) {
    return (
      <span className={cn('badge', `badge--${intent}`, className)} {...props}>
        {children}
      </span>
    )
  }

  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium'
  const tones = {
    neutral: 'border border-border text-fg/80',
    success: 'bg-[var(--success)] text-white',
    warning: 'bg-warning/10 text-warning ring-1 ring-warning/20',
  }
  return (
    <span className={cn(base, tones[tone], className)} {...props}>
      {children}
    </span>
  )
}
