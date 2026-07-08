"use client";

import { useMemo, useState } from "react";
import type { LogEntry } from "@/lib/types";
import { todayLocal } from "@/lib/drinks";
import { useDrinks } from "@/lib/drinkStore";
import { useProfile } from "@/lib/profile";
import DrinkEditModal from "@/components/DrinkEditModal";
import {
  underLimitStreak,
  dryStreak,
  recentStats,
  topWeekday,
  last7Series,
  moneySavedLast7,
  thisWeek,
  badges,
} from "@/lib/stats";
import DrinkListItem from "@/components/DrinkListItem";
import WeeklyChart from "@/components/WeeklyChart";

type DayGroup = {
  date: string;
  logs: LogEntry[];
  std: number;
  calories: number;
};

export default function HistoryPage() {
  const logs = useDrinks();
  const profile = useProfile();
  const [editing, setEditing] = useState<LogEntry | null>(null);

  const groups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, DayGroup>();
    for (const log of logs) {
      const date = todayLocal(new Date(log.created_at));
      const g = map.get(date) ?? { date, logs: [], std: 0, calories: 0 };
      g.logs.push(log);
      g.std += log.standard_drinks;
      g.calories += log.calories;
      map.set(date, g);
    }
    return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [logs]);

  const limitStreak = useMemo(
    () => underLimitStreak(logs, profile.dailyLimitDrinks),
    [logs, profile.dailyLimitDrinks]
  );
  const dry = useMemo(() => dryStreak(logs), [logs]);
  const recent = useMemo(() => recentStats(logs), [logs]);
  const series = useMemo(() => last7Series(logs), [logs]);
  const busiestDay = useMemo(() => topWeekday(logs), [logs]);
  const saved = moneySavedLast7(recent, profile.costPerDrink, profile.baselineWeeklyDrinks);
  const week = useMemo(() => thisWeek(logs), [logs]);
  const earnedBadges = useMemo(() => badges(logs, profile.dailyLimitDrinks), [logs, profile.dailyLimitDrinks]);
  const showWeeklyGoals = profile.weeklyLimitDrinks > 0 || profile.dryDaysGoal > 0;

  const weekDelta = recent.last7Std - recent.prev7Std;
  const hasPrev = recent.prev7Std > 0;

  function labelFor(date: string) {
    if (date === todayLocal()) return "Today";
    const y = new Date();
    y.setDate(y.getDate() - 1);
    if (date === todayLocal(y)) return "Yesterday";
    return new Date(date + "T00:00:00").toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const hasData = logs.length > 0;

  return (
    <main className="space-y-5">
      {hasData && (
        <>
          {/* Streaks */}
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
              <div className="text-xs text-stone-500 dark:text-stone-400">🔥 Under your limit</div>
              <div className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-50">
                {limitStreak}
              </div>
              <div className="text-xs text-stone-400">day{limitStreak === 1 ? "" : "s"} in a row</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
              <div className="text-xs text-stone-500 dark:text-stone-400">🌿 Alcohol-free</div>
              <div className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-50">{dry}</div>
              <div className="text-xs text-stone-400">day{dry === 1 ? "" : "s"} in a row</div>
            </div>
          </section>

          {/* This week's goals */}
          {showWeeklyGoals && (
            <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">This week</h2>

              {profile.weeklyLimitDrinks > 0 &&
                (() => {
                  const over = week.std > profile.weeklyLimitDrinks;
                  const pct = Math.min(100, (week.std / profile.weeklyLimitDrinks) * 100);
                  return (
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-stone-500 dark:text-stone-400">Weekly limit</span>
                        <span
                          className={`font-semibold ${over ? "text-rose-600 dark:text-rose-400" : "text-stone-700 dark:text-stone-200"}`}
                        >
                          {week.std.toFixed(1)} / {profile.weeklyLimitDrinks}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                        <div
                          className={`h-full rounded-full ${over ? "bg-rose-500" : "bg-amber-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

              {profile.dryDaysGoal > 0 && (
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-stone-500 dark:text-stone-400">Alcohol-free days</span>
                    <span
                      className={`font-semibold ${week.dryDays >= profile.dryDaysGoal ? "text-emerald-600 dark:text-emerald-400" : "text-stone-700 dark:text-stone-200"}`}
                    >
                      {week.dryDays} / {profile.dryDaysGoal}
                      {week.dryDays >= profile.dryDaysGoal ? " 🎉" : ""}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: profile.dryDaysGoal }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${i < week.dryDays ? "bg-emerald-500" : "bg-stone-200 dark:bg-stone-800"}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Money saved */}
          {saved > 0 && (
            <section className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white shadow-sm">
              <div className="text-xs font-medium text-white/85">💰 Saved this week</div>
              <div className="mt-1 text-2xl font-bold">${Math.round(saved)}</div>
              <div className="text-xs text-white/80">
                vs your usual {profile.baselineWeeklyDrinks} drinks/week
              </div>
            </section>
          )}

          {/* Weekly chart */}
          <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                Last 7 days
              </h2>
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
                  {weekDelta > 0 ? "▲" : weekDelta < 0 ? "▼" : "•"}{" "}
                  {Math.abs(weekDelta).toFixed(1)} vs last week
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
            <h2 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-50">Badges</h2>
            <div className="grid grid-cols-3 gap-2">
              {earnedBadges.map((b) => (
                <div
                  key={b.id}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center ${
                    b.earned
                      ? "bg-amber-50 dark:bg-amber-500/10"
                      : "bg-stone-100 opacity-50 dark:bg-stone-800"
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
        </>
      )}

      {!hasData && (
        <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-400 dark:border-stone-700">
          No history yet. Log your first drink on the Track tab.
        </p>
      )}

      {groups.map((g) => (
        <section key={g.date}>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              {labelFor(g.date)}
            </h2>
            <span className="text-xs text-stone-400">
              {g.std.toFixed(1)} std · {Math.round(g.calories)} cal
            </span>
          </div>
          <ul className="space-y-2">
            {g.logs.map((log) => (
              <DrinkListItem key={log.id} log={log} onEdit={setEditing} showTime />
            ))}
          </ul>
        </section>
      ))}

      <DrinkEditModal log={editing} onClose={() => setEditing(null)} />
    </main>
  );
}
