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

function startOfWeek(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // back to Monday
  return d;
}

export type ThisWeek = {
  std: number;
  dryDays: number;
  daysElapsed: number;
};

/** Standard drinks and alcohol-free days for the current calendar week (Mon–today). */
export function thisWeek(drinks: LogEntry[]): ThisWeek {
  const start = startOfWeek();
  const byDay = stdByDay(drinks);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysElapsed = Math.floor((+today - +start) / 86400000) + 1;
  let std = 0;
  let dryDays = 0;
  for (let i = 0; i < daysElapsed; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const s = byDay.get(todayLocal(d)) ?? 0;
    std += s;
    if (s <= 1e-9) dryDays++;
  }
  return { std, dryDays, daysElapsed };
}

/** Total alcohol-free days within the tracked period. */
function trackedDryDays(drinks: LogEntry[]): number {
  if (!drinks.length) return 0;
  const m = stdByDay(drinks);
  const first = firstLoggedDay(drinks)!;
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const day = dayString(i);
    if (day < first) break;
    if ((m.get(day) ?? 0) <= 1e-9) n++;
  }
  return n;
}

export type Badge = { id: string; icon: string; label: string; earned: boolean };

export function badges(drinks: LogEntry[], dailyLimit: number): Badge[] {
  const under = underLimitStreak(drinks, dailyLimit);
  const dry = dryStreak(drinks);
  const dryTotal = trackedDryDays(drinks);
  return [
    { id: "first", icon: "🍹", label: "First log", earned: drinks.length > 0 },
    { id: "streak3", icon: "🔥", label: "3-day streak", earned: under >= 3 },
    { id: "streak7", icon: "⭐", label: "Week under limit", earned: under >= 7 },
    { id: "dry1", icon: "🌿", label: "First dry day", earned: dryTotal >= 1 },
    { id: "dry3", icon: "🍃", label: "3 dry days in a row", earned: dry >= 3 },
    { id: "dry7", icon: "🏆", label: "Dry week", earned: dry >= 7 },
  ];
}

/**
 * Very rough Widmark BAC estimate for today's drinks. Returns null if not
 * computable. NOT medical/legal advice — an estimate only.
 */
export function estimateBAC(
  todayDrinks: LogEntry[],
  weightKg: number,
  sex: "male" | "female"
): number | null {
  if (!weightKg || weightKg <= 0 || todayDrinks.length === 0) return null;
  const grams = todayDrinks.reduce((s, d) => s + d.standard_drinks, 0) * 14;
  const r = sex === "female" ? 0.55 : 0.68;
  const peak = (grams / (weightKg * 1000 * r)) * 100;
  const first = Math.min(...todayDrinks.map((d) => +new Date(d.created_at)));
  const hours = Math.max(0, (Date.now() - first) / 3600000);
  return Math.max(0, peak - 0.015 * hours);
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
