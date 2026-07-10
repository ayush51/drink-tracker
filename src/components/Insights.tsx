"use client";

import { useMemo } from "react";
import { useDrinks } from "@/lib/drinkStore";
import { useProfile } from "@/lib/profile";
import {
  underLimitStreak,
  dryStreak,
  recentStats,
  topWeekday,
  last7Series,
  badges,
} from "@/lib/stats";
import WeeklyChart from "@/components/WeeklyChart";

export default function Insights() {
  const logs = useDrinks();
  const profile = useProfile();

  const limitStreak = useMemo(
    () => underLimitStreak(logs, profile.dailyLimitDrinks),
    [logs, profile.dailyLimitDrinks]
  );
  const dry = useMemo(() => dryStreak(logs), [logs]);
  const recent = useMemo(() => recentStats(logs), [logs]);
  const series = useMemo(() => last7Series(logs), [logs]);
  const busiestDay = useMemo(() => topWeekday(logs), [logs]);
  const earnedBadges = useMemo(
    () => badges(logs, profile.dailyLimitDrinks),
    [logs, profile.dailyLimitDrinks]
  );

  const weekDelta = recent.last7Std - recent.prev7Std;
  const hasPrev = recent.prev7Std > 0;

  if (logs.length === 0) return null;

  return (
    <div className="space-y-5">
      <h2 className="px-1 text-sm font-semibold text-stone-500 dark:text-stone-400">Your progress</h2>

      {/* Streaks */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
          <div className="text-xs text-stone-500 dark:text-stone-400">🔥 Under your limit</div>
          <div className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-50">{limitStreak}</div>
          <div className="text-xs text-stone-400">day{limitStreak === 1 ? "" : "s"} in a row</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
          <div className="text-xs text-stone-500 dark:text-stone-400">🌿 Alcohol-free</div>
          <div className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-50">{dry}</div>
          <div className="text-xs text-stone-400">day{dry === 1 ? "" : "s"} in a row</div>
        </div>
      </section>

      {/* Weekly chart */}
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
              {weekDelta > 0 ? "▲" : weekDelta < 0 ? "▼" : "•"} {Math.abs(weekDelta).toFixed(1)} vs
              last week
            </span>
          )}
        </div>
        <WeeklyChart data={series} limit={profile.dailyLimitDrinks} />
        <div className="mt-3 flex justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>{recent.last7Std.toFixed(1)} std drinks</span>
          <span>{Math.round(recent.last7Calories)} cal</span>
        </div>
      </section>

      {busiestDay && (
        <p className="px-1 text-xs text-stone-500 dark:text-stone-400">
          📅 You tend to drink most on <span className="font-semibold">{busiestDay}s</span>.
        </p>
      )}

      {/* Badges */}
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
        <h3 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-50">Badges</h3>
        <div className="grid grid-cols-3 gap-2">
          {earnedBadges.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center ${
                b.earned ? "bg-amber-50 dark:bg-amber-500/10" : "bg-stone-100 opacity-50 dark:bg-stone-800"
              }`}
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
