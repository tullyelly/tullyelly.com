import type { AnalyticsPeriod } from "@/lib/analytics/types";

export const ANALYTICS_TIME_ZONE = "America/Chicago";

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseYmd(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(value: string, days: number): string {
  const date = parseYmd(value);
  date.setUTCDate(date.getUTCDate() + days);
  return ymd(date);
}

function chicagoDate(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ANALYTICS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function mondayForDate(value: string): string {
  const date = parseYmd(value.slice(0, 10));
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
  return ymd(date);
}

function concise(value: string): string {
  const [, month, day] = value.split("-").map(Number);
  return `${SHORT_MONTHS[month - 1]} ${day}`;
}

function fullRange(start: string, end: string): string {
  const format = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return `${SHORT_MONTHS[month - 1]} ${day}, ${year}`;
  };
  return `${format(start)} to ${format(end)}`;
}

export function buildWeeklyPeriods(now = new Date(), count = 10): AnalyticsPeriod[] {
  const safeCount = Math.max(0, Math.floor(count));
  const currentMonday = mondayForDate(chicagoDate(now));
  return Array.from({ length: safeCount }, (_, index) => {
    const periodStart = addDays(currentMonday, (index - safeCount + 1) * 7);
    const periodEnd = addDays(periodStart, 6);
    return { periodStart, periodEnd, shortLabel: concise(periodStart), fullLabel: fullRange(periodStart, periodEnd) };
  });
}

export function periodStartForActivityDate(value: string): string {
  return mondayForDate(value.slice(0, 10));
}
