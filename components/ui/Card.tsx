import React from 'react'
import { cn } from '@/lib/cn'

export type CardProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType
  variant?: 'accent' | 'brand'
}

export function Card({
  as: As = 'li',
  className,
  variant,
  children,
  ...props
}: CardProps) {
  return (
    <As
      data-variant={variant}
      className={cn('card', className)}
      {...props}
    >
      {children}
    </As>
  )
}
