import React from 'react'

export function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <ul role="list" className="grid gap-3 sm:grid-cols-2">
      {children}
    </ul>
  )
}
