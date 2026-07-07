"use client";

import { useEffect, useMemo, useState } from "react";
import type { LogEntry } from "@/lib/types";
import { todayLocal } from "@/lib/drinks";
import DrinkListItem from "@/components/DrinkListItem";

type DayGroup = {
  date: string;
  logs: LogEntry[];
  std: number;
  calories: number;
};

export default function HistoryPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/logs`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setLogs(data);
        setLoaded(true);
      });
  }, []);

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

  const weekStats = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffStr = todayLocal(cutoff);
    let std = 0;
    let calories = 0;
    for (const log of logs) {
      if (todayLocal(new Date(log.created_at)) >= cutoffStr) {
        std += log.standard_drinks;
        calories += log.calories;
      }
    }
    return { std, calories };
  }, [logs]);

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

  return (
    <main className="space-y-5">
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
          <div className="text-xs text-stone-500 dark:text-stone-400">Last 7 days</div>
          <div className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-50">
            {weekStats.std.toFixed(1)}
          </div>
          <div className="text-xs text-stone-400">standard drinks</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900">
          <div className="text-xs text-stone-500 dark:text-stone-400">Last 7 days</div>
          <div className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-50">
            {Math.round(weekStats.calories)}
          </div>
          <div className="text-xs text-stone-400">calories</div>
        </div>
      </section>

      {loaded && groups.length === 0 && (
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
              <DrinkListItem key={log.id} log={log} showTime />
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
