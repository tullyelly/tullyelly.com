'use client';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Badge } from '@/app/ui/Badge';
import { cn } from '@/lib/cn';

export type TrendValue = 'up' | 'down' | 'flat';

type TrendPillProps = {
  trend: TrendValue;
};

const iconClass = 'h-4 w-4';

const trendStyles: Record<TrendValue, string> = {
  up: 'gap-1 bg-[var(--green)] text-white ring-[var(--green)]/40',
  down: 'gap-1 bg-[#C41E3A] text-white ring-[#C41E3A]/40',
  flat: 'gap-1 bg-[var(--blue)] text-[var(--text-on-blue)] ring-[var(--blue)]/40',
};

export function TrendPill({ trend }: TrendPillProps) {
  const icon = trend === 'up' ? <ArrowUpRight className={iconClass} /> : trend === 'down' ? <ArrowDownRight className={iconClass} /> : <Minus className={iconClass} />;
  const label = trend === 'flat' ? 'flat' : trend;
  const aria = trend === 'up' ? 'Trending up' : trend === 'down' ? 'Trending down' : 'No change';

  return (
    <Badge aria-label={aria} className={cn('capitalize', trendStyles[trend])}>
      {icon}
      {label}
    </Badge>
  );
}

export default TrendPill;
