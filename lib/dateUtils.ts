/**
 * Date range helpers for Finance summary (today / this week).
 */

export type DateRange = { start: string; end: string };

function toISO(d: Date): string {
  return d.toISOString();
}

/** Start of today (local midnight) and end of today (23:59:59.999). */
export function todayRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start: toISO(start), end: toISO(end) };
}

/** Start of this week (Sunday 00:00) and end of today. */
export function thisWeekRange(): DateRange {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start: toISO(start), end: toISO(end) };
}
