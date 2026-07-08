import type { LogEntry } from "@/lib/types";
import { todayLocal } from "@/lib/drinks";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Sum of standard drinks per local day. */
export function stdByDay(drinks: LogEntry[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const d of drinks) {
    const k = todayLocal(new Date(d.created_at));
    m.set(k, (m.get(k) ?? 0) + d.standard_drinks);
  }
  return m;
}

/** Local date string for `offsetBack` days before today. */
function dayString(offsetBack: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetBack);
  return todayLocal(d);
}

function firstLoggedDay(drinks: LogEntry[]): string | null {
  if (!drinks.length) return null;
  let min = Infinity;
  for (const d of drinks) min = Math.min(min, +new Date(d.created_at));
  return todayLocal(new Date(min));
}

/** Consecutive days up to today (within the tracked period) staying at/under the limit. */
export function underLimitStreak(drinks: LogEntry[], limit: number): number {
  if (limit <= 0 || !drinks.length) return 0;
  const m = stdByDay(drinks);
  const first = firstLoggedDay(drinks)!;
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const day = dayString(i);
    if (day < first) break;
    if ((m.get(day) ?? 0) <= limit + 1e-9) streak++;
    else break;
  }
  return streak;
}

/** Consecutive alcohol-free days up to today (within the tracked period). */
export function dryStreak(drinks: LogEntry[]): number {
  if (!drinks.length) return 0;
  const m = stdByDay(drinks);
  const first = firstLoggedDay(drinks)!;
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const day = dayString(i);
    if (day < first) break;
    if ((m.get(day) ?? 0) <= 1e-9) streak++;
    else break;
  }
  return streak;
}

export type RecentStats = {
  last7Std: number;
  last7Calories: number;
  last7Count: number;
  prev7Std: number;
};

/** Totals for the last 7 days and the 7 days before that (for week-over-week). */
export function recentStats(drinks: LogEntry[]): RecentStats {
  const d7 = dayString(6); // start of the current 7-day window
  const d8 = dayString(7);
  const d14 = dayString(13);
  let last7Std = 0,
    last7Calories = 0,
    last7Count = 0,
    prev7Std = 0;
  for (const d of drinks) {
    const day = todayLocal(new Date(d.created_at));
    if (day >= d7) {
      last7Std += d.standard_drinks;
      last7Calories += d.calories;
      last7Count += 1;
    } else if (day >= d14 && day <= d8) {
      prev7Std += d.standard_drinks;
    }
  }
  return { last7Std, last7Calories, last7Count, prev7Std };
}

/** The weekday with the most total standard drinks, or null if there's too little data. */
export function topWeekday(drinks: LogEntry[]): string | null {
  if (drinks.length < 3) return null;
  const totals = new Array(7).fill(0);
  for (const d of drinks) totals[new Date(d.created_at).getDay()] += d.standard_drinks;
  let maxI = 0;
  for (let i = 1; i < 7; i++) if (totals[i] > totals[maxI]) maxI = i;
  return totals[maxI] > 0 ? WEEKDAYS[maxI] : null;
}

export type DayBar = { date: string; label: string; std: number };

/** Standard drinks for each of the last 7 days, oldest first (for a bar chart). */
export function last7Series(drinks: LogEntry[]): DayBar[] {
  const m = stdByDay(drinks);
  const letters = ["S", "M", "T", "W", "T", "F", "S"];
  const out: DayBar[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = dayString(i);
    const dt = new Date(day + "T00:00:00");
    out.push({ date: day, label: letters[dt.getDay()], std: m.get(day) ?? 0 });
  }
  return out;
}

/** Estimated money saved over the last 7 days vs a typical week (0 if not configured). */
export function moneySavedLast7(
  recent: RecentStats,
  costPerDrink: number,
  baselineWeeklyDrinks: number
): number {
  if (costPerDrink <= 0 || baselineWeeklyDrinks <= 0) return 0;
  return Math.max(0, baselineWeeklyDrinks - recent.last7Count) * costPerDrink;
}
