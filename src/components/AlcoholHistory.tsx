"use client";

import { useMemo, useState } from "react";
import type { LogEntry } from "@/lib/types";
import { todayLocal } from "@/lib/drinks";
import { useDrinks } from "@/lib/drinkStore";
import { useProfile } from "@/lib/profile";
import DrinkEditModal from "@/components/DrinkEditModal";
import { recentStats, moneySavedLast7, thisWeek } from "@/lib/stats";
import DrinkListItem from "@/components/DrinkListItem";

type DayGroup = {
  date: string;
  logs: LogEntry[];
  std: number;
  calories: number;
};

export default function AlcoholHistory() {
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

  const recent = useMemo(() => recentStats(logs), [logs]);
  const saved = moneySavedLast7(recent, profile.costPerDrink, profile.baselineWeeklyDrinks);
  const week = useMemo(() => thisWeek(logs), [logs]);
  const showWeeklyGoals = profile.weeklyLimitDrinks > 0 || profile.dryDaysGoal > 0;

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
      {hasData && showWeeklyGoals && (
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
                      className={`h-full rounded-full ${over ? "bg-rose-500" : ""}`}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: over ? undefined : "var(--accent-solid)",
                      }}
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

      {hasData && saved > 0 && (
        <section className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white shadow-sm">
          <div className="text-xs font-medium text-white/85">💰 Saved this week</div>
          <div className="mt-1 text-2xl font-bold">${Math.round(saved)}</div>
          <div className="text-xs text-white/80">
            vs your usual {profile.baselineWeeklyDrinks} drinks/week
          </div>
        </section>
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
