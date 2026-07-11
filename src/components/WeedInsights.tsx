"use client";

import { useMemo } from "react";
import { useSessions } from "@/lib/sessionStore";
import { useProfile } from "@/lib/profile";
import {
  underLimitStreakSessions,
  tBreakStreak,
  recentSessionStats,
  topWeekdaySessions,
  last7SessionSeries,
  sessionBadges,
} from "@/lib/weedStats";
import WeeklyChart from "@/components/WeeklyChart";

export default function WeedInsights() {
  const sessions = useSessions();
  const profile = useProfile();

  const limitStreak = useMemo(
    () => underLimitStreakSessions(sessions, profile.dailySessionLimit),
    [sessions, profile.dailySessionLimit]
  );
  const tBreak = useMemo(() => tBreakStreak(sessions), [sessions]);
  const recent = useMemo(() => recentSessionStats(sessions), [sessions]);
  const series = useMemo(
    () => last7SessionSeries(sessions).map((d) => ({ date: d.date, label: d.label, value: d.count })),
    [sessions]
  );
  const busiestDay = useMemo(() => topWeekdaySessions(sessions), [sessions]);
  const earnedBadges = useMemo(
    () => sessionBadges(sessions, profile.dailySessionLimit),
    [sessions, profile.dailySessionLimit]
  );

  const weekDelta = recent.last7Count - recent.prev7Count;
  const hasPrev = recent.prev7Count > 0;

  if (sessions.length === 0) return null;

  return (
    <div className="space-y-5">
      <h2 className="px-1 text-sm font-semibold text-stone-500 dark:text-stone-400">Your progress</h2>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
          <div className="text-xs text-stone-500 dark:text-stone-400">🔥 Under your limit</div>
          <div className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-50">{limitStreak}</div>
          <div className="text-xs text-stone-400">day{limitStreak === 1 ? "" : "s"} in a row</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
          <div className="text-xs text-stone-500 dark:text-stone-400">🍃 T-break</div>
          <div className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-50">{tBreak}</div>
          <div className="text-xs text-stone-400">day{tBreak === 1 ? "" : "s"} in a row</div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Last 7 days</h3>
          {hasPrev && (
            <span
              className={`text-xs font-medium ${
                weekDelta > 0
                  ? "text-rose-500"
                  : weekDelta < 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-stone-400"
              }`}
            >
              {weekDelta > 0 ? "▲" : weekDelta < 0 ? "▼" : "•"} {Math.abs(weekDelta)} vs last week
            </span>
          )}
        </div>
        <WeeklyChart
          data={series}
          limit={profile.dailySessionLimit}
          formatTooltip={(v) => `${v} session${v === 1 ? "" : "s"}`}
        />
        <div className="mt-3 text-xs text-stone-500 dark:text-stone-400">
          {recent.last7Count} session{recent.last7Count === 1 ? "" : "s"} this week
        </div>
      </section>

      {busiestDay && (
        <p className="px-1 text-xs text-stone-500 dark:text-stone-400">
          📅 You tend to session most on <span className="font-semibold">{busiestDay}s</span>.
        </p>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
        <h3 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-50">Badges</h3>
        <div className="grid grid-cols-3 gap-2">
          {earnedBadges.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center ${
                b.earned ? "" : "bg-stone-100 opacity-50 dark:bg-stone-800"
              }`}
              style={
                b.earned
                  ? { backgroundColor: "color-mix(in srgb, var(--accent-solid) 12%, transparent)" }
                  : undefined
              }
            >
              <span className={`text-2xl ${b.earned ? "" : "grayscale"}`}>{b.icon}</span>
              <span className="text-[10px] font-medium leading-tight text-stone-600 dark:text-stone-300">
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
