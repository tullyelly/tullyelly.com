export type Dateish = string | number | Date | null | undefined;

export type Tz = 'UTC' | 'America/Chicago';

export type Mode = 'date' | 'time' | 'datetime' | 'relative';

const DEFAULT_TZ: Tz = 'America/Chicago';

const PRESETS: Record<Exclude<Mode, 'relative'>, Record<'short' | 'medium' | 'long', Intl.DateTimeFormatOptions>> = {
  date: {
    short: { year: '2-digit', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: '2-digit' },
    long: { year: 'numeric', month: 'long', day: '2-digit' },
  },
  time: {
    short: { hour: '2-digit', minute: '2-digit' },
    medium: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
    long: { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' },
  },
  datetime: {
    short: { year: '2-digit', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    medium: { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' },
    long: {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    },
  },
};

const NOT_AVAILABLE = 'Not available';

function parseDateish(value: Dateish): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function fmt(
  value: Dateish,
  opts?: {
    mode?: Mode;
    tz?: Tz;
    style?: 'short' | 'medium' | 'long';
  },
): string {
  const date = parseDateish(value);
  if (!date) return NOT_AVAILABLE;

  const { mode = 'datetime', tz = DEFAULT_TZ, style = 'medium' } = opts ?? {};

  if (mode === 'relative') {
    const diffMs = Date.now() - date.getTime();
    const isFuture = diffMs < 0;
    const mins = Math.round(Math.abs(diffMs) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ${isFuture ? 'from now' : 'ago'}`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ${isFuture ? 'from now' : 'ago'}`;
    const days = Math.round(hrs / 24);
    return `${days} day${days === 1 ? '' : 's'} ${isFuture ? 'from now' : 'ago'}`;
  }

  const formatOpts = PRESETS[mode][style];

  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    ...formatOpts,
  }).format(date);
}

export function fmtDate(
  value: Dateish,
  tz: Tz = DEFAULT_TZ,
  style: 'short' | 'medium' | 'long' = 'medium',
): string {
  return fmt(value, { mode: 'date', tz, style });
}

export function fmtTime(
  value: Dateish,
  tz: Tz = DEFAULT_TZ,
  style: 'short' | 'medium' | 'long' = 'short',
): string {
  return fmt(value, { mode: 'time', tz, style });
}

export function fmtDateTime(
  value: Dateish,
  tz: Tz = DEFAULT_TZ,
  style: 'short' | 'medium' | 'long' = 'medium',
): string {
  return fmt(value, { mode: 'datetime', tz, style });
}

export function fmtRelative(value: Dateish): string {
  return fmt(value, { mode: 'relative' });
}
