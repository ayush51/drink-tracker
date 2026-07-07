"use client";

import type { LogEntry } from "@/lib/types";
import { DRINK_EMOJI } from "@/lib/drinks";

type Props = {
  log: LogEntry;
  onDelete?: (id: string) => void;
  showTime?: boolean;
};

export default function DrinkListItem({ log, onDelete, showTime }: Props) {
  const time = showTime
    ? new Date(log.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl dark:bg-amber-500/10">
        {DRINK_EMOJI[log.drink_type] ?? "🍹"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-stone-900 dark:text-stone-50">
            {log.name}
          </span>
          {time && <span className="shrink-0 text-[11px] text-stone-400">{time}</span>}
        </div>
        <div className="text-xs text-stone-500 dark:text-stone-400">
          {log.volume_ml}ml · {log.abv_percent}% · {Math.round(log.calories)} cal ·{" "}
          {log.standard_drinks.toFixed(1)} std
        </div>
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(log.id)}
          aria-label="Delete entry"
          className="shrink-0 rounded-full p-1.5 text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:text-stone-600 dark:hover:bg-rose-500/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4h6v3" />
          </svg>
        </button>
      )}
    </li>
  );
}
