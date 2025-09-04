import React from 'react'
import { cn } from '@/lib/cn'

type CardGridProps = React.HTMLAttributes<HTMLUListElement> & {
  zebra?: boolean
}

export function CardGrid({ zebra, className, children, ...rest }: CardGridProps) {
  return (
    <ul
      role="list"
      className={cn('grid gap-3 sm:grid-cols-2', className)}
      {...(zebra ? { 'data-zebra': '' } : {})}
      {...rest}
    >
      {children}
    </ul>
  )
}
