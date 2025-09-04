import React from 'react'
import { cn } from '@/lib/cn'

export type CardProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType
  accent?: 'default' | 'greatLakesBlue'
}

export function Card({
  as: As = 'li',
  accent = 'default',
  className,
  children,
  ...props
}: CardProps) {
  const accentClasses =
    accent === 'greatLakesBlue'
      ? 'border-brand-greatLakesBlue ring-1 ring-inset ring-brand-greatLakesBlue/40'
      : 'border-brand-bucksGreen'

  return (
    <As
      className={cn(
        'rounded-2xl border-2 bg-white p-4 shadow-sm',
        accentClasses,
        className
      )}
      {...props}
    >
      {children}
    </As>
  )
}
