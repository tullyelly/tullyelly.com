import * as React from 'react'
import { cn } from '@/lib/cn'

type CardProps<T extends React.ElementType = 'div'> = {
  as?: T
  accent?: 'bucks' | 'great-lakes-blue'
  thickness?: 'thin' | 'thick'
  className?: string
} & React.ComponentPropsWithoutRef<T>

const ACCENT = {
  bucks: 'border-brand-bucksGreen ring-brand-bucksGreen/40',
  'great-lakes-blue': 'border-brand-greatLakesBlue ring-brand-greatLakesBlue/40',
} as const

export function Card<T extends React.ElementType = 'div'>({
  as,
  accent = 'bucks',
  thickness = 'thin',
  className,
  ...rest
}: CardProps<T>) {
  const Tag = as ?? 'div'
  return (
    <Tag
      className={cn(
        // Base surface with thin border by default; no ring at base
        'rounded-2xl bg-white p-4 shadow-sm',
        // Thickness controls border width; thick also adds a subtle ring
        thickness === 'thick' ? 'border-2 ring-1 ring-inset' : 'border',
        ACCENT[accent],
        className
      )}
      {...rest}
    />
  )
}
