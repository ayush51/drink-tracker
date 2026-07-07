"use client";

import { useMemo, useState } from "react";
import { todayLocal } from "@/lib/drinks";
import { useDrinks } from "@/lib/drinkStore";
import DrinkListItem from "@/components/DrinkListItem";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11
  const [selected, setSelected] = useState<string>(todayLocal());
  const allDrinks = useDrinks();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  // Per-day aggregates for the visible month.
  const byDay = useMemo(() => {
    const map = new Map<string, { count: number; std: number }>();
    for (const log of allDrinks) {
      const key = todayLocal(new Date(log.created_at));
      const cur = map.get(key) ?? { count: 0, std: 0 };
      cur.count += 1;
      cur.std += log.standard_drinks;
      map.set(key, cur);
    }
    return map;
  }, [allDrinks]);

  const selectedLogs = useMemo(
    () => allDrinks.filter((l) => todayLocal(new Date(l.created_at)) === selected),
    [allDrinks, selected]
  );

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const today = todayLocal();

  return (
    <main className="space-y-5">
      <section className="rounded-3xl bg-white p-4 shadow-sm dark:bg-stone-900">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="rounded-full p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="rounded-full p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="pb-1 text-[11px] font-semibold text-stone-400">
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const key = ymd(year, month, day);
            const agg = byDay.get(key);
            const isToday = key === today;
            const isSelected = key === selected;
            return (
              <button
                key={i}
                onClick={() => setSelected(key)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors ${
                  isSelected
                    ? "bg-gradient-to-br from-amber-500 to-orange-600 font-semibold text-white"
                    : isToday
                      ? "bg-amber-50 font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                      : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                }`}
              >
                {day}
                {agg && (
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-white" : agg.std > 3 ? "bg-rose-500" : "bg-amber-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-stone-500 dark:text-stone-400">
          {new Date(selected + "T00:00:00").toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>
        {selectedLogs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
            No drinks logged this day.
          </p>
        ) : (
          <ul className="space-y-2">
            {selectedLogs.map((log) => (
              <DrinkListItem key={log.id} log={log} showTime />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
