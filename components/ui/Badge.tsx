import React from 'react'
import { cn } from '@/lib/cn'

export type BadgeProps = {
  tone?: 'neutral' | 'success' | 'warning'
  className?: string
  children: React.ReactNode
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium'
  const tones = {
    neutral: 'border border-border text-fg/80',
    success: 'bg-success text-white',
    warning: 'bg-warning/10 text-warning ring-1 ring-warning/20',
  }
  return <span className={cn(base, tones[tone], className)}>{children}</span>
}
