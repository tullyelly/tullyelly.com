import React from 'react'
import { cn } from '@/lib/cn'

export type CardProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType
}

export function Card({ as: As = 'li', className, children, ...props }: CardProps) {
  return (
    <As
      className={cn('rounded-2xl border-2 border-brand-bucksGreen bg-white p-4 shadow-sm', className)}
      {...props}
    >
      {children}
    </As>
  )
}
