
import { ReactNode, forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type ShoutOutProps = {
  children: ReactNode
  variant?: 'whisper' | 'note' | 'spark'
  icon?: 'none' | 'star' | 'sprout' | 'quill'
  as?: 'span' | 'div'
} & HTMLAttributes<HTMLElement>

const icons = {
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd"/>
    </svg>
  ),
  sprout: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" />
      <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" />
      <path d="M5 21h14" />
    </svg>
  ),
  quill: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z" />
      <path d="M16 8 2 22" />
      <path d="M17.5 15H9" />
    </svg>
  ),
}

const ShoutOut = forwardRef<HTMLSpanElement | HTMLDivElement, ShoutOutProps>(
  function ShoutOut(
    { children, variant = 'whisper', icon = 'star', as: Component = 'span', className, style, ...rest }: ShoutOutProps,
    ref,
  ) {
    const Icon = icon === 'none' ? null : icons[icon]
    return (
      <Component
        ref={ref as any}
        role="note"
        aria-label="Shout out"
        data-variant={variant}
        className={cn(
          'so-inline text-[0.95em] font-medium tracking-wide text-muted-foreground',
          Component === 'div' ? 'block' : '',
          variant === 'note' && Component === 'div' ? 'px-2 py-1' : '',
          className,
        )}
        style={style}
        {...rest}
      >
        {Icon && <span className="so-icon inline-flex" aria-hidden>{Icon}</span>}
        {children}
      </Component>
    )
  },
)

export default ShoutOut
