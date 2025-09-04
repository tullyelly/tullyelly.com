export type CardItem = {
  id: string
  title: string
  subtitle?: string
  meta?: string | number
  description?: string
  href?: string
  badges?: Array<{ label: string; tone?: 'neutral' | 'success' | 'warning' }>
}

export function mapDomainToCardItem<T>(items: T[], mapper: (item: T) => CardItem): CardItem[] {
  return items.map(mapper)
}

export { Card } from './Card'
// Re-export the canonical Badge to keep a single source of truth
export { Badge } from '@/app/ui/Badge'
export { CardGrid } from './CardGrid'
