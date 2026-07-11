import type { SessionEntry } from "@/lib/types";
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

/** Count of sessions per local day. */
export function countByDay(sessions: SessionEntry[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of sessions) {
    const k = todayLocal(new Date(s.created_at));
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function dayString(offsetBack: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetBack);
  return todayLocal(d);
}

function firstLoggedDay(sessions: SessionEntry[]): string | null {
  if (!sessions.length) return null;
  let min = Infinity;
  for (const s of sessions) min = Math.min(min, +new Date(s.created_at));
  return todayLocal(new Date(min));
}

/** Consecutive days up to today staying at/under the daily session limit. */
export function underLimitStreakSessions(sessions: SessionEntry[], limit: number): number {
  if (limit <= 0 || !sessions.length) return 0;
  const m = countByDay(sessions);
  const first = firstLoggedDay(sessions)!;
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const day = dayString(i);
    if (day < first) break;
    if ((m.get(day) ?? 0) <= limit) streak++;
    else break;
  }
  return streak;
}

/** Consecutive session-free days up to today (a "T-break" streak). */
export function tBreakStreak(sessions: SessionEntry[]): number {
  if (!sessions.length) return 0;
  const m = countByDay(sessions);
  const first = firstLoggedDay(sessions)!;
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const day = dayString(i);
    if (day < first) break;
    if ((m.get(day) ?? 0) === 0) streak++;
    else break;
  }
  return streak;
}

export type RecentSessionStats = {
  last7Count: number;
  prev7Count: number;
};

export function recentSessionStats(sessions: SessionEntry[]): RecentSessionStats {
  const d7 = dayString(6);
  const d8 = dayString(7);
  const d14 = dayString(13);
  let last7Count = 0,
    prev7Count = 0;
  for (const s of sessions) {
    const day = todayLocal(new Date(s.created_at));
    if (day >= d7) last7Count += 1;
    else if (day >= d14 && day <= d8) prev7Count += 1;
  }
  return { last7Count, prev7Count };
}

export function topWeekdaySessions(sessions: SessionEntry[]): string | null {
  if (sessions.length < 3) return null;
  const totals = new Array(7).fill(0);
  for (const s of sessions) totals[new Date(s.created_at).getDay()] += 1;
  let maxI = 0;
  for (let i = 1; i < 7; i++) if (totals[i] > totals[maxI]) maxI = i;
  return totals[maxI] > 0 ? WEEKDAYS[maxI] : null;
}

export type DayBar = { date: string; label: string; count: number };

export function last7SessionSeries(sessions: SessionEntry[]): DayBar[] {
  const m = countByDay(sessions);
  const letters = ["S", "M", "T", "W", "T", "F", "S"];
  const out: DayBar[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = dayString(i);
    const dt = new Date(day + "T00:00:00");
    out.push({ date: day, label: letters[dt.getDay()], count: m.get(day) ?? 0 });
  }
  return out;
}

function trackedFreeDays(sessions: SessionEntry[]): number {
  if (!sessions.length) return 0;
  const m = countByDay(sessions);
  const first = firstLoggedDay(sessions)!;
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const day = dayString(i);
    if (day < first) break;
    if ((m.get(day) ?? 0) === 0) n++;
  }
  return n;
}

export type Badge = { id: string; icon: string; label: string; earned: boolean };

export function sessionBadges(sessions: SessionEntry[], dailyLimit: number): Badge[] {
  const under = underLimitStreakSessions(sessions, dailyLimit);
  const tBreak = tBreakStreak(sessions);
  const freeTotal = trackedFreeDays(sessions);
  return [
    { id: "first", icon: "🌿", label: "First session", earned: sessions.length > 0 },
    { id: "streak3", icon: "🔥", label: "3-day streak", earned: under >= 3 },
    { id: "streak7", icon: "⭐", label: "Week under limit", earned: under >= 7 },
    { id: "free1", icon: "🍃", label: "First T-break day", earned: freeTotal >= 1 },
    { id: "free3", icon: "🌱", label: "3-day T-break", earned: tBreak >= 3 },
    { id: "free7", icon: "🏆", label: "Week-long T-break", earned: tBreak >= 7 },
  ];
}
