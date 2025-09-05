import * as React from 'react'
import { cn } from '@/lib/cn'

type ButtonProps<T extends React.ElementType = 'button'> = {
  as?: T
  variant?: 'primary' | 'secondary'
  className?: string
} & React.ComponentPropsWithoutRef<T>

export function Button<T extends React.ElementType = 'button'>({
  as,
  variant = 'primary',
  className,
  ...rest
}: ButtonProps<T>) {
  const Tag = as ?? 'button'
  return (
    <Tag
      className={cn(
        'inline-block px-4 py-2 rounded font-semibold cursor-pointer hover:brightness-90 disabled:opacity-60 disabled:cursor-not-allowed',
        variant === 'primary'
          ? 'bg-blue text-text-on-blue'
          : 'bg-green text-text-on-green',
        className
      )}
      {...rest}
    />
  )
}

export default Button
