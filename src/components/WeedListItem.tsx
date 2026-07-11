"use client";

import type { SessionEntry } from "@/lib/types";
import { METHOD_EMOJI } from "@/lib/weed";

type Props = {
  session: SessionEntry;
  onDelete?: (id: string) => void;
  onEdit?: (session: SessionEntry) => void;
  showTime?: boolean;
};

export default function WeedListItem({ session, onDelete, onEdit, showTime }: Props) {
  const time = showTime
    ? new Date(session.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <li
      onClick={onEdit ? () => onEdit(session) : undefined}
      className={`flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900 ${
        onEdit ? "cursor-pointer transition-colors hover:border-emerald-300 dark:hover:border-emerald-500/40" : ""
      }`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: "color-mix(in srgb, var(--accent-solid) 12%, transparent)" }}
      >
        {METHOD_EMOJI[session.method] ?? "🌿"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-stone-900 dark:text-stone-50">
            {session.name}
          </span>
          {time && <span className="shrink-0 text-[11px] text-stone-400">{time}</span>}
        </div>
        <div className="text-xs text-stone-500 dark:text-stone-400">
          {session.method}
          {session.amount ? ` · ${session.amount}` : ""}
          {session.thc_percent > 0 ? ` · ${session.thc_percent}% THC` : ""}
        </div>
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(session.id);
          }}
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
