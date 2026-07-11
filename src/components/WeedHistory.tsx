"use client";

import { useMemo, useState } from "react";
import type { SessionEntry } from "@/lib/types";
import { todayLocal } from "@/lib/drinks";
import { useSessions } from "@/lib/sessionStore";
import WeedEditModal from "@/components/WeedEditModal";
import WeedListItem from "@/components/WeedListItem";

type DayGroup = { date: string; sessions: SessionEntry[] };

export default function WeedHistory() {
  const sessions = useSessions();
  const [editing, setEditing] = useState<SessionEntry | null>(null);

  const groups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, DayGroup>();
    for (const s of sessions) {
      const date = todayLocal(new Date(s.created_at));
      const g = map.get(date) ?? { date, sessions: [] };
      g.sessions.push(s);
      map.set(date, g);
    }
    return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [sessions]);

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

  if (sessions.length === 0) {
    return (
      <main>
        <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-400 dark:border-stone-700">
          No history yet. Log your first session on the Track tab.
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-5">
      {groups.map((g) => (
        <section key={g.date}>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              {labelFor(g.date)}
            </h2>
            <span className="text-xs text-stone-400">
              {g.sessions.length} session{g.sessions.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="space-y-2">
            {g.sessions.map((s) => (
              <WeedListItem key={s.id} session={s} onEdit={setEditing} showTime />
            ))}
          </ul>
        </section>
      ))}

      <WeedEditModal session={editing} onClose={() => setEditing(null)} />
    </main>
  );
}
