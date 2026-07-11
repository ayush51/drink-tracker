"use client";

import { useState } from "react";
import { useProfile, useHydrated, saveProfile } from "@/lib/profile";

const MOTTO_SUGGESTIONS = ["No alcohol", "Stay dry", "Drink less", "One is enough"];

const inputCls =
  "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-stone-700 dark:bg-stone-900";

export default function OnboardingGate() {
  const hydrated = useHydrated();
  const profile = useProfile();

  const [name, setName] = useState("");
  const [motto, setMotto] = useState("");
  const [limit, setLimit] = useState("3");

  // Never render on the server / before hydration → no flash for returning users.
  if (!hydrated || profile.onboarded) return null;

  function finish() {
    if (!name.trim()) return;
    saveProfile({
      name: name.trim(),
      motto: motto.trim(),
      dailyLimitDrinks: Math.max(0, Number(limit) || 0),
      onboarded: true,
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-50 dark:bg-stone-950">
      {/* hero */}
      <div className="bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] px-6 pb-10 pt-14 text-center text-white">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16l-8 9-8-9Z" />
            <path d="M12 13v6M8 21h8M9 7h6" />
          </svg>
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Welcome to Sip Happens</h1>
        <p className="mx-auto mt-1 max-w-xs text-sm text-white/85">
          Track what you drink, stay under your limit, and build better habits.
        </p>
      </div>

      {/* form */}
      <div className="mx-auto max-w-md space-y-4 px-6 py-7">
        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
          What&apos;s your name?
          <input
            className={inputCls}
            placeholder="Your name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div>
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
            Your motto
            <input
              className={inputCls}
              placeholder="e.g. No alcohol"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MOTTO_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setMotto(s)}
                className="rounded-full border border-stone-300 px-2.5 py-1 text-xs text-stone-600 transition-colors hover:border-amber-500 hover:text-amber-600 dark:border-stone-700 dark:text-stone-300"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
          Daily limit (standard drinks)
          <input
            type="number"
            min="0"
            step="0.5"
            className={inputCls}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
          <span className="mt-1 block text-[11px] font-normal text-stone-400">
            You can change any of this later in Profile.
          </span>
        </label>

        <button
          onClick={finish}
          disabled={!name.trim()}
          className="w-full rounded-full bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] py-3 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
        >
          Get started
        </button>
      </div>
    </div>
  );
}
