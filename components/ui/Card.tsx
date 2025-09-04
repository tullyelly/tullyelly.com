import * as React from 'react'
import { cn } from '@/lib/cn'

type CardProps<T extends React.ElementType = 'div'> = {
  as?: T
  accent?: 'default' | 'great-lakes-blue'
  className?: string
} & React.ComponentPropsWithoutRef<T>

const ACCENTS = {
  default: 'border-brand-bucksGreen ring-brand-bucksGreen/40',
  'great-lakes-blue': 'border-brand-greatLakesBlue ring-brand-greatLakesBlue/40',
} as const

export function Card<T extends React.ElementType = 'div'>({
  as,
  accent = 'default',
  className,
  ...rest
}: CardProps<T>) {
  const Tag = as ?? 'div'
  return (
    <Tag
      className={cn(
        'rounded-2xl border-2 ring-1 ring-inset bg-white p-4 shadow-sm',
        ACCENTS[accent],
        className
      )}
      {...rest}
    />
  )
}
