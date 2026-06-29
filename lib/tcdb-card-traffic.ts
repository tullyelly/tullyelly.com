const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 10;
const MIN_CHRONICLE_SLOT = 6;
const MAX_CHRONICLE_SLOT = 10;
const SITE_TIME_ZONE = "America/Chicago";

export type TcdbCardTrafficCalendarDay = {
  date: string;
  slot: number;
  isChronicleDate: boolean;
};

export type TcdbCardTrafficDay = TcdbCardTrafficCalendarDay & {
  cardTotal: number;
  tradeCount: number;
};

export type TcdbCardTrafficWindow = {
  chronicleDate: string;
  todayDate: string;
  chronicleSlot: number;
  startDate: string;
  endDate: string;
  dates: TcdbCardTrafficCalendarDay[];
};

type TrafficCounts = {
  cardTotal: number;
  tradeCount: number;
};

export function normalizeTcdbCardTrafficDate(value: string): string {
  const match = value.trim().match(ISO_DATE_RE);

  if (!match) {
    throw new Error("TCDb card traffic date must start with YYYY-MM-DD.");
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("TCDb card traffic date must be a valid calendar date.");
  }

  return `${yearValue}-${monthValue}-${dayValue}`;
}

function formatDateParts(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(
    2,
    "0",
  )}-${String(day).padStart(2, "0")}`;
}

function toUtcDate(value: string): Date {
  const date = normalizeTcdbCardTrafficDate(value);
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDate(value: Date): string {
  return formatDateParts(
    value.getUTCFullYear(),
    value.getUTCMonth() + 1,
    value.getUTCDate(),
  );
}

function addDays(date: string, days: number): string {
  const value = toUtcDate(date);
  value.setUTCDate(value.getUTCDate() + days);
  return formatUtcDate(value);
}

function daysBetween(startDate: string, endDate: string): number {
  const start = toUtcDate(startDate).getTime();
  const end = toUtcDate(endDate).getTime();
  return Math.round((end - start) / MS_PER_DAY);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getServerTodayDateString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const byType = new Map(parts.map((part) => [part.type, part.value]));

  return formatDateParts(
    Number(byType.get("year")),
    Number(byType.get("month")),
    Number(byType.get("day")),
  );
}

export function buildTcdbCardTrafficWindow(
  chronicleDateInput: string,
  todayDateInput = getServerTodayDateString(),
): TcdbCardTrafficWindow {
  const chronicleDate = normalizeTcdbCardTrafficDate(chronicleDateInput);
  const todayDate = normalizeTcdbCardTrafficDate(todayDateInput);
  const daysAgo = daysBetween(chronicleDate, todayDate);
  const chronicleSlot = clamp(
    MAX_CHRONICLE_SLOT - daysAgo,
    MIN_CHRONICLE_SLOT,
    MAX_CHRONICLE_SLOT,
  );
  const startDate = addDays(chronicleDate, -(chronicleSlot - 1));
  const dates = Array.from({ length: WINDOW_DAYS }, (_, index) => {
    const date = addDays(startDate, index);

    return {
      date,
      slot: index + 1,
      isChronicleDate: date === chronicleDate,
    };
  });
  const endDate = dates[dates.length - 1]?.date ?? startDate;

  return {
    chronicleDate,
    todayDate,
    chronicleSlot,
    startDate,
    endDate,
    dates,
  };
}

export function buildTcdbCardTrafficRows(
  chronicleDateInput: string,
  todayDateInput = getServerTodayDateString(),
  trafficByDate: Map<string, TrafficCounts> = new Map(),
): TcdbCardTrafficDay[] {
  const trafficWindow = buildTcdbCardTrafficWindow(
    chronicleDateInput,
    todayDateInput,
  );

  return trafficWindow.dates.map((day) => {
    const counts = trafficByDate.get(day.date);

    return {
      ...day,
      cardTotal: counts?.cardTotal ?? 0,
      tradeCount: counts?.tradeCount ?? 0,
    };
  });
}
