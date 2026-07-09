"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useGroup,
  joinGroup,
  leaveGroup,
  generateCode,
  fetchGroupData,
  socialEnabled,
  type GroupDrink,
  type Member,
} from "@/lib/group";
import { DRINK_EMOJI } from "@/lib/drinks";

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

  return membership ? (
    <GroupView code={membership.code} />
  ) : (
    <JoinForm />
  );
}

function JoinForm() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(joinCode: string) {
    setBusy(true);
    setError(null);
    const res = await joinGroup(name, joinCode);
    if (!res.ok) setError(res.error ?? "Could not join.");
    setBusy(false);
  }

  return (
    <main className="space-y-4">
      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-900">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Join your crew</h2>
        <p className="mt-1 text-xs text-stone-400">
          Enter a code your friends share, or start a new group and send them the code.
        </p>

        <label className="mt-4 block text-xs font-medium text-stone-500 dark:text-stone-400">
          Your name
          <input
            className={inputCls}
            placeholder="What friends call you"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="mt-3 block text-xs font-medium text-stone-500 dark:text-stone-400">
          Group code
          <input
            className={`${inputCls} uppercase tracking-widest`}
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </label>

        <button
          onClick={() => submit(code)}
          disabled={busy || !name.trim() || !code.trim()}
          className="mt-4 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
        >
          {busy ? "Joining…" : "Join group"}
        </button>

        <div className="my-3 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-stone-400">
          <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
          or
          <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        </div>

        <button
          onClick={() => {
            const c = generateCode();
            setCode(c);
            submit(c);
          }}
          disabled={busy || !name.trim()}
          className="w-full rounded-full border border-stone-300 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Start a new group
        </button>

        {error && <p className="mt-2 text-center text-sm text-rose-600">{error}</p>}
      </section>
    </main>
  );
}

type Row = { id: string; name: string; std: number; count: number };

function GroupView({ code }: { code: string }) {
  const [data, setData] = useState<{ members: Member[]; drinks: GroupDrink[] }>({
    members: [],
    drinks: [],
  });
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetchGroupData(code).then((d) => {
      if (active) setData(d);
    });
    return () => {
      active = false;
    };
  }, [code, tick]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

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

  function copyCode() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="space-y-5">
      <section className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white shadow-sm">
        <div>
          <div className="text-xs font-medium text-white/80">Group code</div>
          <div className="text-2xl font-bold tracking-widest">{code}</div>
        </div>
        <button
          onClick={copyCode}
          className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/30"
        >
          {copied ? "Copied!" : "Share code"}
        </button>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-stone-500 dark:text-stone-400">
          This week&apos;s leaderboard
        </h2>
        {board.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
            No one&apos;s here yet. Share your code to get the crew in.
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
                className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
              >
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
