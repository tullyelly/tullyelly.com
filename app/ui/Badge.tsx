// app/ui/Badge.tsx
import React from 'react'

export type BadgeProps = {
  tone?: 'neutral' | 'success' | 'warning'
  children: React.ReactNode
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium'
  const tones = {
    neutral: 'border border-border text-fg/80',
    success: 'bg-success text-white',
    warning: 'bg-warning/10 text-warning ring-1 ring-warning/20',
  }
  return <span className={`${base} ${tones[tone]}`}>{children}</span>
}
