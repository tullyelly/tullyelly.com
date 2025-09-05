import * as React from 'react'
import { cn } from '@/lib/cn'

type CardProps<T extends React.ElementType = 'div'> = {
  as?: T
  accent?: 'bucks' | 'great-lakes-blue'
  thickness?: 'thin' | 'thick'
  className?: string
} & React.ComponentPropsWithoutRef<T>

const ACCENT = {
  bucks: 'border-brand-bucksGreen',
  'great-lakes-blue': 'border-brand-greatLakesBlue',
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
        // Base surface with Bucks green 2px borders by default
        'rounded-2xl bg-white p-4 shadow-sm',
        // Standardize on a 2px border; remove rings to avoid inner edges
        'border-2',
        ACCENT[accent],
        className
      )}
      {...rest}
    />
  )
}
