import React from 'react'
import { cn } from '@/lib/cn'

export type CardGroupProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType
}

export function CardGroup({ as: As = 'ul', className, children, ...props }: CardGroupProps) {
  return (
    <As className={cn('card-group', className)} {...props}>
      {children}
    </As>
  )
}
