"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useGroup,
  joinGroup,
  leaveGroup,
  fetchGroupData,
  backfillDrinks,
  subscribeToGroup,
  toggleReaction,
  socialEnabled,
  DEFAULT_GROUP,
  type GroupDrink,
  type Member,
  type Reaction,
  type Membership,
} from "@/lib/group";
import { useDrinks } from "@/lib/drinkStore";
import { useProfile } from "@/lib/profile";
import { DRINK_EMOJI } from "@/lib/drinks";

function thisWeeksDrinks<T extends { created_at: string }>(drinks: T[]): T[] {
  const start = weekStart();
  return drinks.filter((d) => new Date(d.created_at) >= start);
}

function weekStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
  return d;
}

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-stone-700 dark:bg-stone-900";

export default function GroupPage() {
  const membership = useGroup();

  if (!socialEnabled) {
    return (
      <main>
        <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-400 dark:border-stone-700">
          Social features aren&apos;t set up on this build.
        </p>
      </main>
    );
  }

  return membership ? <GroupView membership={membership} /> : <JoinForm />;
}

const REACTIONS = ["🍻", "🔥", "😂", "👏"];

function JoinForm() {
  const localDrinks = useDrinks();
  const profile = useProfile();
  const [override, setOverride] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usingProfileName = Boolean(profile.name) && !override;

  async function submit(joinName?: string) {
    const n = (joinName ?? name).trim();
    if (!n) return;
    setBusy(true);
    setError(null);
    const res = await joinGroup(n, DEFAULT_GROUP);
    if (!res.ok) {
      setError(res.error ?? "Could not join.");
      setBusy(false);
      return;
    }
    // bring this week's already-logged drinks onto the board
    await backfillDrinks(thisWeeksDrinks(localDrinks));
    setBusy(false);
  }

  return (
    <main className="space-y-4">
      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-900">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Join the crew</h2>
        <p className="mt-1 text-xs text-stone-400">
          Share the weekly leaderboard with everyone using Sip Happens.
        </p>

        {usingProfileName ? (
          <>
            <button
              onClick={() => submit(profile.name)}
              disabled={busy}
              className="mt-4 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
            >
              {busy ? "Joining…" : `Join as ${profile.name}`}
            </button>
            <button
              onClick={() => {
                setOverride(true);
                setName("");
              }}
              className="mt-2 w-full text-center text-xs font-medium text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            >
              Use a different name
            </button>
          </>
        ) : (
          <>
            <label className="mt-4 block text-xs font-medium text-stone-500 dark:text-stone-400">
              Your name
              <input
                className={inputCls}
                placeholder="e.g. Ava"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                autoFocus
              />
            </label>
            <button
              onClick={() => submit()}
              disabled={busy || !name.trim()}
              className="mt-4 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
            >
              {busy ? "Joining…" : "Join the crew"}
            </button>
          </>
        )}

        {error && <p className="mt-2 text-center text-sm text-rose-600">{error}</p>}
      </section>
    </main>
  );
}

type Row = { id: string; name: string; std: number; count: number };

function GroupView({ membership }: { membership: Membership }) {
  const { code, deviceId } = membership;
  const [data, setData] = useState<{ members: Member[]; drinks: GroupDrink[]; reactions: Reaction[] }>(
    { members: [], drinks: [], reactions: [] }
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    fetchGroupData(code).then((d) => {
      if (active) setData(d);
    });
    return () => {
      active = false;
    };
  }, [code, tick]);

  // Live updates via Supabase Realtime, plus a slow poll as a fallback.
  useEffect(() => {
    const unsub = subscribeToGroup(code, () => setTick((n) => n + 1));
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => {
      unsub();
      clearInterval(t);
    };
  }, [code]);

  // drink id -> { emoji -> { count, mine } }
  const reactionsByDrink = useMemo(() => {
    const map = new Map<string, Map<string, { count: number; mine: boolean }>>();
    for (const r of data.reactions) {
      const per = map.get(r.drink_id) ?? new Map();
      const cur = per.get(r.emoji) ?? { count: 0, mine: false };
      cur.count += 1;
      if (r.device_id === deviceId) cur.mine = true;
      per.set(r.emoji, cur);
      map.set(r.drink_id, per);
    }
    return map;
  }, [data.reactions, deviceId]);

  function react(drinkId: string, emoji: string) {
    const mine = reactionsByDrink.get(drinkId)?.get(emoji)?.mine ?? false;
    toggleReaction(drinkId, emoji, mine).then(() => setTick((n) => n + 1));
  }

  const board = useMemo<Row[]>(() => {
    const start = weekStart();
    const map = new Map<string, Row>();
    for (const m of data.members) map.set(m.device_id, { id: m.device_id, name: m.name, std: 0, count: 0 });
    for (const d of data.drinks) {
      if (new Date(d.created_at) < start) continue;
      const r = map.get(d.device_id) ?? { id: d.device_id, name: d.name, std: 0, count: 0 };
      r.std += d.standard_drinks;
      r.count += 1;
      map.set(d.device_id, r);
    }
    return [...map.values()].sort((a, b) => b.std - a.std);
  }, [data]);

  const topId = board.length >= 2 && board[0].std > 0 ? board[0].id : null;
  const dryId = board.length >= 2 ? board[board.length - 1].id : null;

  return (
    <main className="space-y-5">
      <section className="rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white shadow-sm">
        <div className="text-xs font-medium text-white/80">🍻 The crew</div>
        <div className="text-2xl font-bold">
          {data.members.length} {data.members.length === 1 ? "member" : "members"}
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-stone-500 dark:text-stone-400">
          This week&apos;s leaderboard
        </h2>
        {board.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
            No one&apos;s logged anything yet — be the first!
          </p>
        ) : (
          <ul className="space-y-2">
            {board.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
              >
                <span className="w-5 text-center text-sm font-bold text-stone-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-stone-900 dark:text-stone-50">
                      {r.name}
                    </span>
                    {r.id === topId && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                        🍺 Alcoholic
                      </span>
                    )}
                    {r.id === dryId && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        🌿 Dry Week Champ
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    {r.count} drink{r.count === 1 ? "" : "s"}
                  </div>
                </div>
                <span className="text-sm font-bold text-stone-900 dark:text-stone-50">
                  {r.std.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-stone-500 dark:text-stone-400">
          Recent activity
        </h2>
        {data.drinks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
            No drinks logged in the group yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.drinks.slice(0, 30).map((d) => (
              <li
                key={d.id}
                className="rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-lg dark:bg-amber-500/10">
                    {DRINK_EMOJI[d.drink_type as keyof typeof DRINK_EMOJI] ?? "🍹"}
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold text-stone-900 dark:text-stone-50">{d.name}</span>{" "}
                    <span className="text-stone-500 dark:text-stone-400">had a {d.drink_name}</span>
                  </div>
                  <span className="shrink-0 text-[11px] text-stone-400">
                    {new Date(d.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {REACTIONS.map((emoji) => {
                    const info = reactionsByDrink.get(d.id)?.get(emoji);
                    const count = info?.count ?? 0;
                    const mine = info?.mine ?? false;
                    return (
                      <button
                        key={emoji}
                        onClick={() => react(d.id, emoji)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                          mine
                            ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10"
                            : "border-stone-200 hover:border-stone-300 dark:border-stone-700"
                        }`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && (
                          <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        onClick={leaveGroup}
        className="w-full rounded-full py-2 text-xs font-medium text-stone-400 hover:text-rose-500"
      >
        Leave group
      </button>
    </main>
  );
}
