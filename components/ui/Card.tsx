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

const THICKNESS = {
  thin: 'border',
  thick: 'border-2',
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
        'rounded-2xl ring-1 ring-inset bg-white p-4 shadow-sm',
        THICKNESS[thickness],
        ACCENT[accent],
        className
      )}
      {...rest}
    />
  )
}
