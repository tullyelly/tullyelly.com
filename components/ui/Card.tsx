import React from 'react'
import { cn } from '@/lib/cn'

export type CardProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType
  zebraIgnore?: boolean
}

export function Card({
  as: As = 'li',
  zebraIgnore,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <As
      data-card
      className={cn('card', className)}
      {...(zebraIgnore ? { 'data-zebra-ignore': '' } : {})}
      {...rest}
    >
      {children}
    </As>
  )
}
